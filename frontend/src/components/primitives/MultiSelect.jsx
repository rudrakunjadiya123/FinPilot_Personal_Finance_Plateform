import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function MultiSelect({ label, options, selectedValues, onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === options.length 
      ? "All Selected" 
      : `${selectedValues.length} selected`;

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && <label className="text-xs font-semibold text-ink-soft uppercase tracking-wide">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="border border-border-strong rounded-lg px-3 py-2 text-sm bg-paper-sunken flex items-center justify-between cursor-pointer focus:border-accent focus:ring-2 focus:ring-accent/20 text-ink font-medium transition-all duration-200"
      >
        <span className="truncate mr-2">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-ink-soft transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-paper border border-border-strong rounded-lg shadow-elevated z-[100] max-h-60 overflow-y-auto custom-scrollbar p-1">
          {options.map(opt => (
            <div 
              key={opt.value} 
              onClick={() => toggleOption(opt.value)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-paper-sunken cursor-pointer rounded-md transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedValues.includes(opt.value) ? 'bg-accent border-accent text-white' : 'border-border-strong bg-paper'}`}>
                {selectedValues.includes(opt.value) && <Check className="w-3 h-3" />}
              </div>
              <span className="text-sm text-ink">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
