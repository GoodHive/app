// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GoodHive Job Manager Contract
 * @dev Manages jobs, funds, and commissions for the GoodHive platform
 * @author GoodHive Team
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract GoodHiveJobManager {

    // Owner and state management
    address public owner;
    bool public paused;
    uint256 private _reentrancyStatus;

    // Supported tokens on Polygon Amoy (testnet)
    address public constant USDC_AMOY = 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582;
    address public constant DAI_AMOY = 0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253;

    // Supported tokens on Polygon Mainnet (for production)
    address public constant USDC_MAINNET = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;
    address public constant DAI_MAINNET = 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063;

    // Fee percentages (basis points: 1000 = 10%)
    uint256 public constant TALENT_FEE = 1000;    // 10%
    uint256 public constant RECRUITER_FEE = 800;  // 8%
    uint256 public constant MENTOR_FEE = 1200;    // 12%
    uint256 public constant BASIS_POINTS = 10000; // 100%

    // Treasury address for collecting fees
    address public treasury;

    struct Job {
        address owner;
        uint256 databaseId;
        uint256 totalBalance;
        address tokenAddress;
        bool isApproved;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
        string chain; // "polygon" for mainnet, "polygon-amoy" for testnet
        // Service flags
        bool talentService;
        bool recruiterService;
        bool mentorService;
    }

    struct JobMetrics {
        uint256 totalFeesPaid;
        uint256 totalWithdrawn;
        uint256 transactionCount;
    }

    // Mapping from job ID to job data
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => JobMetrics) public jobMetrics;

    // Mapping to track user jobs
    mapping(address => uint256[]) public userJobs;

    // Mapping to check if database ID is already used
    mapping(uint256 => bool) public databaseIdUsed;

    // Counters
    uint256 public totalJobs;
    uint256 public activeJobs;

    // Events
    event JobCreated(
        uint256 indexed jobId,
        uint256 indexed databaseId,
        address indexed owner,
        address tokenAddress,
        string chain
    );

    event FundsAdded(
        uint256 indexed jobId,
        uint256 indexed databaseId,
        address indexed user,
        uint256 amount,
        address tokenAddress
    );

    event FundsWithdrawn(
        uint256 indexed jobId,
        uint256 indexed databaseId,
        address indexed user,
        uint256 amount,
        address tokenAddress
    );

    event FeePaid(
        uint256 indexed jobId,
        uint256 indexed databaseId,
        address indexed user,
        uint256 amount,
        address tokenAddress,
        string feeType
    );

    event JobApprovalChanged(
        uint256 indexed jobId,
        uint256 indexed databaseId,
        bool approved
    );

    event JobStatusChanged(
        uint256 indexed jobId,
        uint256 indexed databaseId,
        bool isActive
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    modifier nonReentrant() {
        require(_reentrancyStatus != 2, "ReentrancyGuard: reentrant call");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    modifier validToken(address tokenAddress) {
        require(isSupportedToken(tokenAddress), "Token not supported");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].owner != address(0), "Job does not exist");
        _;
    }

    modifier onlyJobOwner(uint256 jobId) {
        require(jobs[jobId].owner == msg.sender, "Not job owner");
        _;
    }

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        owner = msg.sender;
        treasury = _treasury;
        _reentrancyStatus = 1;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @dev Create a new job
     * @param databaseId Reference ID from the database
     * @param tokenAddress Address of the payment token
     * @param chain Chain identifier ("polygon" or "polygon-amoy")
     * @param talentService Whether talent service is enabled
     * @param recruiterService Whether recruiter service is enabled
     * @param mentorService Whether mentor service is enabled
     */
    function createJob(
        uint256 databaseId,
        address tokenAddress,
        string memory chain,
        bool talentService,
        bool recruiterService,
        bool mentorService
    ) external whenNotPaused validToken(tokenAddress) returns (uint256) {
        require(databaseId > 0, "Invalid database ID");
        require(!databaseIdUsed[databaseId], "Database ID already used");
        require(
            talentService || recruiterService || mentorService,
            "At least one service must be enabled"
        );

        uint256 jobId = totalJobs + 1;
        totalJobs++;
        activeJobs++;

        jobs[jobId] = Job({
            owner: msg.sender,
            databaseId: databaseId,
            totalBalance: 0,
            tokenAddress: tokenAddress,
            isApproved: false,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            chain: chain,
            talentService: talentService,
            recruiterService: recruiterService,
            mentorService: mentorService
        });

        databaseIdUsed[databaseId] = true;
        userJobs[msg.sender].push(jobId);

        emit JobCreated(jobId, databaseId, msg.sender, tokenAddress, chain);

        return jobId;
    }

    /**
     * @dev Add funds to a job
     * @param jobId The job ID to add funds to
     * @param amount Amount of tokens to add
     */
    function addFunds(uint256 jobId, uint256 amount)
        external
        whenNotPaused
        jobExists(jobId)
        onlyJobOwner(jobId)
        nonReentrant
    {
        require(amount > 0, "Amount must be greater than 0");
        require(jobs[jobId].isActive, "Job is not active");

        Job storage job = jobs[jobId];
        IERC20 token = IERC20(job.tokenAddress);

        // Check allowance
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        // Transfer tokens from user to contract
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Update job balance
        job.totalBalance += amount;
        job.updatedAt = block.timestamp;

        // Update metrics
        jobMetrics[jobId].transactionCount++;

        emit FundsAdded(jobId, job.databaseId, msg.sender, amount, job.tokenAddress);
    }

    /**
     * @dev Withdraw funds from a job
     * @param jobId The job ID to withdraw from
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 jobId, uint256 amount)
        external
        whenNotPaused
        jobExists(jobId)
        onlyJobOwner(jobId)
        nonReentrant
    {
        require(amount > 0, "Amount must be greater than 0");

        Job storage job = jobs[jobId];
        require(job.totalBalance >= amount, "Insufficient balance");

        // Update job balance
        job.totalBalance -= amount;
        job.updatedAt = block.timestamp;

        // Update metrics
        jobMetrics[jobId].totalWithdrawn += amount;
        jobMetrics[jobId].transactionCount++;

        // Transfer tokens to job owner
        IERC20 token = IERC20(job.tokenAddress);
        require(token.transfer(msg.sender, amount), "Transfer failed");

        emit FundsWithdrawn(jobId, job.databaseId, msg.sender, amount, job.tokenAddress);
    }

    /**
     * @dev Withdraw all funds from a job
     * @param jobId The job ID to withdraw all funds from
     */
    function withdrawAllFunds(uint256 jobId)
        external
        whenNotPaused
        jobExists(jobId)
        onlyJobOwner(jobId)
        nonReentrant
    {
        Job storage job = jobs[jobId];
        uint256 amount = job.totalBalance;
        require(amount > 0, "No funds to withdraw");

        // Update job balance
        job.totalBalance = 0;
        job.updatedAt = block.timestamp;

        // Update metrics
        jobMetrics[jobId].totalWithdrawn += amount;
        jobMetrics[jobId].transactionCount++;

        // Transfer all tokens to job owner
        IERC20 token = IERC20(job.tokenAddress);
        require(token.transfer(msg.sender, amount), "Transfer failed");

        emit FundsWithdrawn(jobId, job.databaseId, msg.sender, amount, job.tokenAddress);
    }

    /**
     * @dev Pay fees based on enabled services
     * @param jobId The job ID to pay fees for
     * @param baseAmount The base amount to calculate fees from
     */
    function payFees(uint256 jobId, uint256 baseAmount)
        external
        whenNotPaused
        jobExists(jobId)
        onlyJobOwner(jobId)
        nonReentrant
    {
        require(baseAmount > 0, "Base amount must be greater than 0");

        Job storage job = jobs[jobId];
        uint256 totalFees = calculateTotalFees(jobId, baseAmount);
        require(job.totalBalance >= totalFees, "Insufficient balance for fees");

        // Update job balance
        job.totalBalance -= totalFees;
        job.updatedAt = block.timestamp;

        // Update metrics
        jobMetrics[jobId].totalFeesPaid += totalFees;
        jobMetrics[jobId].transactionCount++;

        // Transfer fees to treasury
        IERC20 token = IERC20(job.tokenAddress);
        if (totalFees > 0) {
            require(token.transfer(treasury, totalFees), "Transfer to treasury failed");
        }

        // Emit fee events for each service
        if (job.talentService) {
            uint256 talentFee = (baseAmount * TALENT_FEE) / BASIS_POINTS;
            emit FeePaid(jobId, job.databaseId, msg.sender, talentFee, job.tokenAddress, "talent");
        }
        if (job.recruiterService) {
            uint256 recruiterFee = (baseAmount * RECRUITER_FEE) / BASIS_POINTS;
            emit FeePaid(jobId, job.databaseId, msg.sender, recruiterFee, job.tokenAddress, "recruiter");
        }
        if (job.mentorService) {
            uint256 mentorFee = (baseAmount * MENTOR_FEE) / BASIS_POINTS;
            emit FeePaid(jobId, job.databaseId, msg.sender, mentorFee, job.tokenAddress, "mentor");
        }
    }

    /**
     * @dev Calculate total fees for a job based on enabled services
     * @param jobId The job ID
     * @param baseAmount The base amount to calculate fees from
     * @return Total fees required
     */
    function calculateTotalFees(uint256 jobId, uint256 baseAmount)
        public
        view
        jobExists(jobId)
        returns (uint256)
    {
        Job storage job = jobs[jobId];
        uint256 totalFee = 0;

        if (job.talentService) {
            totalFee += (baseAmount * TALENT_FEE) / BASIS_POINTS;
        }
        if (job.recruiterService) {
            totalFee += (baseAmount * RECRUITER_FEE) / BASIS_POINTS;
        }
        if (job.mentorService) {
            totalFee += (baseAmount * MENTOR_FEE) / BASIS_POINTS;
        }

        return totalFee;
    }

    /**
     * @dev Set job approval status (only owner)
     * @param jobId The job ID
     * @param approved New approval status
     */
    function setJobApproval(uint256 jobId, bool approved)
        external
        onlyOwner
        jobExists(jobId)
    {
        jobs[jobId].isApproved = approved;
        jobs[jobId].updatedAt = block.timestamp;
        emit JobApprovalChanged(jobId, jobs[jobId].databaseId, approved);
    }

    /**
     * @dev Set job active status (only job owner or contract owner)
     * @param jobId The job ID
     * @param isActive New active status
     */
    function setJobStatus(uint256 jobId, bool isActive)
        external
        jobExists(jobId)
    {
        require(
            msg.sender == jobs[jobId].owner || msg.sender == owner,
            "Not authorized"
        );

        if (jobs[jobId].isActive != isActive) {
            jobs[jobId].isActive = isActive;
            jobs[jobId].updatedAt = block.timestamp;

            if (isActive) {
                activeJobs++;
            } else {
                if (activeJobs > 0) activeJobs--;
            }

            emit JobStatusChanged(jobId, jobs[jobId].databaseId, isActive);
        }
    }

    /**
     * @dev Check if a token is supported
     * @param tokenAddress Token address to check
     * @return Whether the token is supported
     */
    function isSupportedToken(address tokenAddress) public pure returns (bool) {
        return tokenAddress == USDC_AMOY ||
               tokenAddress == DAI_AMOY ||
               tokenAddress == USDC_MAINNET ||
               tokenAddress == DAI_MAINNET;
    }

    /**
     * @dev Get job details
     * @param jobId The job ID
     * @return Job struct data
     */
    function getJob(uint256 jobId)
        external
        view
        jobExists(jobId)
        returns (Job memory)
    {
        return jobs[jobId];
    }

    /**
     * @dev Get job metrics
     * @param jobId The job ID
     * @return JobMetrics struct data
     */
    function getJobMetrics(uint256 jobId)
        external
        view
        jobExists(jobId)
        returns (JobMetrics memory)
    {
        return jobMetrics[jobId];
    }

    /**
     * @dev Get jobs by user
     * @param user User address
     * @return Array of job IDs owned by the user
     */
    function getUserJobs(address user) external view returns (uint256[] memory) {
        return userJobs[user];
    }

    /**
     * @dev Get job balance
     * @param jobId The job ID
     * @return Current balance of the job
     */
    function getJobBalance(uint256 jobId)
        external
        view
        jobExists(jobId)
        returns (uint256)
    {
        return jobs[jobId].totalBalance;
    }

    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Transfer ownership of the contract
     * @param newOwner The new owner's address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Emergency withdrawal function (only owner)
     * @param tokenAddress Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount)
        external
        onlyOwner
        whenPaused
    {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(owner, amount), "Emergency withdrawal failed");
    }

    /**
     * @dev Get contract statistics
     * @return totalJobs_ Total number of jobs created
     * @return activeJobs_ Number of currently active jobs
     */
    function getContractStats()
        external
        view
        returns (uint256 totalJobs_, uint256 activeJobs_)
    {
        return (totalJobs, activeJobs);
    }

    /**
     * @dev Check if a database ID is already used
     * @param databaseId The database ID to check
     * @return Whether the database ID is already used
     */
    function isDatabaseIdUsed(uint256 databaseId) external view returns (bool) {
        return databaseIdUsed[databaseId];
    }
}