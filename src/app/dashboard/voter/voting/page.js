"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";

export default function VotingPage() {
  const [selectedVoter, setSelectedVoter] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  // Contract configuration
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contractABI = [
    "function voteForEntity(address entityAddress, uint256 rating) public",
    "function getEntityHappinessRating(address entityAddress) public view returns (uint256 rating, uint256 totalVotes, uint256 lastVoteTime)",
    "function checkVotingStatus(address voter) public view returns (bool)",
  ];

  // Connect to the contract
  const connectToContract = async () => {
    try {
      if (!selectedVoter) {
        setError("Please select a voter account first");
        setConnectionStatus("Connection failed: No account selected");
        return;
      }

      setIsLoading(true);
      setError("");

      // Create provider with the correct chain ID
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", {
        chainId: 31337,
        name: "hardhat",
        ensAddress: null,
        ensNetwork: null,
      });

      // Use the selected account's private key
      const privateKey =
        selectedVoter === "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"
          ? "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0"
          : "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";

      const newSigner = new ethers.Wallet(privateKey, provider);
      const newContract = new ethers.Contract(
        contractAddress,
        contractABI,
        newSigner
      );

      // Test the connection by making a call
      await provider.getNetwork();

      setSigner(newSigner);
      setContract(newContract);
      setConnectionStatus(`Connected as: ${selectedVoter}`);
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionStatus(`Connection failed: ${error.message}`);
      setError(error.message);
      setSigner(null);
      setContract(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account selection
  const handleAccountSelect = (e) => {
    const value = e.target.value;
    setSelectedVoter(value);
    // Clear connection status and contract when changing accounts
    if (value !== selectedVoter) {
      setConnectionStatus("");
      setContract(null);
      setSigner(null);
      setError("");
    }
  };

  // Submit vote
  const submitVote = async (entityAddress) => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!selectedRating) {
        throw new Error("Please select a rating");
      }
      if (!entityAddress) {
        throw new Error("Please enter an entity address");
      }

      setIsLoading(true);
      setError("");

      // First check if already voted
      const hasVoted = await contract.checkVotingStatus(entityAddress);
      if (hasVoted) {
        throw new Error(
          "You have already voted for this entity. You can only vote once per entity."
        );
      }

      const tx = await contract.voteForEntity(entityAddress, selectedRating);
      await tx.wait();

      // Clear form and show success message
      document.getElementById("entityAddress").value = "";
      setSelectedRating(0);
      setError(
        "Vote submitted successfully! Thank you for your participation."
      );
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes("already voted")) {
        setError(
          "You have already voted for this entity. You can only vote once per entity."
        );
      } else if (error.message.includes("not active")) {
        setError("This entity is not currently active in the system.");
      } else if (error.message.includes("insufficient funds")) {
        setError("Transaction failed due to insufficient funds.");
      } else {
        setError(
          error.message ||
            "An error occurred while submitting your vote. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white">
              Vote for Entity Performance
            </h1>
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              Back to Role Selection
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-gray-800/50 backdrop-blur-sm border-r border-gray-700">
          {/* Account Selection */}
          <div className="p-4 border-b border-gray-700">
            <h5 className="font-semibold text-white mb-2">
              Select Voter Account
            </h5>
            <select
              value={selectedVoter}
              onChange={handleAccountSelect}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">Select an account</option>
              <option value="0xdD2FD4581271e230360230F9337D5c0430Bf44C0">
                Voter 1 (0xdD2F...44C0)
              </option>
              <option value="0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199">
                Voter 2 (0x8626...1199)
              </option>
            </select>
            <button
              onClick={connectToContract}
              className="w-full mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Connect as Selected Voter
            </button>
            {connectionStatus && (
              <p
                className={`mt-2 text-sm ${
                  connectionStatus.includes("failed")
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {connectionStatus}
              </p>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-4">
            <div className="space-y-2">
              <Link
                href="/dashboard/voter"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-xl">📊</span>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/voter/voting"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-500 text-white transition-colors"
              >
                <span className="text-xl">🗳️</span>
                <span>Vote</span>
              </Link>
              <Link
                href="/dashboard/voter/ratings"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-xl">⭐</span>
                <span>View Ratings</span>
              </Link>
              <Link
                href="/dashboard/voter/bonus"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-xl">💰</span>
                <span>Performance Bonus</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Cast Your Vote
                </h2>

                <div className="space-y-6">
                  {/* Entity Selection */}
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Select Entity
                    </label>
                    <input
                      type="text"
                      id="entityAddress"
                      placeholder="Enter Entity Address"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Rating Selection */}
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Performance Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(rating)}
                          className={`flex-1 p-3 rounded-lg transition-colors ${
                            rating <= selectedRating
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {rating} Star{rating !== 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      submitVote(document.getElementById("entityAddress").value)
                    }
                    disabled={!contract || !selectedRating}
                  >
                    {!contract ? "Connect Account to Vote" : "Submit Vote"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-white">Processing transaction...</p>
          </div>
        </div>
      )}

      {/* Error/Success Display */}
      {error && (
        <div
          className={`fixed bottom-4 right-4 backdrop-blur-sm border px-4 py-3 rounded-lg ${
            error.includes("successfully")
              ? "bg-green-900/50 border-green-500 text-green-200"
              : "bg-red-900/50 border-red-500 text-red-200"
          }`}
        >
          {error}
        </div>
      )}
    </div>
  );
}
