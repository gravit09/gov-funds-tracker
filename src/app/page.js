'use client';
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Government Spending Registry
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          A blockchain-powered platform for transparent and efficient government spending management.
        </p>
      </div>

      {/* Quotes Section */}
      <div className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <p className="text-gray-300 italic mb-4">
              "Transparency in government spending is not just about accountability; it's about building trust with citizens."
            </p>
            <p className="text-gray-400">- Blockchain Governance Expert</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <p className="text-gray-300 italic mb-4">
              "Blockchain technology revolutionizes how we track and verify government expenditures."
            </p>
            <p className="text-gray-400">- Public Finance Specialist</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <p className="text-gray-300 italic mb-4">
              "Real-time tracking of government funds ensures efficient resource allocation and prevents misuse."
            </p>
            <p className="text-gray-400">- Government Accountability Advocate</p>
          </div>
        </div>
      </div>

      {/* Role Selection Section */}
      <div className="container mx-auto px-4 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Select Your Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Central Government Card */}
          <Link 
            href="/dashboard/central-government"
            className="block bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 transform transition-all hover:-translate-y-2 hover:shadow-lg hover:shadow-blue-500/20 border border-gray-700"
          >
            <div className="text-4xl mb-4">👑</div>
            <h3 className="text-2xl font-semibold mb-4">Central Government</h3>
            <p className="text-gray-300 mb-6">
              Manage government entities, issue funds, and monitor spending records.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Register new entities
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Issue funds to entities
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Monitor spending records
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Process fund requests
              </li>
            </ul>
          </Link>

          {/* Government Entity Card */}
          <Link 
            href="/dashboard/entity"
            className="block bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 transform transition-all hover:-translate-y-2 hover:shadow-lg hover:shadow-blue-500/20 border border-gray-700"
          >
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="text-2xl font-semibold mb-4">Government Entity</h3>
            <p className="text-gray-300 mb-6">
              Record spending, request funds, and manage your entity's transactions.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Record spending transactions
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Request additional funds
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                View transaction history
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Track fund balance
              </li>
            </ul>
          </Link>

          {/* Voter Card */}
          <Link 
            href="/dashboard/voter"
            className="block bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 transform transition-all hover:-translate-y-2 hover:shadow-lg hover:shadow-yellow-500/20 border border-gray-700"
          >
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="text-2xl font-semibold mb-4">Voter</h3>
            <p className="text-gray-300 mb-6">
              Rate government entities and participate in performance evaluation.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Rate entity performance
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                View entity ratings
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Track voting history
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Monitor bonus distribution
              </li>
            </ul>
          </Link>

          {/* Citizen Card */}
          <Link 
            href="/dashboard/citizen"
            className="block bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 transform transition-all hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 border border-gray-700"
          >
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-2xl font-semibold mb-4">Citizen</h3>
            <p className="text-gray-300 mb-6">
              View spending records, track fund allocation, and monitor government performance.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                View spending records
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Track fund allocation
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Monitor entity performance
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Access public reports
              </li>
            </ul>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-400">
        <p>Built with Next.js and Ethereum</p>
        <p className="mt-2">© 2024 Government Spending Registry. All rights reserved.</p>
      </footer>
    </div>
  );
}
