"use client";

import { useEffect, useRef, useState } from "react";

interface SoloTravelDropdownProps {
  title: string;
  tooltip: string;
}

export default function SoloTravelDropdown({ title, tooltip }: SoloTravelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="cursor-pointer text-[10px] font-medium text-transformative-teal border-b border-dashed border-transformative-teal/40 hover:border-transformative-teal transition-all select-none flex items-center gap-0.5 outline-none"
      >
        {title}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 z-20 w-52 bg-white border border-deep-indigo/10 shadow-xl rounded-xl p-3 text-[10px] text-deep-indigo/70 font-light leading-relaxed text-left animate-in fade-in slide-in-from-top-1 duration-200">
          {tooltip}
        </div>
      )}
    </div>
  );
}
