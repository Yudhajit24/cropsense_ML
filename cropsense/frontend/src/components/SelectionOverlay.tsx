import React from 'react';

interface SelectionOverlayProps {
  label: string;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ label }) => {
  return (
    <div className="absolute -inset-[12px] border-2 border-black pointer-events-none z-50 transition-colors animate-pulse-border">
      {/* 4 Handles */}
      <div className="absolute -top-[5px] -left-[5px] w-[8px] h-[8px] bg-black"></div>
      <div className="absolute -top-[5px] -right-[5px] w-[8px] h-[8px] bg-black"></div>
      <div className="absolute -bottom-[5px] -left-[5px] w-[8px] h-[8px] bg-black"></div>
      <div className="absolute -bottom-[5px] -right-[5px] w-[8px] h-[8px] bg-black"></div>
      
      {/* Label */}
      <div className="absolute -top-[2px] left-[12px] h-[28px] bg-black text-white px-3 flex items-center font-serif text-[11px] uppercase tracking-widest leading-none">
        {label}
      </div>
    </div>
  );
};
