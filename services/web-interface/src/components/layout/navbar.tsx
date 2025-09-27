'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, ChevronDown, Home, MessageCircle, Calendar, BarChart3, Users, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { AriaLogo } from '@/components/ui/medical-logo';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/role-selection');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            href={user?.role === 'student' ? '/student-dashboard' : user?.role === 'doctor' ? '/doctor-dashboard' : '/'}
            className="flex items-center gap-3 text-xl font-bold text-foreground hover:text-primary transition-colors"
            onClick={closeMenu}
          >
            <AriaLogo size="md" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold">ARIA Health</span>
              <span className="text-xs font-normal text-muted-foreground -mt-1">Campus Wellness System</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                {user.role === 'student' && (
                  <>
                    <Link 
                      href="/student-dashboard" 
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link 
                      href="/chat-doctor" 
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Dr. ARIA
                    </Link>
                    <Link 
                      href="/appointments" 
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      Appointments
                    </Link>
                    <Link 
                      href="/analytics" 
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </Link>
                  </>
                )}
                {user.role === 'doctor' && (
                  <>
                    <Link 
                      href="/doctor-dashboard" 
                      className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <Home className="w-4 h-4" />
                      <span className="hidden lg:inline">Dashboard</span>
                    </Link>
                    
                    {/* Patient Management Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium"
                      >
                        <Users className="w-4 h-4" />
                        <span className="hidden lg:inline">Patients</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-52 bg-background border border-border rounded-md shadow-lg z-50">
                          <Link 
                            href="/appointments" 
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-primary transition-colors border-b border-border"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Calendar className="w-4 h-4" />
                            Appointments
                          </Link>
                          <Link 
                            href="/doctor/patients" 
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-primary transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Users className="w-4 h-4" />
                            Patient Files
                          </Link>
                          <Link 
                            href="/doctor/medical-history" 
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-primary transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <FileText className="w-4 h-4" />
                            Medical Records
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      href="/analytics" 
                      className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden lg:inline">Analytics</span>
                    </Link>
                    <Link 
                      href="/disease-surveillance" 
                      className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden lg:inline">Surveillance</span>
                    </Link>
                  </>
                )}
                
                {/* User Info & Logout */}
                <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border">
                  <span className="text-sm text-muted-foreground font-medium hidden xl:inline">
                    {user.name}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Logout</span>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-foreground hover:text-primary hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border mt-2 pt-4 pb-4">
            <div className="flex flex-col space-y-1">
              {user && (
                <>
                  {user.role === 'student' && (
                    <>
                      <Link 
                        href="/student-dashboard" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <Home className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/chat-doctor" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <MessageCircle className="w-5 h-5" />
                        Dr. ARIA
                      </Link>
                      <Link 
                        href="/appointments" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <Calendar className="w-5 h-5" />
                        Appointments
                      </Link>
                      <Link 
                        href="/analytics" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <BarChart3 className="w-5 h-5" />
                        Analytics
                      </Link>
                    </>
                  )}
                  {user.role === 'doctor' && (
                    <>
                      <Link 
                        href="/doctor-dashboard" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <Home className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/appointments" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <Calendar className="w-5 h-5" />
                        Appointments
                      </Link>
                      
                      {/* Patient Data Section */}
                      <div className="py-2">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-2 mb-2">Patient Data</p>
                        <Link 
                          href="/doctor/patients" 
                          className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-2 px-4 rounded-md"
                          onClick={closeMenu}
                        >
                          <Users className="w-5 h-5" />
                          Patient Files
                        </Link>
                        <Link 
                          href="/doctor/medical-history" 
                          className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-2 px-4 rounded-md"
                          onClick={closeMenu}
                        >
                          <FileText className="w-5 h-5" />
                          Medical Records
                        </Link>
                      </div>
                      
                      <Link 
                        href="/analytics" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <BarChart3 className="w-5 h-5" />
                        Analytics
                      </Link>
                      <Link 
                        href="/disease-surveillance" 
                        className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-accent transition-colors font-medium py-3 px-2 rounded-md"
                        onClick={closeMenu}
                      >
                        <Shield className="w-5 h-5" />
                        Disease Surveillance
                      </Link>
                    </>
                  )}
                  
                  {/* User Info & Logout */}
                  <div className="pt-6 mt-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;