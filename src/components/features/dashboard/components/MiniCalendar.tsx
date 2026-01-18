import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MiniCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startDay = getDay(startOfMonth(currentDate)); 

  return (
    <div className="p-2 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-500">
            <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {format(currentDate, 'MMMM yyyy')}
        </span>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-500">
            <ChevronRight size={14} />
        </button>
      </div>

      {/* Grid Ngày */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* SỬA LỖI Ở ĐÂY: Thêm index (i) vào key */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={`${d}-${i}`} className="text-[9px] font-bold text-slate-400 mb-1">
                {d}
            </div>
        ))}

        {/* Padding ô trống đầu tháng */}
        {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
        ))}

        {/* Các ngày trong tháng */}
        {daysInMonth.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
                <div 
                    key={day.toISOString()} 
                    className={`h-6 w-6 ml-2.5 flex items-center justify-center rounded-full text-[10px] transition-all
                        ${isToday 
                            ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/30' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                        }
                    `}
                >
                    {format(day, 'd')}
                </div>
            );
        })}
      </div>
    </div>
  );
};