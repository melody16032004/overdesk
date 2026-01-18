// src/layouts/Shell.tsx
import { ReactNode } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../stores/useAppStore';
import { Moon, Sun, Minus, X } from 'lucide-react'; // Import icon

interface ShellProps {
  children: ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
  const { setViewMode, theme, toggleTheme } = useAppStore();
  const appWindow = getCurrentWindow();

  const startDragging = async (e: React.PointerEvent) => {
    if (e.button === 0) await appWindow.startDragging();
  };

  const handleClose = () => invoke('hide_window');
  const handleMinimize = () => setViewMode('bubble');

  return (
    <div className="h-full w-full p-2 flex flex-col bg-transparent overflow-hidden">
      
      {/* KHUNG APP: Thay đổi màu nền theo chế độ */}
      {/* Light: bg-white/90, border-slate-200 */}
      {/* Dark: dark:bg-[#0B0F19]/95, dark:border-white/10 */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-black/50 transition-colors duration-300">
        
        {/* HEADER */}
        <div 
          onPointerDown={startDragging}
          className="h-10 flex shrink-0 items-center justify-between px-3 bg-slate-100/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 select-none cursor-move transition-colors"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 pointer-events-none">
             <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
             <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-wider font-mono uppercase">
               OverDesk
             </span>
          </div>
          
          {/* Controls Group */}
          <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
             
             {/* 1. Theme Toggle Button */}
             <button 
               onClick={toggleTheme}
               className="p-1.5 mr-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-indigo-500 transition-all"
               title="Toggle Theme"
             >
               {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
             </button>

             {/* Separator */}
             <div className="w-[1px] h-3 bg-slate-300 dark:bg-white/10 mx-1" />

             {/* 2. Minimize */}
             <button onClick={handleMinimize} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-all">
               <Minus size={12} />
             </button>

             {/* 3. Close */}
             <button onClick={handleClose} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-white/10 rounded transition-all">
               <X size={12} />
             </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide text-slate-800 dark:text-slate-200 transition-colors">
          {children}
        </div>
      </div>
    </div>
  );
};