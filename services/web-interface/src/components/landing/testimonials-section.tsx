'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote, TrendingUp, Users, Clock, Award } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Mensah",
    role: "Computer Science Student",
    year: "3rd Year",
    avatar: "S",
    rating: 5,
    text: "Dr. ARIA helped me identify my anxiety symptoms and connected me with the right counselor. The 24/7 availability is a game-changer for students like me.",
    category: "Mental Health"
  },
  {
    name: "Kwame Asante", 
    role: "Mining Engineering Student",
    year: "2nd Year", 
    avatar: "K",
    rating: 5,
    text: "I was able to get an appointment for my sports injury within hours. The AI correctly identified the urgency and booked me with the orthopedic specialist.",
    category: "Sports Medicine"
  },
  {
    name: "Akosua Osei",
    role: "Geological Engineering Student", 
    year: "4th Year",
    avatar: "A",
    rating: 5,
    text: "The system caught early signs of my allergy condition and helped me understand my symptoms. The doctor had all my information ready when I arrived.",
    category: "Preventive Care"
  },
  {
    name: "Dr. Emmanuel Botchway",
    role: "University Health Center",
    year: "Chief Medical Officer",
    avatar: "E", 
    rating: 5,
    text: "ARIA has revolutionized how we provide healthcare to our students. The AI pre-screening helps us prioritize cases and provide better care.",
    category: "Medical Professional"
  }
];

const stats = [
  {
    icon: Users,
    value: "2,500+",
    label: "Students Helped",
    description: "Active users across UMaT campus"
  },
  {
    icon: Clock,
    value: "< 2min",
    label: "Average Response",
    description: "AI consultation start time"
  },
  {
    icon: TrendingUp,
    value: "98.5%",
    label: "Satisfaction Rate",
    description: "Student feedback rating"
  },
  {
    icon: Award,
    value: "24/7",
    label: "Availability",
    description: "Round-the-clock access"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Trusted by
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> UMaT Community</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what students and healthcare professionals are saying about their experience 
            with ARIA Health System.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-lg font-semibold text-indigo-600 mb-1">{stat.label}</div>
              <div className="text-sm text-gray-600">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg relative overflow-hidden">
              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                  {testimonial.category}
                </span>
              </div>
              
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-indigo-200 mb-4" />
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                
                {/* Author Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-indigo-600">{testimonial.year}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* University Partnership */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Official Partnership with UMaT Health Center
            </h3>
            <p className="text-gray-700 mb-6">
              ARIA Health System is officially endorsed by the University of Mines and Technology 
              Health Center, ensuring the highest standards of medical care and student privacy.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-indigo-600" />
                <span className="text-gray-700 font-medium">Medical Grade AI</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-green-600" />
                <span className="text-gray-700 font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-gray-700 font-medium">University Approved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}