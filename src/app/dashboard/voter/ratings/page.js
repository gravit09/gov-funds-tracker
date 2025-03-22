"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";

export default function RatingsPage() {
  const [selectedVoter, setSelectedVoter] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");
  const [allRatings, setAllRatings] = useState([]);
  const [entityRating, setEntityRating] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  // Contract configuration
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contractABI = [
    "function getEntityHappinessRating(address entityAddress) public view returns (uint256 rating, uint256 totalVotes, uint256 lastVoteTime)",
    "function getAllEntityRatings() public view returns (address[] memory addresses, uint256[] memory ratings, uint256[] memory votes)",
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

      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", {
        chainId: 31337,
        name: "hardhat",
        ensAddress: null,
        ensNetwork: null,
      });

      // Test the connection
      await provider.getNetwork();

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

  // Get all entity ratings
  const getAllRatings = async () => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }

      setIsLoading(true);
      setError("");

      const [addresses, ratings, votes] = await contract.getAllEntityRatings();
      const ratingsData = addresses.map((address, index) => ({
        address,
        rating: ratings[index].toString(),
        votes: votes[index].toString(),
      }));
      setAllRatings(ratingsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get specific entity rating
  const getEntityRating = async (address) => {
    try {
      if (!contract) {
        throw new Error("Please connect your account first");
      }
      if (!address) {
        return;
      }

      setIsLoading(true);
      setError("");

      const [rating, totalVotes, lastVoteTime] =
        await contract.getEntityHappinessRating(address);
      setEntityRating({
        rating: rating.toString(),
        totalVotes: totalVotes.toString(),
        lastVoteTime: new Date(Number(lastVoteTime) * 1000).toLocaleString(),
      });
    } catch (error) {
      setError(error.message);
      setEntityRating(null);
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
              Entity Performance Ratings
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
              onChange={(e) => setSelectedVoter(e.target.value)}
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
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-xl">🗳️</span>
                <span>Vote</span>
              </Link>
              <Link
                href="/dashboard/voter/ratings"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-500 text-white transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* All Entity Ratings */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  All Entity Ratings
                </h2>
                <button
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={getAllRatings}
                  disabled={!contract}
                >
                  {!contract ? "Connect Account to View" : "Get All Ratings"}
                </button>

                <div className="space-y-4">
                  {allRatings.length > 0 ? (
                    allRatings.map((rating, index) => (
                      <div
                        key={index}
                        className="bg-gray-700/50 p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-gray-300 font-medium">
                            Entity {index + 1}
                          </p>
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-2">
                              {rating.rating}/5
                            </span>
                            <span className="text-gray-400">
                              ({rating.votes} votes)
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm break-all">
                          {rating.address}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      No ratings available. Click "Get All Ratings" to view.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Specific Entity Rating */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Specific Entity Rating
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Entity Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Entity Address"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => getEntityRating(e.target.value)}
                      disabled={!contract}
                    />
                  </div>

                  {entityRating && (
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-gray-300 font-medium">Rating</p>
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-2">
                            {entityRating.rating}/5
                          </span>
                          <span className="text-gray-400">
                            ({entityRating.totalVotes} votes)
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Last Vote Time: {entityRating.lastVoteTime}
                      </p>
                    </div>
                  )}
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
            <p className="mt-2 text-white">Loading ratings...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900/50 backdrop-blur-sm border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
