import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-4 md:gap-6">
        <img
          src="https://i.postimg.cc/PqD3CmtW/WIndmar-water.png"
          className="h-14 md:h-16 w-auto transform hover:scale-105 transition-transform"
          alt="Windmar Water"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-windmar-blue-dark dark:text-[#e8eaed] tracking-tighter uppercase">
            Cotizador Water PRO
          </h1>
          <p className="text-windmar-blue dark:text-[#a0a4ad] text-sm sm:text-base font-medium">
            Sistemas de agua con respaldo Windmar Home
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a1d25] p-1 pr-3 rounded-full border border-slate-200 dark:border-white/[0.08] shadow-sm">
        <motion.button
          onClick={() => setIsDarkMode(!isDarkMode)}
          animate={{ rotate: isDarkMode ? 360 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`p-1.5 rounded-full transition-colors duration-500 ${
            isDarkMode
              ? 'bg-windmar-gold text-windmar-dark shadow-[0_0_10px_rgba(242,158,31,0.3)]'
              : 'bg-windmar-blue text-white shadow-[0_0_10px_rgba(29,66,155,0.2)]'
          }`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </motion.button>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[8px] font-black text-slate-400 dark:text-[#6b7280] uppercase tracking-tighter">
            Tema
          </span>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-windmar-gold' : 'text-windmar-blue'}`}>
            {isDarkMode ? 'Oscuro' : 'Claro'}
          </span>
        </div>
      </div>
    </header>
  );
};
