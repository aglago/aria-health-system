'use client';

interface MedicalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MedicalLogo({ className = "", size = 'md' }: MedicalLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background Circle */}
        <circle 
          cx="32" 
          cy="32" 
          r="30" 
          fill="url(#gradient1)"
          stroke="url(#gradient2)"
          strokeWidth="2"
        />
        
        {/* Medical Cross */}
        <path 
          d="M32 12v40M12 32h40" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        
        {/* Stethoscope Arc */}
        <path 
          d="M20 20 Q32 8 44 20" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none"
          opacity="0.9"
        />
        
        {/* Small Medical Plus in Corner */}
        <g transform="translate(46, 46)">
          <circle cx="4" cy="4" r="6" fill="white" opacity="0.2"/>
          <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
        
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function AriaLogo({ className = "", size = 'md' }: MedicalLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative group`}>
      <svg 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform group-hover:scale-105 transition-transform duration-200"
      >
        {/* Main Shield Background */}
        <path 
          d="M32 4 L52 14 L52 34 C52 48 32 60 32 60 C32 60 12 48 12 34 L12 14 L32 4 Z" 
          fill="url(#ariaGradient1)"
          stroke="url(#ariaGradient2)"
          strokeWidth="1.5"
        />
        
        {/* Inner Shield Glow */}
        <path 
          d="M32 8 L48 16 L48 32 C48 44 32 54 32 54 C32 54 16 44 16 32 L16 16 L32 8 Z" 
          fill="url(#innerGlow)"
          opacity="0.3"
        />
        
        {/* ARIA Letter A - More Refined */}
        <path 
          d="M24 46 L28 34 L30.5 26 L33.5 26 L36 34 L40 46 M29 38 L35 38" 
          stroke="white" 
          strokeWidth="2.8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />
        
        {/* Medical Cross */}
        <g transform="translate(42, 16)">
          <circle cx="5" cy="5" r="7" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
          <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.9"/>
        </g>
        
        {/* Pulse/Heartbeat Line */}
        <path 
          d="M14 50 Q20 48 24 52 Q28 48 32 52 Q36 48 40 52 Q44 48 50 50" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          fill="none"
          opacity="0.8"
        />
        
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="ariaGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="25%" stopColor="#2563EB" />
            <stop offset="75%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id="ariaGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="innerGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}