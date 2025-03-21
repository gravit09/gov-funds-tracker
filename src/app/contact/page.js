'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Contact() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-8">
      <button 
        onClick={() => router.push('/')}
        className="mb-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
      >
        Back to Home
      </button>
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded-md"
              placeholder="Your email"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Message</label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows="4"
              placeholder="Your message"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
} 