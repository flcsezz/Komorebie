import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ZenSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  placeholder?: string;
  align?: 'left' | 'center' | 'right';
}

const ZenSelect: React.FC<ZenSelectProps> = ({
  value,
  onChange,
  options,
  className,
  placeholder,
  align = 'center'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative flex-1", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sage-200/50 transition-all cursor-pointer flex items-center justify-between text-sm group",
          isOpen && "border-sage-200/50 shadow-[0_0_20px_rgba(183,201,176,0.15)] bg-white/10"
        )}
      >
        <span className={cn("flex-1", align === 'center' ? "text-center" : align === 'right' ? "text-right" : "text-left")}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform duration-500 ease-[0.16,1,0.3,1]", isOpen && "rotate-180 text-sage-200")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-[110] left-0 right-0 mt-2 py-2 glass-deep rounded-2xl shadow-2xl border border-white/10 max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2 text-sm text-left transition-all duration-300 hover:bg-white/5 flex items-center justify-between group",
                  value === option ? "text-sage-200 font-medium bg-white/5" : "text-white/60 hover:text-white"
                )}
              >
                <span className={cn("block w-full", align === 'center' && "text-center")}>
                  {option}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZenSelect;
