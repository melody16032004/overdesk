import { useEffect, useState } from "react";

export const LiveMonitor = ({
  label,
  color,
  value,
  displayValue,
}: {
  label: string;
  color: string;
  value: number;
  displayValue: string;
}) => {
  const [bars, setBars] = useState<number[]>(Array(12).fill(0));

  useEffect(() => {
    setBars((prev) => {
      const newBars = [...prev.slice(1), value];
      return newBars;
    });
  }, [value]);

  return (
    <div className="bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl p-3 flex flex-col justify-between h-20 relative overflow-hidden transition-colors duration-300">
      <div className="flex justify-between items-center z-10">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <span className={`text-xs font-mono font-bold ${color}`}>
          {displayValue}
        </span>
      </div>
      <div className="flex items-end justify-between gap-1 h-8 z-10">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-t-sm transition-all duration-300 ${color.replace("text-", "bg-")}`}
            style={{
              height: `${Math.min(h, 100)}%`,
              opacity: 0.3 + ((i + 1) / 12) * 0.7,
            }}
          ></div>
        ))}
      </div>
      <div
        className={`hidden dark:block absolute -bottom-4 -right-4 w-16 h-16 ${color.replace("text-", "bg-")} blur-[40px] opacity-20`}
      ></div>
    </div>
  );
};
