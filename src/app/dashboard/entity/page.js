'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import SimplifiedSpendingRegistry from '../../../../artifacts/contracts/SimplifiedSpendingRegistry.sol/SimplifiedSpendingRegistry.json';

export default function EntityDashboard() {
  const router = useRouter();
  const [contract, setContract] = useState(null);
  const [entityDetails, setEntityDetails] = useState(null);
  const [spendingRecords, setSpendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSpendingPurpose, setNewSpendingPurpose] = useState('');
  const [newSpendingAmount, setNewSpendingAmount] = useState('');

  useEffect(() => {
    const initContract = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
          const contract = new ethers.Contract(
            contractAddress,
            SimplifiedSpendingRegistry.abi,
            signer
          );
          setContract(contract);
          
          // Get entity details
          const address = await signer.getAddress();
          const details = await contract.getEntityDetails(address);
          
          // Verify if the entity is registered and active
          if (!details[1]) {
            alert('This account is not registered as an active government entity.');
            router.push('/roles');
            return;
          }
          
          setEntityDetails(details);
          
          // Get spending records
          const records = await contract.getEntitySpendingRecords(address, 0, 5);
          setSpendingRecords(records);
        }
      } catch (error) {
        console.error("Error initializing contract:", error);
      } finally {
        setLoading(false);
      }
    };

    initContract();
  }, [router]);

  const recordSpending = async () => {
    try {
      const amount = ethers.parseEther(newSpendingAmount);
      const tx = await contract.recordSpending(newSpendingPurpose, amount);
      await tx.wait();
      
      // Refresh data
      const address = await contract.signer.getAddress();
      const details = await contract.getEntityDetails(address);
      setEntityDetails(details);
      
      const records = await contract.getEntitySpendingRecords(address, 0, 5);
      setSpendingRecords(records);
      
      setNewSpendingPurpose('');
      setNewSpendingAmount('');
    } catch (error) {
      console.error("Error recording spending:", error);
      alert('Failed to record spending. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Government Entity Dashboard</h1>
          <button
            onClick={() => router.push('/roles')}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Back to Role Selection
          </button>
        </div>

        {/* Entity Details Card */}
        {entityDetails && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Entity Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium">{entityDetails[0]}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className={`font-medium ${entityDetails[1] ? 'text-green-600' : 'text-red-600'}`}>
                  {entityDetails[1] ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Balance</p>
                <p className="font-medium">{ethers.formatEther(entityDetails[2])} ETH</p>
              </div>
            </div>
          </div>
        )}

        {/* Record Spending Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Record New Spending</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose</label>
              <input
                type="text"
                value={newSpendingPurpose}
                onChange={(e) => setNewSpendingPurpose(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter spending purpose"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (ETH)</label>
              <input
                type="number"
                value={newSpendingAmount}
                onChange={(e) => setNewSpendingAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount in ETH"
                step="0.000000000000000001"
              />
            </div>
          </div>
          <button
            onClick={recordSpending}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Record Spending
          </button>
        </div>

        {/* Recent Spending Records */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Spending Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {spendingRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.id.toString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ethers.formatEther(record.amount)} ETH</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.timestamp * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 