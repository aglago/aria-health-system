'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white">
      {/* CTA Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of UMaT students who trust ARIA for their health and wellness needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/role-selection">
                <Button size="lg" className="bg-white text-indigo-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-indigo-900 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">ARIA</h3>
                <p className="text-sm text-gray-400">Health System</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Advanced AI-powered healthcare platform designed specifically for university students, 
              providing 24/7 medical support and expert care coordination.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Twitter className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Linkedin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/role-selection" className="text-gray-300 hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/student-signup" className="text-gray-300 hover:text-white transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link href="/doctor-signup" className="text-gray-300 hover:text-white transition-colors">
                  Doctor Registration
                </Link>
              </li>
              <li>
                <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Medical Disclaimer
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-300">University of Mines and Technology</p>
                  <p className="text-gray-400 text-sm">Tarkwa, Ghana</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">+233-312-022-242</p>
                  <p className="text-gray-400 text-sm">Health Center</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">health@umat.edu.gh</p>
                  <p className="text-gray-400 text-sm">Medical Support</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-300">Emergency: 24/7</p>
                  <p className="text-gray-400 text-sm">Health Center: 8AM - 6PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 ARIA Health System. All rights reserved. Built for University of Mines and Technology.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Emergency: 193
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Health Center: +233-312-022-242
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}