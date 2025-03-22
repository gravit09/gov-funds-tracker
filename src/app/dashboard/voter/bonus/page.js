'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';

export default function BonusPage() {
  const [bonusTime, setBonusTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [selectedVoter, setSelectedVoter] = useState('');
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const connectToContract = async () => {
    try {
      if (!selectedVoter) {
        setError('Please select a voter account first');
        setConnectionStatus('Connection failed: No account selected');
        return;
      }

      setIsLoading(true);
      setError('');

      const provider = new ethers.JsonRpcProvider(
        "http://127.0.0.1:8545",
        { 
          chainId: 31337,
          name: 'hardhat',
          ensAddress: null,
          ensNetwork: null
        }
      );

      // Test the connection
      await provider.getNetwork();

      // Rest of the connection logic...
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white">Performance Bonus Status</h1>
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
            <h5 className="font-semibold text-white mb-2">Select Voter Account</h5>
            <select 
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              value={selectedVoter}
              onChange={(e) => setSelectedVoter(e.target.value)}
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
              className="w-full mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              onClick={connectToContract}
            >
              Connect as Selected Voter
            </button>
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
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-xl">⭐</span>
                <span>View Ratings</span>
              </Link>
              <Link
                href="/dashboard/voter/bonus"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-500 text-white transition-colors"
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
                <h2 className="text-2xl font-bold text-white mb-6">Performance Bonus Information</h2>
                
                <div className="space-y-6">
                  <button 
                    className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    onClick={() => {}}
                  >
                    Check Time Until Next Bonus
                  </button>

                  {bonusTime && (
                    <div className="bg-gray-700/50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-4">Next Bonus Distribution</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-yellow-400">{bonusTime.hours}</p>
                          <p className="text-gray-400">Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-yellow-400">{bonusTime.minutes}</p>
                          <p className="text-gray-400">Minutes</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-center mt-4">
                        until the next performance bonus distribution
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">About Performance Bonuses</h3>
                    <p className="text-gray-400">
                      Performance bonuses are distributed based on entity ratings. The higher the average rating,
                      the larger the bonus pool. Bonuses are distributed every 24 hours to entities that have
                      received votes.
                    </p>
                  </div>
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
            <p className="mt-2 text-white">Loading bonus information...</p>
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