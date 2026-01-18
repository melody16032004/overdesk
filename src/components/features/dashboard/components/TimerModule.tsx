import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Zap, ChevronUp, ChevronDown, BellRing } from 'lucide-react';
import { useAppStore } from '../../../../stores/useAppStore';

export const TimerModule = () => {
  // 1. LẤY TOÀN BỘ DỮ LIỆU TỪ STORE (Không dùng useState nữa)
  const { timerSettings, timerState, setTimerState } = useAppStore();
  
  // Destructure dữ liệu từ Store ra để dùng cho gọn
  const { mode, timeLeft, initialTime, isActive, sessions, lastUpdated } = timerState;

  const MODE_CONFIG = {
    focus: { label: 'Focus', color: 'text-indigo-500', stroke: '#6366f1' },
    short: { label: 'Short Break', color: 'text-emerald-500', stroke: '#10b981' },
    long:  { label: 'Long Break', color: 'text-sky-500', stroke: '#0ea5e9' },
  };

  const getDuration = (m: string) => {
      if (m === 'focus') return timerSettings.work * 60;
      if (m === 'short') return timerSettings.short * 60;
      return timerSettings.long * 60;
  };
  
  const timerRef = useRef<number | null>(null);

  // --- 2. LOGIC BÙ GIỜ (Chạy 1 lần khi mount) ---
  useEffect(() => {
    if (isActive) {
      const now = Date.now();
      const secondsPassed = Math.floor((now - lastUpdated) / 1000);
      
      if (secondsPassed > 0) {
        // Trừ thời gian đã trôi qua khi app bị ẩn
        const newTimeLeft = Math.max(0, timeLeft - secondsPassed);
        setTimerState({ timeLeft: newTimeLeft, lastUpdated: now });
      }
    }
  }, []); // Empty dependency để chỉ chạy lúc mount

  // --- 3. LOGIC TIMER CHÍNH ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        // Cập nhật thẳng vào Store -> Component sẽ tự re-render vì đang subscribe store
        setTimerState({ 
            timeLeft: timeLeft - 1,
            lastUpdated: Date.now() 
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]); // Dependency: Khi store thay đổi timeLeft, effect chạy lại check

  // --- 4. CẬP NHẬT KHI ĐỔI SETTING ---
  // Nếu người dùng đổi thời gian trong Setting khi đang pause, cập nhật theo
  useEffect(() => {
    if (!isActive) {
       const newDuration = getDuration(mode);
       // Chỉ cập nhật nếu khác biệt để tránh loop
       if (newDuration !== initialTime) {
           setTimerState({ 
               timeLeft: newDuration, 
               initialTime: newDuration 
           });
       }
    }
  }, [timerSettings]);


  // --- HANDLERS (Sửa hết thành setTimerState) ---
  const handleTimerComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (Notification.permission === 'granted') {
      new Notification("Time's up!", { body: `${MODE_CONFIG[mode].label} finished.` });
    }

    if (mode === 'focus') {
      const newSessions = sessions + 1;
      const nextMode = (newSessions + 1) % 4 === 0 ? 'long' : 'short';
      const nextDuration = getDuration(nextMode);
      
      setTimerState({
          isActive: false,
          sessions: newSessions,
          mode: nextMode,
          timeLeft: nextDuration,
          initialTime: nextDuration
      });
    } else {
      const nextDuration = getDuration('focus');
      setTimerState({
          isActive: false,
          mode: 'focus',
          timeLeft: nextDuration,
          initialTime: nextDuration
      });
    }
  };

  const switchMode = (newMode: 'focus' | 'short' | 'long') => {
    const newDuration = getDuration(newMode);
    setTimerState({
        mode: newMode,
        initialTime: newDuration,
        timeLeft: newDuration,
        isActive: false
    });
  };

  const adjustTime = (amount: number) => {
    const newTime = Math.max(60, timeLeft + amount); 
    setTimerState({ timeLeft: newTime, initialTime: newTime });
  };

  const toggleTimer = () => {
    if (!isActive && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    // Cập nhật store isActive và lastUpdated
    setTimerState({ 
        isActive: !isActive,
        lastUpdated: Date.now()
    });
  };

  const resetTimer = () => {
    const t = getDuration(mode);
    setTimerState({
        isActive: false,
        timeLeft: t,
        initialTime: t
    });
  };

  // --- FORMATTING & UI (Giữ nguyên) ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return (
      <div className="flex items-baseline gap-0.5 font-mono">
        <span className="text-4xl font-bold tracking-tighter">{mins.toString().padStart(2, '0')}</span>
        <span className="text-xl opacity-50">:</span>
        <span className="text-4xl font-bold tracking-tighter">{secs.toString().padStart(2, '0')}</span>
      </div>
    );
  };

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  // Fix lỗi chia cho 0 nếu initialTime = 0 (dù hiếm gặp)
  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * circumference : 0;
  const currentConfig = MODE_CONFIG[mode];

  return (
    <div className="h-full flex flex-col items-center relative overflow-hidden bg-slate-50/50 dark:bg-white/5">
      
      {/* 1. HEADER: MODE TABS */}
      <div className="w-full p-2 flex justify-center gap-1 z-10">
        {(Object.keys(MODE_CONFIG) as Array<keyof typeof MODE_CONFIG>).map((m) => {
           const Icon = m === 'focus' ? Brain : (m === 'short' ? Coffee : Zap);
           return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300
                ${mode === m 
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm scale-105 ring-1 ring-black/5 dark:ring-white/10' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                }
              `}
            >
              <Icon size={12} strokeWidth={2.5} />
              {MODE_CONFIG[m].label}
            </button>
           )
        })}
      </div>

      {/* 2. MAIN CIRCLE UI */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full">
        
        {/* Quick Adjust Buttons */}
        {!isActive && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 animate-in fade-in slide-in-from-right-2">
                <button onClick={() => adjustTime(60)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 transition-colors"><ChevronUp size={16}/></button>
                <button onClick={() => adjustTime(-60)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 transition-colors"><ChevronDown size={16}/></button>
            </div>
        )}

        <div className="relative">
            <svg width="160" height="160" className="transform -rotate-90 drop-shadow-xl">
                <defs>
                    <linearGradient id="gradient-focus" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="gradient-short" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="gradient-long" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                </defs>

                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-white/5" />
                
                <circle 
                    cx="80" cy="80" r={radius} 
                    stroke={`url(#gradient-${mode})`}
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={progress}
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
            </svg>

            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-colors duration-300 ${currentConfig.color}`}>
                {formatTime(timeLeft)}
                <div className="flex items-center gap-1 mt-1">
                    <span className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (sessions % 4) ? 'bg-current' : 'bg-slate-200 dark:bg-white/10'}`} />
                        ))}
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* 3. FOOTER CONTROLS */}
      <div className="w-full p-4 pb-6 flex items-center justify-center gap-6">
        <button 
            onClick={resetTimer}
            className="p-3 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-90"
            title="Reset"
        >
            <RotateCcw size={20} />
        </button>

        <button 
            onClick={toggleTimer}
            className={`
                p-5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center text-white
                ${isActive 
                    ? 'bg-slate-800 dark:bg-white/10 dark:text-white shadow-none ring-2 ring-inset ring-slate-200 dark:ring-white/5' 
                    : `bg-gradient-to-br ${mode === 'focus' ? 'from-indigo-500 to-violet-600 shadow-indigo-500/30' : mode === 'short' ? 'from-emerald-400 to-emerald-600 shadow-emerald-500/30' : 'from-sky-400 to-blue-600 shadow-sky-500/30'}`
                }
            `}
        >
            {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>

        <div className="relative group">
             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                 {sessions} sessions done
             </div>
             <button className="p-3 rounded-full text-slate-400 cursor-default">
                <BellRing size={20} />
             </button>
        </div>
      </div>

    </div>
  );
};