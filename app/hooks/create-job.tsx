/* simple react hook template */
import Web3 from "web3";
import { useEffect, useState } from "react";
import GoodhiveJobContract from "@/contracts/GoodhiveJobContract.json";
import {
  GoodHiveWalletAddress,
  GoodhiveContractAddress,
} from "@constants/common";
import TokenAbi from "@/contracts/TokenAbi.json";
interface Props {
  walletAddress: string;
  token: string;
}

export const useCreateJob = (props: Props) => {
  const { walletAddress } = props;
  const [web3, setWeb3] = useState<any>();
  const [contract, setContract] = useState<any>();

  const handleUpdateEscrowAmount = async (id: number, amount: number) => {
    await fetch(`/api/companies/update-escrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, escrowAmount: amount }),
    });
  };
  const waitForTransactionReceipt = async (txHash: `0x${string}`) => {
    if (!window.ethereum) return;
    while (true) {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash], // Fix: Pass txHash as a single string
      });
      if (receipt) {
        return receipt;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };
  const requestApproval = async (amount: number) => {
    const token = props.token;
    if (!window.ethereum) return "";
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return console.log("no accout found");
    }
    const contract: any = new web3.eth.Contract(TokenAbi, props.token, {
      from: accounts[0],
    });
    const tx = contract.methods
      .approve(
        GoodhiveContractAddress,
        web3.utils.toWei(
          amount.toString(),
          props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
            ? "mwei"
            : "ether"
        )
      )
      .encodeABI();
    try {
      const receipt = {
        from: accounts[0],
        gas: "21000",
        to: token,
        data: tx,
      };
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });
      await waitForTransactionReceipt(txHash);
    } catch (error) {
      console.error("Error approving token transfer:", error);
      throw error;
    }
  };

  const createContreact = async () => {
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const contract = new web3.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress
    );
    setWeb3(web3);
    setContract(contract);
  };

  const createJobTx = async (jobId: number, amount: number) => {
    try {
      const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
      const balance = await checkBalanceTx(jobId);
      if (!window.ethereum) return "";
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const EndingBalance = Number(balance) + Number(amount);
      await requestApproval(amount);
      if (accounts.length === 0) {
        return console.log("no accout found");
      }
      const contract: any = new web3.eth.Contract(
        GoodhiveJobContract.abi,
        GoodhiveContractAddress,
        { from: accounts[0] }
      );
      const tx = contract.methods
        .createJob(
          jobId,
          web3.utils.toWei(
            amount.toString(),
            props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
              ? "mwei"
              : "ether"
          ),
          props.token
        )
        .encodeABI();

      try {
        // Send the transaction
        const receipt = {
          from: accounts[0],
          to: GoodhiveContractAddress,
          data: tx,
          gas: "210000",
        };
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [receipt as any],
        });
        await waitForTransactionReceipt(txHash);
      } catch (error) {
        throw error;
      }
      handleUpdateEscrowAmount(jobId, EndingBalance);
    } catch (error) {
      console.error("Error putting funds in:", error);
      throw error;
    }
  };

  const checkBalanceTx = async (jobId: number) => {
    try {
      const balance = await contract.methods.checkBalance(jobId).call();

      const balanceInEther =
        Number(balance) /
        (props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
          ? 1000000
          : 1);
      return balanceInEther;
    } catch (error) {
      console.error("Error checking balance:", error);
      return 0;
    }
  };

  const withdrawFundsTx = async (jobId: number, amount: number) => {
    if (!window.ethereum) return "";
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return console.log("no accout found");
    }
    const contract: any = new web3.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress,
      { from: accounts[0] }
    );
    const tx = contract.methods
      .withdrawFunds(
        jobId,
        web3.utils.toWei(
          amount.toString(),
          props.token === "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
            ? "mwei"
            : "ether"
        )
      )
      .encodeABI();
    try {
      const balance = await checkBalanceTx(jobId);
      const EndingBalance = Number(balance) - Number(amount);
      const receipt = {
        from: accounts[0],
        gas: "21000",
        to: GoodhiveContractAddress,
        data: tx,
      };
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });
      await waitForTransactionReceipt(txHash);
      handleUpdateEscrowAmount(jobId, EndingBalance);
    } catch (error) {
      console.error("Error approving token transfer:", error);
      throw error;
    }
  };

  const transferFundsTx = async (jobId: number, amount: number) => {
    if (!window.ethereum) return "";
    const web3 = new Web3(process.env.NEXT_PUBLIC_GOODHIVE_INFURA_API);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      return console.log("no accout found");
    }
    const contract: any = new web3.eth.Contract(
      GoodhiveJobContract.abi,
      GoodhiveContractAddress,
      { from: accounts[0] }
    );
    const tx = contract.methods
      .sendTheFees(jobId, web3.utils.toWei(amount.toString(), "mwei"))
      .encodeABI();
    try {
      const balance = await checkBalanceTx(jobId);
      const EndingBalance = Number(balance) - Number(amount);
      const receipt = {
        from: accounts[0],
        gas: "21000",
        to: GoodhiveContractAddress,
        data: tx,
      };
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [receipt as any],
      });
      await waitForTransactionReceipt(txHash);
      handleUpdateEscrowAmount(jobId, EndingBalance);
    } catch (error) {
      console.error("Error approving token transfer:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (walletAddress) {
      createContreact();
    }
  }, [walletAddress]);

  return { createJobTx, checkBalanceTx, withdrawFundsTx, transferFundsTx };
};
