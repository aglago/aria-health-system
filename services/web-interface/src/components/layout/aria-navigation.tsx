// Phase 2 Navigation Component

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Bot, BarChart3, Settings, MessageSquare, Brain } from 'lucide-react';

export default function ARIANavigation() {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: 'ARIA Chat',
      href: '/',
      icon: Heart,
      description: 'Advanced ML Analysis'
    },
    {
      name: 'Dr. ARIA',
      href: '/chat-doctor',
      icon: Bot,
      description: 'Conversational AI Doctor',
      new: true // Phase 2 feature
    },
    {
      name: 'Health Insights',
      href: '/insights', 
      icon: BarChart3,
      description: 'Analytics Dashboard'
    },
    {
      name: 'Memory',
      href: '/memory',
      icon: Brain,
      description: 'Conversation History',
      new: true // Phase 2 feature
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: Settings,
      description: 'System Management'
    }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Heart className="text-blue-600" size={24} />
              <span className="font-bold text-xl text-gray-900 dark:text-white">ARIA</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                Phase 2
              </span>
            </div>
            
            <div className="flex gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors relative ${
                      isActive 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                    }`}
                    title={item.description}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                    {item.new && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare size={16} />
              <span>Conversational AI</span>
            </div>
            <div className="flex items-center gap-1">
              <Brain size={16} />
              <span>Memory Enhanced</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}