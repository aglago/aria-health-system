'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bot, 
  Calendar, 
  Shield, 
  Zap, 
  FileText,
  Phone,
  Stethoscope,
  Brain,
  Activity
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: "AI-Powered Dr. ARIA",
    description: "Advanced AI assistant that conducts medical interviews, analyzes symptoms, and provides preliminary assessments with medical-grade accuracy.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Calendar,
    title: "Smart Appointment Booking",
    description: "Intelligent scheduling system that automatically assigns the right specialist based on your symptoms and urgency level.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Stethoscope,
    title: "Specialist Assignment",
    description: "Advanced algorithm matches you with the most suitable doctor based on your medical needs and doctor availability.",
    color: "from-purple-500 to-violet-500"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Bank-level encryption ensures your medical data is completely secure and confidential, following HIPAA standards.",
    color: "from-red-500 to-pink-500"
  },
  {
    icon: Activity,
    title: "Real-time Health Monitoring",
    description: "Continuous tracking of your health metrics and symptoms with instant alerts for concerning changes.",
    color: "from-orange-500 to-amber-500"
  },
  {
    icon: FileText,
    title: "Digital Medical Records",
    description: "Complete digital health records accessible by you and your healthcare providers for better continuity of care.",
    color: "from-indigo-500 to-blue-500"
  },
  {
    icon: Phone,
    title: "24/7 Emergency Support",
    description: "Round-the-clock access to emergency medical guidance and immediate connection to healthcare professionals.",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: Brain,
    title: "Mental Health Support",
    description: "Specialized AI modules for mental health screening and connection to counseling services when needed.",
    color: "from-pink-500 to-rose-500"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Better Health</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform combines cutting-edge AI technology with expert medical care 
            to provide you with the best possible healthcare experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg"
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 px-6 py-3 rounded-full">
            <Zap className="w-5 h-5 text-indigo-600" />
            <span className="text-indigo-700 font-medium">
              All features included in your university health plan
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}