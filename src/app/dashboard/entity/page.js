"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import IPFSUpload from "@/components/IPFSUpload";
import addresses from "@/config/addresses.json";

export default function EntityDashboard() {
  // State declarations
  const [activeTab, setActiveTab] = useState("connection");
  const [connectionStatus, setConnectionStatus] = useState("Not Connected");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [entityInfo, setEntityInfo] = useState("");
  const [spendingRecords, setSpendingRecords] = useState("");
  const [fundRequests, setFundRequests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ethersModule, setEthersModule] = useState(null);

  // Contract configuration
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contractABI = [
    "function recordSpending(string memory title, uint256 amount, string memory ipfsUri) public",
    "function getEntityDetails(address entityAddress) public view returns (string memory name, bool isActive, uint256 balance)",
    "function getSpendingRecords(address entityAddress) public view returns (tuple(uint256 id, address entity, uint256 amount, uint256 timestamp)[] memory)",
    "function getEntitySpendingRecords(address entityAddress, uint256 offset, uint256 limit) public view returns (tuple(uint256 id, address entity, string purpose, uint256 amount, string documentHash, uint256 timestamp)[] memory)",
    "function issueTender(string memory title, string memory description, uint256 amount, uint256 deadline, uint256 minBidAmount, uint256 maxBidAmount) public",
    "function placeBid(uint256 tenderId, uint256 amount) public payable",
    "function withdrawBid(uint256 tenderId) public",
    "function awardTender(uint256 tenderId) public",
    "function cancelTender(uint256 tenderId) public",
    "function getTenders(uint256 offset, uint256 limit) public view returns (tuple(uint256 id, string title, string description, uint256 amount, uint256 deadline, address issuer, bool isActive, address winner, uint256 winningBid, uint256 minBidAmount, uint256 maxBidAmount, uint256 bidCount)[] memory)",
    "function getBids(uint256 tenderId) public view returns (tuple(uint256 id, address bidder, uint256 amount, uint256 timestamp, bool isWithdrawn)[] memory)",
    "function getTenderDetails(uint256 tenderId) public view returns (tuple(uint256 id, string title, string description, uint256 amount, uint256 deadline, address issuer, bool isActive, address winner, uint256 winningBid, uint256 minBidAmount, uint256 maxBidAmount, uint256 bidCount))",
    "function getAllEntityAddresses() public view returns (address[] memory)",
  ];

  // Get entity accounts from addresses.json
  const entityAccounts = Object.entries(addresses.accounts)
    .filter(([_, account]) => account.name.includes("Department"))
    .map(([address, account]) => ({
      address,
      name: account.name,
      privateKey: account.privateKey,
    }));

  // State for contract connection
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  // Add new state variables for micro-transactions
  const [microTransactionSpendingId, setMicroTransactionSpendingId] =
    useState("");
  const [microTransactionAmount, setMicroTransactionAmount] = useState("");
  const [microTransactionDescription, setMicroTransactionDescription] =
    useState("");
  const [microTransactionResult, setMicroTransactionResult] = useState("");
  const [selectedSpendingId, setSelectedSpendingId] = useState("");
  const [microTransactionsList, setMicroTransactionsList] = useState("");

  // Add new state variables for tender management
  const [tenderTitle, setTenderTitle] = useState("");
  const [tenderDescription, setTenderDescription] = useState("");
  const [tenderAmount, setTenderAmount] = useState("");
  const [tenderDeadline, setTenderDeadline] = useState("");
  const [minBidAmount, setMinBidAmount] = useState("");
  const [maxBidAmount, setMaxBidAmount] = useState("");
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [selectedTenderId2, setSelectedTenderId2] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [tenderResult, setTenderResult] = useState("");
  const [bidResult, setBidResult] = useState("");
  const [tendersList, setTendersList] = useState("");
  const [bidsList, setBidsList] = useState("");
  const [selectedBidId, setSelectedBidId] = useState("");

  // Connect to the contract
  const connectToContract = async () => {
    try {
      if (!selectedEntity) {
        throw new Error("Please select an entity account");
      }

      setIsLoading(true);
      setError("");

      // Connect to local Hardhat network
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

      // Get the private key for the selected entity
      const selectedAccount = entityAccounts.find(
        (acc) => acc.address === selectedEntity
      );
      if (!selectedAccount) {
        throw new Error("Selected entity not found");
      }

      const newSigner = new ethers.Wallet(selectedAccount.privateKey, provider);
      const newContract = new ethers.Contract(
        contractAddress,
        contractABI,
        newSigner
      );

      setSigner(newSigner);
      setContract(newContract);
      setConnectionStatus(`Connected as ${selectedAccount.name}`);
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

  // Get Entity Information
  const getEntityInfo = async () => {
    try {
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }

      setIsLoading(true);
      setError("");

      // Create a new provider
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

      // Test network connection
      try {
        await provider.getNetwork();
      } catch (error) {
        throw new Error(
          "Failed to connect to the blockchain network. Please ensure Hardhat is running."
        );
      }

      // Create contract instance
      const queryContract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
      );

      // Test contract connection
      try {
        await queryContract.getEntityDetails(selectedEntity);
      } catch (error) {
        throw new Error(
          "Failed to connect to the contract. Please check if the contract is deployed."
        );
      }

      // Get entity details
      const [name, isActive, balance] = await queryContract.getEntityDetails(
        selectedEntity
      );

      // Format the response
      if (!isActive) {
        setEntityInfo(`
          Name: ${name}<br>
          Status: Not Active<br>
          Balance: ${ethers.formatEther(balance)} ETH<br>
          <span class="text-red-400">This entity is not currently active in the system.</span>
        `);
        return;
      }

      setEntityInfo(`
        Name: ${name}<br>
        Status: Active<br>
        Balance: ${ethers.formatEther(balance)} ETH<br>
        <span class="text-green-400">Entity is active and can perform transactions.</span>
      `);
    } catch (error) {
      console.error("Get entity info error:", error);
      if (error.message.includes("not found")) {
        setEntityInfo(`
          <span class="text-red-400">Error: Entity not found. Please select a valid entity account.</span>
        `);
      } else if (error.message.includes("BAD_DATA")) {
        setEntityInfo(`
          <span class="text-red-400">Error: Failed to decode entity data. Please check if the contract is properly deployed and the entity address is correct.</span>
        `);
      } else if (
        error.message.includes("Failed to connect to the blockchain network")
      ) {
        setEntityInfo(`
          <span class="text-red-400">Error: ${error.message}</span>
        `);
      } else if (error.message.includes("Failed to connect to the contract")) {
        setEntityInfo(`
          <span class="text-red-400">Error: ${error.message}</span>
        `);
      } else {
        setEntityInfo(`
          <span class="text-red-400">Error: ${error.message}</span>
        `);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Record Spending
  const recordSpending = async (e) => {
    e.preventDefault();
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }

      setIsLoading(true);
      setError("");

      // Check if entity is active
      const [name, isActive, balance] = await contract.getEntityDetails(
        selectedEntity
      );
      if (!isActive) {
        throw new Error(
          `Entity "${name}" is not currently active in the system.`
        );
      }

      // Validate amount
      const amount = parseFloat(e.target.amount.value);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Get form values
      const title = e.target.title.value;
      const ipfsUri = e.target.ipfsUri.value;

      // Validate required fields
      if (!title || !ipfsUri) {
        throw new Error("Title and IPFS URI are required");
      }

      // Convert amount to Wei
      const amountInWei = ethers.parseEther(amount.toString());

      // Record spending
      const tx = await contract.recordSpending(title, amountInWei, ipfsUri);
      await tx.wait();
      alert("Spending recorded successfully!");
    } catch (error) {
      console.error("Spending record error:", error);
      if (error.message.includes("not active")) {
        setError(`Error: ${error.message}`);
      } else if (error.message.includes("Amount must be greater than 0")) {
        setError("Error: Amount must be greater than 0");
      } else {
        setError("Error: Failed to record spending. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get Spending Records
  const getSpendingRecords = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");

      const offset = parseInt(e.target.offset.value);
      const limit = parseInt(e.target.limit.value);
      const records = await contract.getEntitySpendingRecords(
        selectedEntity,
        offset,
        limit
      );

      let html = "";
      records.forEach((record) => {
        html += `
          ID: ${record.id.toString()}<br>
          Purpose: ${record.purpose}<br>
          Amount: ${ethers.formatEther(record.amount)} ETH<br>
          Document Hash: ${record.documentHash}<br>
          Timestamp: ${formatTimestamp(record.timestamp)}<br><br>
        `;
      });
      setSpendingRecords(html);
    } catch (error) {
      setError(error.message);
      setSpendingRecords("");
    } finally {
      setIsLoading(false);
    }
  };

  // Request Funds
  const requestFunds = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");

      const amount = ethers.parseEther(e.target.amount.value);
      const reason = e.target.reason.value;
      const documentHash = e.target.documentHash.value;

      const tx = await contract.requestFunds(amount, reason, documentHash);
      await tx.wait();
      alert("Fund request submitted successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Fund Requests
  const getFundRequests = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");

      const offset = parseInt(e.target.offset.value);
      const limit = parseInt(e.target.limit.value);
      const requests = await contract.getEntityFundRequests(
        selectedEntity,
        offset,
        limit
      );

      let html = "";
      requests.forEach((request) => {
        html += `
          ID: ${request.id.toString()}<br>
          Amount: ${ethers.formatEther(request.amount)} ETH<br>
          Reason: ${request.reason}<br>
          Document Hash: ${request.documentHash}<br>
          Timestamp: ${formatTimestamp(request.timestamp)}<br>
          Status: ${
            request.isApproved
              ? "Approved"
              : request.isRejected
              ? "Rejected"
              : "Pending"
          }<br><br>
        `;
      });
      setFundRequests(html);
    } catch (error) {
      setError(error.message);
      setFundRequests("");
    } finally {
      setIsLoading(false);
    }
  };

  // Record micro-transaction
  const recordMicroTransaction = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }
      if (!microTransactionSpendingId) {
        throw new Error("Please enter a spending ID");
      }
      if (!microTransactionAmount) {
        throw new Error("Please enter an amount");
      }
      if (!microTransactionDescription) {
        throw new Error("Please enter a description");
      }

      // Validate and convert amount
      const amount = parseFloat(microTransactionAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount. Please enter a positive number.");
      }

      setIsLoading(true);
      setError("");
      setMicroTransactionResult("Processing transaction...");

      // Convert amount to Wei
      const amountInWei = ethers.parseEther(amount.toString());

      // Check if entity is active and get balance
      const [name, isActive, balance, needToSpend] =
        await contract.getEntityDetails(selectedEntity);
      if (!isActive) {
        throw new Error(
          `Entity "${name}" is not currently active in the system.`
        );
      }

      // Check if entity has sufficient needToSpend balance
      if (amountInWei > needToSpend) {
        throw new Error(
          `Insufficient needToSpend balance. Available: ${ethers.formatEther(
            needToSpend
          )} ETH`
        );
      }

      // Submit the micro-transaction with correct parameter order
      const tx = await contract.recordMicroTransaction(
        microTransactionSpendingId,
        amountInWei,
        microTransactionDescription
      );

      setMicroTransactionResult(
        "Transaction submitted. Waiting for confirmation..."
      );
      await tx.wait();

      // Clear form and show success message
      setMicroTransactionSpendingId("");
      setMicroTransactionAmount("");
      setMicroTransactionDescription("");
      setMicroTransactionResult(
        "Micro-transaction recorded successfully! Thank you for your submission."
      );

      // Refresh micro-transactions list if viewing a specific spending record
      if (selectedSpendingId === microTransactionSpendingId) {
        await getMicroTransactions();
      }
    } catch (error) {
      console.error("Micro-transaction error:", error);
      if (error.message.includes("not active")) {
        setMicroTransactionResult(
          "Error: This entity is not currently active in the system."
        );
      } else if (error.message.includes("needToSpend")) {
        setMicroTransactionResult(
          "Error: Insufficient needToSpend balance for this transaction."
        );
      } else {
        setMicroTransactionResult("Error: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get micro-transactions
  const getMicroTransactions = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }
      if (!selectedSpendingId) {
        throw new Error("Please enter a spending ID");
      }

      // Validate spending ID
      const spendingId = parseInt(selectedSpendingId);
      if (isNaN(spendingId) || spendingId <= 0) {
        throw new Error("Invalid spending ID. Please enter a positive number.");
      }

      setIsLoading(true);
      setError("");
      setMicroTransactionsList("Loading micro-transactions...");

      // First check if the spending record exists and belongs to the entity
      const spendingRecords = await contract.getEntitySpendingRecords(
        selectedEntity,
        0,
        100
      ); // Get up to 100 records
      const spendingRecord = spendingRecords.find(
        (record) => record.id.toString() === spendingId.toString()
      );

      if (!spendingRecord) {
        throw new Error(
          `Spending record with ID ${spendingId} not found or you are not authorized to view micro-transactions for this spending record.`
        );
      }

      const transactions = await contract.getMicroTransactions(spendingId);

      if (!transactions || transactions.length === 0) {
        setMicroTransactionsList(
          `No micro-transactions found for spending record ${spendingId}`
        );
        return;
      }

      let result = `Micro-transactions for Spending Record ${spendingId}:\n\n`;
      transactions.forEach((tx) => {
        result += `
          ID: ${tx.id.toString()}
          Amount: ${ethers.formatEther(tx.amount)} ETH
          Description: ${tx.description}
          Timestamp: ${new Date(Number(tx.timestamp) * 1000).toLocaleString()}
          ------------------------
        `;
      });
      setMicroTransactionsList(result);
    } catch (error) {
      console.error("Get micro-transactions error:", error);
      if (error.message.includes("not found")) {
        setMicroTransactionsList(
          "Error: Spending record not found. Please enter a valid spending ID."
        );
      } else if (error.message.includes("not authorized")) {
        setMicroTransactionsList(
          "Error: You are not authorized to view micro-transactions for this spending record."
        );
      } else {
        setMicroTransactionsList("Error: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Issue Tender
  const issueTender = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }

      setIsLoading(true);
      setError("");

      // Basic input validation
      if (
        !tenderTitle ||
        !tenderDescription ||
        !tenderAmount ||
        !tenderDeadline ||
        !minBidAmount ||
        !maxBidAmount
      ) {
        throw new Error("All fields are required");
      }

      // Convert amounts to Wei
      const amount = ethers.parseEther(tenderAmount);
      const minBid = ethers.parseEther(minBidAmount);
      const maxBid = ethers.parseEther(maxBidAmount);

      // Convert deadline to timestamp
      const deadline = Math.floor(new Date(tenderDeadline).getTime() / 1000);

      // Check if entity is active
      const [name, isActive, balance] = await contract.getEntityDetails(
        selectedEntity
      );
      if (!isActive) {
        throw new Error(
          `Entity "${name}" is not currently active in the system.`
        );
      }

      // Check if entity has sufficient balance
      if (balance < amount) {
        throw new Error(
          `Insufficient balance. Required: ${ethers.formatEther(
            amount
          )} ETH, Available: ${ethers.formatEther(balance)} ETH`
        );
      }

      // Issue tender
      const tx = await contract.issueTender(
        tenderTitle,
        tenderDescription,
        amount,
        deadline,
        minBid,
        maxBid
      );
      await tx.wait();

      setTenderResult("Tender issued successfully!");
      setTenderTitle("");
      setTenderDescription("");
      setTenderAmount("");
      setTenderDeadline("");
      setMinBidAmount("");
      setMaxBidAmount("");
    } catch (error) {
      console.error("Issue tender error:", error);
      setTenderResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Place bid on tender
  const placeBid = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }
      if (!selectedTenderId || !bidAmount) {
        throw new Error("Please enter tender ID and bid amount");
      }

      // Validate and convert amount
      const amount = parseFloat(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount. Please enter a positive number.");
      }

      setIsLoading(true);
      setError("");
      setBidResult("Processing bid...");

      // Convert amount to Wei
      const amountInWei = ethers.parseEther(amount.toString());

      // Place the bid
      const tx = await contract.placeBid(selectedTenderId, amountInWei);
      await tx.wait();

      // Clear form and show success message
      setSelectedTenderId("");
      setBidAmount("");
      setBidResult("Bid placed successfully!");
    } catch (error) {
      console.error("Bid placement error:", error);
      setBidResult("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw bid
  const withdrawBid = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }
      if (!selectedTenderId || !selectedBidId) {
        throw new Error("Please enter tender ID and bid ID");
      }

      setIsLoading(true);
      setError("");
      setBidResult("Processing bid withdrawal...");

      // Withdraw the bid
      const tx = await contract.withdrawBid(selectedTenderId, selectedBidId);
      await tx.wait();

      // Clear form and show success message
      setSelectedTenderId("");
      setSelectedBidId("");
      setBidResult("Bid withdrawn successfully!");
    } catch (error) {
      console.error("Bid withdrawal error:", error);
      setBidResult("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel tender
  const cancelTender = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedEntity) {
        throw new Error("Please select an entity account first");
      }
      if (!selectedTenderId) {
        throw new Error("Please enter tender ID");
      }

      setIsLoading(true);
      setError("");
      setTenderResult("Processing tender cancellation...");

      // Cancel the tender
      const tx = await contract.cancelTender(selectedTenderId);
      await tx.wait();

      // Clear form and show success message
      setSelectedTenderId("");
      setTenderResult("Tender cancelled successfully!");
    } catch (error) {
      console.error("Tender cancellation error:", error);
      setTenderResult("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all tenders
  const getTenders = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }

      setIsLoading(true);
      setError("");
      setTendersList("Loading tenders...");

      const tenders = await contract.getTenders(0, 100); // Get up to 100 tenders
      let result = "";
      tenders.forEach((tender) => {
        if (tender.isActive) {
          result += `
            ID: ${tender.id.toString()}
            Title: ${tender.title}
            Description: ${tender.description}
            Amount: ${ethers.formatEther(tender.amount)} ETH
            Deadline: ${new Date(
              Number(tender.deadline) * 1000
            ).toLocaleString()}
            Issuer: ${tender.issuer}
            Status: Active
            Minimum Bid: ${ethers.formatEther(tender.minBidAmount)} ETH
            Maximum Bid: ${ethers.formatEther(tender.maxBidAmount)} ETH
            Bid Count: ${tender.bidCount.toString()}
            ------------------------
          `;
        }
      });
      setTendersList(result);
    } catch (error) {
      console.error("Get tenders error:", error);
      setTendersList("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get bids for a specific tender
  const getBids = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedTenderId) {
        throw new Error("Please enter a tender ID");
      }

      setIsLoading(true);
      setError("");
      setBidsList("Loading bids...");

      const bids = await contract.getBids(selectedTenderId);
      const tenderDetails = await contract.getTenderDetails(selectedTenderId);

      let result = `Tender Details:
        Title: ${tenderDetails.title}
        Amount: ${ethers.formatEther(tenderDetails.amount)} ETH
        Deadline: ${new Date(
          Number(tenderDetails.deadline) * 1000
        ).toLocaleString()}
        Status: ${tenderDetails.isActive ? "Active" : "Awarded"}
        Winner: ${tenderDetails.winner}
        Winning Bid: ${ethers.formatEther(tenderDetails.winningBid)} ETH
        Minimum Bid: ${ethers.formatEther(tenderDetails.minBidAmount)} ETH
        Maximum Bid: ${ethers.formatEther(tenderDetails.maxBidAmount)} ETH
        Bid Count: ${tenderDetails.bidCount.toString()}
        
        Bids:
        ------------------------
      `;

      bids.forEach((bid) => {
        if (!bid.isWithdrawn) {
          result += `
            ID: ${bid.id.toString()}
            Bidder: ${bid.bidder}
            Amount: ${ethers.formatEther(bid.amount)} ETH
            Time: ${new Date(Number(bid.timestamp) * 1000).toLocaleString()}
            Status: Active
            ------------------------
          `;
        }
      });
      setBidsList(result);
    } catch (error) {
      console.error("Get bids error:", error);
      setBidsList("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Award tender
  const awardTender = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedTenderId) {
        throw new Error("Please enter a tender ID");
      }

      setIsLoading(true);
      setError("");

      // Get tender details first to validate
      const tenderDetails = await contract.getTenderDetails(selectedTenderId);
      
      // Check if tender exists and is active
      if (!tenderDetails.isActive) {
        throw new Error("This tender is not active or has already been awarded");
      }

      // Check if the current user is the issuer
      if (tenderDetails.issuer.toLowerCase() !== selectedEntity.toLowerCase()) {
        throw new Error("Only the tender issuer can award the tender");
      }

      // Check if there are any bids
      if (tenderDetails.bidCount === 0) {
        throw new Error("Cannot award tender with no bids");
      }

      // Award the tender
      const tx = await contract.awardTender(selectedTenderId);
      await tx.wait();

      setTenderResult(`
          Tender awarded successfully!
          Transaction hash: ${tx.hash}
      `);

      // Refresh tender list
      await getTenders();
    } catch (error) {
      console.error("Award tender error:", error);
      setTenderResult(`
          Error awarding tender: ${error.message}
      `);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation items
  const tabs = [
    { id: "connection", label: "Connect Wallet" },
    { id: "overview", label: "Overview" },
    { id: "funds", label: "Fund Management" },
    { id: "ipfs", label: "IPFS Upload" },
    { id: "spending", label: "Spending Records" },
    { id: "tenders", label: "Tender Management" },
    { id: "requests", label: "Fund Requests" },
    { id: "ratings", label: "Entity Ratings" },
  ];

  // Render section content based on active section
  const renderSectionContent = () => {
    switch (activeTab) {
      case "connection":
        return (
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Connection Status
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Entity Account
                </label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                >
                  <option value="">Select an entity...</option>
                  {entityAccounts.map((account) => (
                    <option key={account.address} value={account.address}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className={`text-${
                  connectionStatus.includes("Connected") ? "green" : "gray"
                }-300 flex items-center`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    connectionStatus.includes("Connected")
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-500"
                  }`}
                ></span>
                {connectionStatus}
              </div>
              <button
                onClick={connectToContract}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                Connect as Selected Entity
              </button>
            </div>
          </div>
        );
      case "info":
        return (
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Entity Information
            </h2>
            <button
              onClick={getEntityInfo}
              className="bg-blue-600/20 text-blue-400 px-6 py-2 rounded-lg hover:bg-blue-600/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              Get Entity Information
            </button>
            <div
              className="mt-6 p-4 bg-gray-700/30 rounded-lg text-gray-300 border border-gray-600/50"
              dangerouslySetInnerHTML={{ __html: entityInfo }}
            />
          </div>
        );
      case "spending":
        return (
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Spending Management
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Record New Spending
                </label>
                <form onSubmit={recordSpending} className="space-y-4">
                  <input
                    type="text"
                    name="title"
                    placeholder="Spending Title"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                  />
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount (ETH)"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                  />
                  <input
                    type="text"
                    name="ipfsUri"
                    placeholder="IPFS URI"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    Record Spending
                  </button>
                </form>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  View Entity Spending Records
                </label>
                <form onSubmit={getSpendingRecords} className="space-y-4">
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      name="offset"
                      placeholder="Offset"
                      defaultValue="0"
                      className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                    />
                    <input
                      type="number"
                      name="limit"
                      placeholder="Limit"
                      defaultValue="5"
                      className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600/20 text-blue-400 px-6 py-2 rounded-lg hover:bg-blue-600/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    >
                      Query
                    </button>
                  </div>
                  <div
                    className="p-4 bg-gray-700/30 rounded-lg text-gray-300 border border-gray-600/50"
                    dangerouslySetInnerHTML={{ __html: spendingRecords }}
                  />
                </form>
              </div>

            
    

                {/* Record Micro-transaction */}
                {/* <div className="space-y-4 mb-6">
                  <h3 className="text-md font-medium text-gray-300">
                    Record Micro-transaction
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={microTransactionSpendingId}
                      onChange={(e) =>
                        setMicroTransactionSpendingId(e.target.value)
                      }
                      placeholder="Spending ID"
                      className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={microTransactionAmount}
                      onChange={(e) =>
                        setMicroTransactionAmount(e.target.value)
                      }
                      placeholder="Amount (ETH)"
                      className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    value={microTransactionDescription}
                    onChange={(e) =>
                      setMicroTransactionDescription(e.target.value)
                    }
                    placeholder="Description"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={recordMicroTransaction}
                    disabled={isLoading}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    Record Micro-transaction
                  </button>
                  {microTransactionResult && (
                    <div className="mt-2 text-sm text-gray-300">
                      {microTransactionResult}
                    </div>
                  )}
                </div> */}

                {/* View Micro-transactions */}
                {/* <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-300">
                    View Micro-transactions
                  </h3>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      value={selectedSpendingId}
                      onChange={(e) => setSelectedSpendingId(e.target.value)}
                      placeholder="Spending ID"
                      className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={getMicroTransactions}
                      disabled={isLoading}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      View Micro-transactions
                    </button>
                  </div>
                  {microTransactionsList && (
                    <pre className="mt-2 p-4 bg-gray-700/30 rounded-lg text-sm text-gray-300 overflow-x-auto">
                      {microTransactionsList}
                    </pre>
                  )}
                </div> */}
              </div>
            </div>
        );
      case "funds":
        return (
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Fund Request Management
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Request Funds from Central Government
                </label>
                <form onSubmit={requestFunds} className="space-y-4">
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount (ETH)"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                  />
                  <input
                    type="text"
                    name="reason"
                    placeholder="Reason for Request"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                  />
                  <input
                    type="text"
                    name="documentHash"
                    placeholder="Document Hash"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                  />
                  <button
                    type="submit"
                    className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                  >
                    Submit Fund Request
                  </button>
                </form>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  View Fund Requests
                </label>
                <form onSubmit={getFundRequests} className="space-y-4">
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      name="offset"
                      placeholder="Offset"
                      defaultValue="0"
                      className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                    />
                    <input
                      type="number"
                      name="limit"
                      placeholder="Limit"
                      defaultValue="5"
                      className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600/20 text-blue-400 px-6 py-2 rounded-lg hover:bg-blue-600/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    >
                      Query
                    </button>
                  </div>
                  <div
                    className="p-4 bg-gray-700/30 rounded-lg text-gray-300 border border-gray-600/50"
                    dangerouslySetInnerHTML={{ __html: fundRequests }}
                  />
                </form>
              </div>
            </div>
          </div>
        );
      case "ipfs":
        return (
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              IPFS Document Upload
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IPFSUpload />
              <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-4">
                  IPFS Upload Guide
                </h3>
                <div className="space-y-4 text-gray-300">
                  <p>To upload documents to IPFS:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Select the document you want to upload</li>
                    <li>Click "Upload to IPFS"</li>
                    <li>Once uploaded, you'll receive an IPFS hash and URI</li>
                    <li>
                      Use the IPFS hash in your fund requests or spending
                      records
                    </li>
                  </ol>
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-400 mb-2">
                      Supported File Types:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>PDF Documents (.pdf)</li>
                      <li>Word Documents (.doc, .docx)</li>
                      <li>Text Files (.txt)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "tenders":
        return (
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-8 border border-gray-700/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Tender Management
            </h2>

            {/* Issue Tender Form */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-white mb-4">
                Issue New Tender
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={tenderTitle}
                  onChange={(e) => setTenderTitle(e.target.value)}
                  placeholder="Tender Title (min 3 characters)"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  value={tenderDescription}
                  onChange={(e) => setTenderDescription(e.target.value)}
                  placeholder="Tender Description (min 10 characters)"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    value={tenderAmount}
                    onChange={(e) => setTenderAmount(e.target.value)}
                    placeholder="Amount (ETH)"
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={minBidAmount}
                    onChange={(e) => setMinBidAmount(e.target.value)}
                    placeholder="Min Bid (ETH)"
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={maxBidAmount}
                    onChange={(e) => setMaxBidAmount(e.target.value)}
                    placeholder="Max Bid (ETH)"
                    className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="datetime-local"
                  value={tenderDeadline}
                  onChange={(e) => setTenderDeadline(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={issueTender}
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  Issue Tender
                </button>
     
              </div>
            </div>

            {/* View Active Tenders */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-white mb-4">
                Active Tenders
              </h3>
              <button
                onClick={getTenders}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
              >
                Get Active Tenders
              </button>
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg whitespace-pre-wrap text-gray-300">
                {tendersList}
              </div>
            </div>

            
            {/* View Bids */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-white mb-4">View Bids</h3>
              <div className="space-y-4">
                <input
                  type="number"
                  value={selectedTenderId}
                  onChange={(e) => setSelectedTenderId(e.target.value)}
                  placeholder="Tender ID"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={getBids}
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  Get Bids
                </button>
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg whitespace-pre-wrap text-gray-300">
                  {bidsList}
                </div>
              </div>
            </div>

            {/* Award/Cancel Tender Form */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Award/Cancel Tender
              </h3>
              <div className="space-y-4">
                <input
                  type="number"
                  value={selectedTenderId2}
                  onChange={(e) => setSelectedTenderId2(e.target.value)}
                  placeholder="Tender ID"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={awardTender}
                    disabled={isLoading}
                    className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    Award Tender
                  </button>
                  <button
                    onClick={cancelTender}
                    disabled={isLoading}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    Cancel Tender
                  </button>
                  
                </div>
                <div className="mt-2 p-2 bg-gray-700/50 rounded text-gray-300">
                    {tenderResult}
                  </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex">
        {/* Side Navigation */}
        <div className="w-64 bg-gray-800/30 backdrop-blur-md border-r border-gray-700/50 min-h-screen shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                  activeTab === "connection"
                    ? "bg-green-500"
                    : activeTab === "info"
                    ? "bg-blue-500"
                    : activeTab === "spending"
                    ? "bg-purple-500"
                    : activeTab === "funds"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
              ></span>
              Entity Dashboard
            </h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("connection")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "connection"
                    ? "bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    : "text-gray-300 hover:bg-gray-700/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                }`}
              >
                Connection Status
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "info"
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "text-gray-300 hover:bg-gray-700/50 hover:shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                }`}
              >
                Entity Information
              </button>
              <button
                onClick={() => setActiveTab("spending")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "spending"
                    ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "text-gray-300 hover:bg-gray-700/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                }`}
              >
                Spending Management
              </button>
              <button
                onClick={() => setActiveTab("ipfs")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "ipfs"
                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    : "text-gray-300 hover:bg-gray-700/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                }`}
              >
                IPFS Upload
              </button>
              <button
                onClick={() => setActiveTab("funds")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "funds"
                    ? "bg-yellow-600 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    : "text-gray-300 hover:bg-gray-700/50 hover:shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                }`}
              >
                Fund Requests
              </button>
              <button
                onClick={() => setActiveTab("tenders")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  activeTab === "tenders"
                    ? "bg-pink-600 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    : "text-gray-300 hover:bg-gray-700/50 hover:shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                }`}
              >
                Tender Management
              </button>
            </nav>
            <div className="mt-8 pt-8 border-t border-gray-700/50">
              <a
                href="/"
                className="block text-center text-blue-400 hover:text-blue-300 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
              >
                Back to Role Selection
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto py-6 px-8">
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                {error}
              </div>
            )}
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div
              className={`inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)] ${
                activeTab === "connection"
                  ? "border-green-500"
                  : activeTab === "info"
                  ? "border-blue-500"
                  : activeTab === "spending"
                  ? "border-purple-500"
                  : activeTab === "funds"
                  ? "border-yellow-500"
                  : "border-blue-500"
              }`}
            ></div>
            <p className="mt-4 text-gray-300">Processing transaction...</p>
          </div>
        </div>
      )}
    </div>
  );
}
