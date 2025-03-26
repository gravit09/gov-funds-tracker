"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import addresses from "@/config/addresses.json";

export default function TenderDashboard() {
  // State declarations
  const [activeTab, setActiveTab] = useState("connection");
  const [connectionStatus, setConnectionStatus] = useState("Not Connected");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Contract configuration
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contractABI = [
    "function placeBid(uint256 tenderId, uint256 amount) external payable",
    "function withdrawBid(uint256 tenderId) public",
    "function getBids(uint256 tenderId) public view returns (tuple(uint256 id, address bidder, uint256 amount, uint256 timestamp, bool isWithdrawn)[] memory)",
    "function getTenderDetails(uint256 tenderId) public view returns (tuple(uint256 id, string title, string description, uint256 amount, uint256 deadline, address issuer, bool isActive, address winner, uint256 winningBid, uint256 minBidAmount, uint256 maxBidAmount, uint256 bidCount))",
    "function getTenders(uint256 offset, uint256 limit) public view returns (tuple(uint256 id, string title, string description, uint256 amount, uint256 deadline, address issuer, bool isActive, address winner, uint256 winningBid, uint256 minBidAmount, uint256 maxBidAmount, uint256 bidCount)[] memory)",
    "function registerEntity(string memory name) public",
    "function approveEntity(address entityAddress) public"
  ];

  // Get all accounts from addresses.json
  const accounts = Object.entries(addresses.accounts)
    .filter(([address]) => 
      address.toLowerCase() === "0xa0ee7a142d267c1f36714e4a8f75612f20a79720".toLowerCase() ||
      address.toLowerCase() === "0xbcd4042de499d14e55001ccbb24a551f3b954096".toLowerCase()
    )
    .map(([address, account]) => ({
      address,
      name: account.name,
      privateKey: account.privateKey,
    }));

  // State for contract connection
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  // Add new state variables for bid management
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidResult, setBidResult] = useState("");
  const [tendersList, setTendersList] = useState("");
  const [bidsList, setBidsList] = useState("");

  // Connect to the contract
  const connectToContract = async () => {
    try {
      if (!selectedAccount) {
        throw new Error("Please select an account");
      }

      setIsLoading(true);
      setError("");

      // Connect to local Hardhat network
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

      // Get the private key for the selected account
      const account = accounts.find((acc) => acc.address === selectedAccount);
      if (!account) {
        throw new Error("Selected account not found");
      }

      const newSigner = new ethers.Wallet(account.privateKey, provider);
      const newContract = new ethers.Contract(
        contractAddress,
        contractABI,
        newSigner
      );

      setSigner(newSigner);
      setContract(newContract);
      setConnectionStatus(`Connected as ${account.name}`);
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionStatus(`Connection failed: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  // Place Bid
  const placeBid = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }

      setIsLoading(true);
      setError("");

      // Validate inputs
      if (!selectedTenderId || !bidAmount) {
        throw new Error("Tender ID and bid amount are required");
      }

      // Convert bid amount to Wei
      const amount = ethers.parseEther(bidAmount);

      // Get bidder's address
      const bidderAddress = await signer.getAddress();

      // Get tender details to validate bid
      const tender = await contract.getTenderDetails(selectedTenderId);
      
      // Additional validations
      if (!tender) {
        throw new Error("Tender not found");
      }

      if (!tender.isActive) {
        throw new Error("This tender is no longer active");
      }

      if (amount < tender.minBidAmount) {
        throw new Error(`Bid amount is below minimum bid of ${ethers.formatEther(tender.minBidAmount)} ETH`);
      }

      if (amount > tender.maxBidAmount) {
        throw new Error(`Bid amount exceeds maximum bid of ${ethers.formatEther(tender.maxBidAmount)} ETH`);
      }

      // Check if tender deadline has passed
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > Number(tender.deadline)) {
        throw new Error("Tender deadline has passed");
      }

      // Check if bidder is the issuer
      if (bidderAddress.toLowerCase() === tender.issuer.toLowerCase()) {
        throw new Error("Tender issuer cannot place bids on their own tender");
      }

      // First, try to register the entity
      try {
        const registerTx = await contract.registerEntity("Bidder Entity");
        await registerTx.wait();
      } catch (error) {
        console.log("Entity registration skipped or already registered");
      }

      // Then try to approve the entity
      try {
        const approveTx = await contract.approveEntity(bidderAddress);
        await approveTx.wait();
      } catch (error) {
        console.log("Entity approval skipped or already approved");
      }

      // Place bid with ETH value
      const tx = await contract.placeBid(selectedTenderId, amount, {
        value: amount,
        gasLimit: 300000
      });

      setBidResult("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setBidResult("Bid placed successfully!");
      
      // Clear form
      setSelectedTenderId("");
      setBidAmount("");
    } catch (error) {
      console.error("Place bid error:", error);
      if (error.message.includes("insufficient funds")) {
        setBidResult("Error: Insufficient funds to place bid");
      } else if (error.message.includes("user rejected")) {
        setBidResult("Error: Transaction was rejected");
      } else if (error.message.includes("non-payable function")) {
        setBidResult("Error: The contract function does not accept ETH payments");
      } else {
        setBidResult(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw Bid
  const withdrawBid = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }

      setIsLoading(true);
      setError("");

      // Validate inputs
      if (!selectedTenderId) {
        throw new Error("Tender ID is required");
      }

      // Withdraw bid
      const tx = await contract.withdrawBid(selectedTenderId);
      await tx.wait();
      setBidResult("Bid withdrawn successfully!");
      
      // Clear form
      setSelectedTenderId("");
    } catch (error) {
      console.error("Withdraw bid error:", error);
      setBidResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Tenders
  const getTenders = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }

      setIsLoading(true);
      setError("");

      // Get tenders
      const tenders = await contract.getTenders(0, 10);
      
      // Format tenders for display
      const formattedTenders = tenders.map(tender => `
        ID: ${tender.id}<br>
        Title: ${tender.title}<br>
        Description: ${tender.description}<br>
        Amount: ${ethers.formatEther(tender.amount)} ETH<br>
        Deadline: ${formatTimestamp(tender.deadline)}<br>
        Issuer: ${tender.issuer}<br>
        Status: ${tender.isActive ? "Active" : "Closed"}<br>
        Winner: ${tender.winner || "Not awarded"}<br>
        Winning Bid: ${tender.winningBid ? ethers.formatEther(tender.winningBid) + " ETH" : "Not awarded"}<br>
        Min Bid: ${ethers.formatEther(tender.minBidAmount)} ETH<br>
        Max Bid: ${ethers.formatEther(tender.maxBidAmount)} ETH<br>
        Bid Count: ${tender.bidCount}<br>
        <br>
      `).join("");

      setTendersList(formattedTenders);
    } catch (error) {
      console.error("Get tenders error:", error);
      setTendersList(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Bids
  const getBids = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }

      setIsLoading(true);
      setError("");

      // Validate inputs
      if (!selectedTenderId) {
        throw new Error("Tender ID is required");
      }

      // Get bids
      const bids = await contract.getBids(selectedTenderId);
      
      // Format bids for display
      const formattedBids = bids.map(bid => `
        ID: ${bid.id}<br>
        Bidder: ${bid.bidder}<br>
        Amount: ${ethers.formatEther(bid.amount)} ETH<br>
        Timestamp: ${formatTimestamp(bid.timestamp)}<br>
        Status: ${bid.isWithdrawn ? "Withdrawn" : "Active"}<br>
        <br>
      `).join("");

      setBidsList(formattedBids);
    } catch (error) {
      console.error("Get bids error:", error);
      setBidsList(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeTab) {
      case "connection":
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Select Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={connectToContract}
              disabled={isLoading || !selectedAccount}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Connecting..." : "Connect"}
            </button>
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
          </div>
        );

      case "place-bid":
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Tender ID</label>
              <input
                type="number"
                value={selectedTenderId}
                onChange={(e) => setSelectedTenderId(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter tender ID"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Bid Amount (ETH)</label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter bid amount"
                step="0.000000000000000001"
              />
            </div>
            <button
              onClick={placeBid}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Placing..." : "Place Bid"}
            </button>
            {bidResult && (
              <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: bidResult }} />
            )}
          </div>
        );

      case "withdraw-bid":
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Tender ID</label>
              <input
                type="number"
                value={selectedTenderId}
                onChange={(e) => setSelectedTenderId(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter tender ID"
              />
            </div>
            <button
              onClick={withdrawBid}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Withdrawing..." : "Withdraw Bid"}
            </button>
            {bidResult && (
              <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: bidResult }} />
            )}
          </div>
        );

      case "view-tenders":
        return (
          <div className="space-y-4">
            <button
              onClick={getTenders}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View All Tenders"}
            </button>
            {tendersList && (
              <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: tendersList }} />
            )}
          </div>
        );

      case "view-bids":
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Tender ID</label>
              <input
                type="number"
                value={selectedTenderId}
                onChange={(e) => setSelectedTenderId(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter tender ID"
              />
            </div>
            <button
              onClick={getBids}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View Bids"}
            </button>
            {bidsList && (
              <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: bidsList }} />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tender Bidding Dashboard</h1>
        
        {/* Connection Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-400">Connection Status:</span>
              <span className={`ml-2 ${connectionStatus.includes("Connected") ? "text-green-400" : "text-red-400"}`}>
                {connectionStatus}
              </span>
            </div>
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("connection")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "connection"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Connect
          </button>
          <button
            onClick={() => setActiveTab("place-bid")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "place-bid"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Place Bid
          </button>
          <button
            onClick={() => setActiveTab("withdraw-bid")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "withdraw-bid"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Withdraw Bid
          </button>
          <button
            onClick={() => setActiveTab("view-tenders")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "view-tenders"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            View Tenders
          </button>
          <button
            onClick={() => setActiveTab("view-bids")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "view-bids"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            View Bids
          </button>
        </div>

        {/* Content Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}
