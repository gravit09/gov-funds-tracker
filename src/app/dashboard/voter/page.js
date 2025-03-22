"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function VoterDashboard() {
  // State declarations
  const [selectedVoter, setSelectedVoter] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [allRatings, setAllRatings] = useState([]);
  const [entityRating, setEntityRating] = useState(null);
  const [bonusTime, setBonusTime] = useState(null);

  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("dashboard");

  const sidebarLinks = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "📊",
      href: "/dashboard/voter",
    },
    {
      id: "voting",
      label: "Vote",
      icon: "🗳️",
      href: "/dashboard/voter/voting",
    },
    {
      id: "ratings",
      label: "View Ratings",
      icon: "⭐",
      href: "/dashboard/voter/ratings",
    },
    {
      id: "bonus",
      label: "Performance Bonus",
      icon: "💰",
      href: "/dashboard/voter/bonus",
    },
  ];

  // Contract configuration
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contractABI = [
    "function voteForEntity(address entityAddress, uint256 rating) public",
    "function getEntityHappinessRating(address entityAddress) public view returns (uint256 rating, uint256 totalVotes, uint256 lastVoteTime)",
    "function getAllEntityRatings() public view returns (address[] memory addresses, uint256[] memory ratings, uint256[] memory votes)",
    "function checkVotingStatus(address voter) public view returns (bool)",
    "function getTimeUntilNextBonus() public view returns (uint256)",
  ];

  // Connect to the contract
  const connectToContract = async () => {
    try {
      // Clear any previous errors
      setError("");

      // Validate account selection
      if (!selectedVoter) {
        setError("Please select a voter account first");
        setConnectionStatus("Connection failed: No account selected");
        return;
      }

      setIsLoading(true);

      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", {
        chainId: 31337, // Updated to match hardhat.config.js
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

  // Get all entity ratings
  const getAllRatings = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(true);
      const [rating, totalVotes, lastVoteTime] =
        await contract.getEntityHappinessRating(address);
      setEntityRating({
        rating: rating.toString(),
        totalVotes: totalVotes.toString(),
        lastVoteTime: new Date(Number(lastVoteTime) * 1000).toLocaleString(),
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit vote
  const submitVote = async (entityAddress) => {
    try {
      if (!entityAddress) {
        throw new Error("Please enter an entity address");
      }
      if (!selectedRating) {
        throw new Error("Please select a rating");
      }
      if (!contract) {
        throw new Error("Please connect your account first");
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
      document.querySelector("input").value = "";
      setSelectedRating(0);
      setError(
        "Vote submitted successfully! Thank you for your participation."
      );

      // Update the entity rating display
      await getEntityRating(entityAddress);
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

  // Check time until next bonus
  const getBonusTime = async () => {
    try {
      setIsLoading(true);
      const timeUntil = await contract.getTimeUntilNextBonus();
      const hours = Math.floor(timeUntil.toNumber() / 3600);
      const minutes = Math.floor((timeUntil.toNumber() % 3600) / 60);
      setBonusTime({ hours, minutes });
    } catch (error) {
      setError(error.message);
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
            <h1 className="text-xl font-bold text-white">Voter Dashboard</h1>
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
              className={`w-full p-2 bg-gray-700 border rounded text-white transition-colors ${
                error && !selectedVoter
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-600"
              }`}
            >
              <option value="">Select an account</option>
              <option value="0xdD2FD4581271e230360230F9337D5c0430Bf44C0">
                Voter 1 (0xdD2F...44C0)
              </option>
              <option value="0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199">
                Voter 2 (0x8626...1199)
              </option>
            </select>
            {error && !selectedVoter && (
              <p className="mt-1 text-sm text-red-400">{error}</p>
            )}
            <button
              onClick={connectToContract}
              disabled={!selectedVoter || isLoading}
              className={`w-full mt-2 px-4 py-2 rounded transition-colors font-medium ${
                !selectedVoter || isLoading
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isLoading ? "Connecting..." : "Connect as Selected Voter"}
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
              {sidebarLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === link.href
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:bg-gray-700/50"
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {!contract ? (
            // Not connected state
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Welcome to the Voter Dashboard
                </h2>
                <p className="text-gray-300 mb-6">
                  Please select a voter account and connect to access the
                  dashboard features.
                </p>
                <div className="flex justify-center">
                  <span className="text-6xl">🗳️</span>
                </div>
              </div>
            </div>
          ) : (
            // Connected state - your existing dashboard content
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entity Ratings */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h5 className="font-semibold text-white">
                    Entity Performance Ratings
                  </h5>
                </div>
                <div className="p-4">
                  {allRatings.length > 0 ? (
                    <div className="space-y-4">
                      {allRatings.map((rating, index) => (
                        <div
                          key={index}
                          className="bg-gray-700/50 p-4 rounded-lg"
                        >
                          <p className="text-gray-300">
                            Entity: {rating.address}
                          </p>
                          <p className="text-gray-300">
                            Rating: {rating.rating}/5
                          </p>
                          <p className="text-gray-300">
                            Total Votes: {rating.votes}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">
                      No ratings available. Click "Get All Ratings" to view.
                    </p>
                  )}
                </div>
              </div>

              {/* Specific Entity Rating */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h5 className="font-semibold text-white">
                    Specific Entity Rating
                  </h5>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Entity Address"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white mb-4"
                    onChange={(e) => getEntityRating(e.target.value)}
                  />
                  {entityRating && (
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-gray-300">
                        Rating: {entityRating.rating}/5
                      </p>
                      <p className="text-gray-300">
                        Total Votes: {entityRating.totalVotes}
                      </p>
                      <p className="text-gray-300">
                        Last Vote Time: {entityRating.lastVoteTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Voting Section */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 md:col-span-2">
                <div className="p-4 border-b border-gray-700">
                  <h5 className="font-semibold text-white">
                    Vote for Entity Performance
                  </h5>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">
                        Entity Address
                      </label>
                      <input
                        type="text"
                        id="entityAddress"
                        placeholder="Enter entity address"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">
                        Select Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <span
                            key={rating}
                            className={`cursor-pointer text-2xl transition-colors ${
                              rating <= selectedRating
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }`}
                            onClick={() => setSelectedRating(rating)}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        submitVote(
                          document.getElementById("entityAddress").value
                        )
                      }
                      disabled={isLoading || !contract}
                      className={`w-full px-4 py-2 rounded transition-colors font-medium ${
                        isLoading || !contract
                          ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {isLoading ? "Submitting Vote..." : "Submit Vote"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bonus Time */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 md:col-span-2">
                <div className="p-4 border-b border-gray-700">
                  <h5 className="font-semibold text-white">
                    Performance Bonus Status
                  </h5>
                </div>
                <div className="p-4">
                  {bonusTime && (
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-gray-300">
                        Time until next bonus distribution:
                      </p>
                      <p className="text-gray-300">
                        {bonusTime.hours} hours and {bonusTime.minutes} minutes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-white">Connecting to network...</p>
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
