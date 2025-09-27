'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Brain, 
  Calendar, 
  Stethoscope,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const steps = [
  {
    step: "01",
    icon: MessageCircle,
    title: "Start Consultation",
    description: "Begin a conversation with Dr. ARIA, our advanced AI health assistant. Simply describe your symptoms or health concerns in natural language.",
    details: [
      "Available 24/7 for immediate help",
      "Natural language processing",
      "Multi-language support"
    ],
    color: "from-blue-500 to-cyan-500"
  },
  {
    step: "02", 
    icon: Brain,
    title: "AI Analysis",
    description: "Dr. ARIA conducts a comprehensive medical interview, analyzing your symptoms using advanced medical knowledge and diagnostic algorithms.",
    details: [
      "Medical-grade symptom analysis",
      "Risk assessment and urgency classification",
      "Personalized health recommendations"
    ],
    color: "from-purple-500 to-violet-500"
  },
  {
    step: "03",
    icon: Calendar,
    title: "Smart Booking",
    description: "Based on the analysis, the system automatically books you with the most suitable doctor and schedules your appointment at the best available time.",
    details: [
      "Automatic specialist assignment",
      "Optimal scheduling algorithms", 
      "Real-time availability checking"
    ],
    color: "from-green-500 to-emerald-500"
  },
  {
    step: "04",
    icon: Stethoscope,
    title: "Expert Care",
    description: "Meet with your assigned healthcare professional who has full access to your consultation history and can provide targeted treatment.",
    details: [
      "Qualified medical professionals",
      "Complete medical history access",
      "Continuity of care"
    ],
    color: "from-orange-500 to-amber-500"
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get the healthcare you need in four simple steps. Our streamlined process 
            ensures you receive expert medical attention quickly and efficiently.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-1/2 top-32 w-px h-24 bg-gradient-to-b from-indigo-300 to-purple-300 transform -translate-x-px z-0"></div>
              )}
              
              {/* Step Card */}
              <div className={`flex flex-col lg:flex-row items-center gap-8 mb-16 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                {/* Step Content */}
                <div className="flex-1 lg:max-w-md">
                  <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg`}>
                          {step.step}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {step.description}
                      </p>
                      
                      <ul className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Step Icon */}
                <div className="flex-shrink-0 relative z-10">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  
                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className={`hidden lg:block absolute top-1/2 ${index % 2 === 0 ? '-right-16' : '-left-16'} transform -translate-y-1/2`}>
                      <ArrowRight className={`w-8 h-8 text-indigo-400 ${index % 2 === 1 ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Start Your Health Journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-gray-600 mt-4">
            No appointment needed to get started • Available 24/7
          </p>
        </div>
      </div>
    </section>
  );
}