import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div 
        className={`relative bg-paper-raised w-full ${sizeClasses[size] || sizeClasses.md} rounded-xl border border-border-default shadow-elevated p-0 flex flex-col animate-scale-in overflow-hidden`}
      >
        {/* Header with accent bar */}
        <div className="h-[3px] w-full accent-gradient" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-display font-bold text-ink tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-paper-sunken transition-all duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
