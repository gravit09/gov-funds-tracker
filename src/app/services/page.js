'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../component/navbar';

export default function Services() {
  const router = useRouter();
  const services = [
    {
      title: 'Web Development',
      description: 'Custom website development using modern technologies.',
      icon: '🌐'
    },
    {
      title: 'Mobile Apps',
      description: 'Native and cross-platform mobile application development.',
      icon: '📱'
    },
    {
      title: 'Cloud Solutions',
      description: 'Cloud infrastructure and deployment services.',
      icon: '☁️'
    }
  ];

  return (
    <Navbar />

  );
} 