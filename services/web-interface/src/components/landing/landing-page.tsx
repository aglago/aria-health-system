'use client';

import React from 'react';
import HeroSection from './hero-section';
import FeaturesSection from './features-section';
import HowItWorksSection from './how-it-works-section';
import TestimonialsSection from './testimonials-section';
import FooterSection from './footer-section';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <div id="features">
        <FeaturesSection />
      </div>
      
      {/* How It Works Section */}
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      
      {/* Testimonials & Stats Section */}
      <TestimonialsSection />
      
      {/* Footer */}
      <FooterSection />
    </div>
  );
}