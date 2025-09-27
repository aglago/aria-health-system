'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Heart, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    { icon: Bot, text: "AI-Powered Health Assistant" },
    { icon: Heart, text: "24/7 Medical Support" },
    { icon: Users, text: "Expert Doctor Network" },
    { icon: Clock, text: "Instant Appointment Booking" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-400 rounded-full opacity-10 animate-bounce"></div>
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Logo and Branding */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            ARIA
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
            Health System
          </h2>
        </div>

        {/* Dynamic Feature Display */}
        <div className="mb-8 h-16 flex items-center justify-center">
          <div className="flex items-center space-x-3 transition-all duration-500 ease-in-out">
            {React.createElement(features[currentFeature].icon, {
              className: "w-8 h-8 text-indigo-600"
            })}
            <span className="text-xl md:text-2xl font-medium text-gray-700">
              {features[currentFeature].text}
            </span>
          </div>
        </div>

        {/* Main Tagline */}
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
          Revolutionizing campus healthcare with{' '}
          <span className="font-semibold text-indigo-600">AI-powered consultations</span>,{' '}
          <span className="font-semibold text-indigo-600">smart appointment booking</span>, and{' '}
          <span className="font-semibold text-indigo-600">personalized medical care</span> for 
          University of Mines and Technology students.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/role-selection">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300">
            Learn More
          </Button>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">24/7</div>
            <div className="text-gray-600">Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">AI</div>
            <div className="text-gray-600">Powered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">Expert</div>
            <div className="text-gray-600">Doctors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">Secure</div>
            <div className="text-gray-600">Platform</div>
          </div>
        </div>
      </div>
    </section>
  );
}