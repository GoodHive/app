// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Interface for the ERC20 token transfer function
interface ERC20Token {
    function transfer(address recipient, uint256 amount) external payable returns (bool);
    function balanceOf(address account) external  view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external payable returns (bool);
    function approve(address spender, uint256 amount) external payable returns (bool);
    function allowance(address owner, address spender) external  returns (uint256);
}
contract GoodhiveJobContract {
    address internal usdctoken = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;
    address internal daitoken = 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063;
    address internal ageur = 0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4;
    address internal eurotoken = 0x4d0B6356605e6FA95c025a6f6092ECcf0Cf4317b;

    address internal owner = 0x92ED8F6A9211F9eb0F16c83A052E75099B7bf4A5;
    struct Job {
        address user;
        uint256 amount;
        address token;
    }
    mapping(uint128 => Job) public jobs;
    event JobCreated(uint128 indexed jobId, address indexed sender, uint256 amount);
    event PayFees(address indexed recipient, uint256 amount);
    event AllFundsWithdrawn(address indexed recipient, uint256 amount);
    event Allowence(uint total);
    event FailedToPayTheFees(bool);
    // Function to create a job by sending Matic to this contract
    function createJob(uint128 jobId, uint256 amount, address token) external payable {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to use this jobid");
        }
        jobs[jobId].user = msg.sender;
        if(token!=usdctoken && token!=daitoken && token!=ageur && token!=eurotoken){
            require(false, "Invalid token address");
        }
        ERC20Token _Token = ERC20Token(token);
        require(amount > 0, "Amount should be greater than 0");
        require(_Token.allowance(msg.sender, address(this))>=amount, "Insufficient Allowence");
        require(_Token.balanceOf(msg.sender)>=(amount), "Insufficient balance");
        require(_Token.transferFrom(msg.sender, address(this), (amount)), "Transfer failed");
        
        if (jobs[jobId].amount > 0) {
            jobs[jobId].amount += amount;
        } else {
            jobs[jobId] = Job(msg.sender, amount, token);
        }

        emit JobCreated(jobId, msg.sender, amount);
    }
   
    // Function to check the job balance for a specific user
    function checkBalance(uint128 jobId) external view returns (uint256) {
        return jobs[jobId].amount;
    }

    function sendTheFees(uint128 jobId, uint256 amount) external {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to pay the fees");
        }
        if(jobs[jobId].amount == 0){
            require(false, "Insufficient balance");
        }
        ERC20Token _Token = ERC20Token(jobs[jobId].token);
        require(amount > 0, "Amount should be greater than 0");
        require(amount <= jobs[jobId].amount, "Insufficient balance");
        jobs[jobId].amount -= amount;
        require(_Token.transfer(owner, amount), "Failed to transfer");
        emit PayFees(msg.sender, amount);
    }
    // Function to withdraw all funds from the job to the user wallet
    function withdrawFunds(uint128 jobId, uint256 amount) external {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to use this jobid");
        }
        ERC20Token _Token = ERC20Token(jobs[jobId].token);
        require(amount > 0, "No balance to withdraw");
        require(jobs[jobId].amount>=amount, "Insufficient balance");
        require(_Token.transfer(msg.sender, amount), "Failed to transfer");
        jobs[jobId].amount -= amount;
        emit AllFundsWithdrawn(msg.sender, amount);
    }

    function withdrawAllFunds(uint128 jobId) external {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to use this jobid");
        }
        ERC20Token _Token = ERC20Token(jobs[jobId].token);
        uint256 amount = jobs[jobId].amount;
        require(amount > 0, "No balance to withdraw");
        require(_Token.transfer(msg.sender, jobs[jobId].amount));
        jobs[jobId].amount = 0;
        emit AllFundsWithdrawn(msg.sender, amount);
    }

    function myAddress() external view returns(address){
        return address(this);
    }
}