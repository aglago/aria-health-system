'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Heart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            href={user?.role === 'student' ? '/student-dashboard' : user?.role === 'doctor' ? '/doctor-dashboard' : '/'}
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
            onClick={closeMenu}
          >
            <Heart className="w-6 h-6 text-primary" />
            Campus Health Assistant
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                {user.role === 'student' && (
                  <>
                    <Link 
                      href="/student-dashboard" 
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/chat-doctor" 
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      Dr. ARIA
                    </Link>
                    <Link 
                      href="/appointments" 
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      Appointments
                    </Link>
                    <Link 
                      href="/analytics" 
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      Analytics
                    </Link>
                  </>
                )}
                {user.role === 'doctor' && (
                  <>
                    <Link 
                      href="/doctor-dashboard" 
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/doctor/medical-history" 
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      Medical Records
                    </Link>
                    <Link 
                      href="/analytics" 
                      className="text-foreground hover:text-primary transition-colors font-medium"
                    >
                      Analytics
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {user.name}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
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
          <div className="md:hidden border-t border-border mt-2 pt-2 pb-4">
            <div className="flex flex-col space-y-3">
              {user && (
                <>
                  {user.role === 'student' && (
                    <>
                      <Link 
                        href="/student-dashboard" 
                        className="text-foreground hover:text-primary transition-colors font-medium py-2"
                        onClick={closeMenu}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/chat-doctor" 
                        className="text-foreground hover:text-primary transition-colors font-medium py-2"
                        onClick={closeMenu}
                      >
                        Dr. ARIA
                      </Link>
                      <Link 
                        href="/appointments" 
                        className="text-foreground hover:text-primary transition-colors font-medium py-2"
                        onClick={closeMenu}
                      >
                        Appointments
                      </Link>
                      <Link 
                        href="/analytics" 
                        className="text-foreground hover:text-primary transition-colors font-medium py-2"
                        onClick={closeMenu}
                      >
                        Analytics
                      </Link>
                    </>
                  )}
                  {user.role === 'doctor' && (
                    <>
                      <Link 
                        href="/doctor-dashboard" 
                        className="text-foreground hover:text-primary transition-colors font-medium py-2"
                        onClick={closeMenu}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/doctor/medical-history" 
                        className="text-foreground hover:text-primary transition-colors font-medium py-2"
                        onClick={closeMenu}
                      >
                        Medical Records
                      </Link>
                      <Link 
                        href="/analytics" 
                        className="text-foreground hover:text-primary transition-colors font-medium py-2"
                        onClick={closeMenu}
                      >
                        Analytics
                      </Link>
                    </>
                  )}
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">{user.name}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogout}
                      className="flex items-center gap-2"
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