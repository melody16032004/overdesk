export const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-xs py-1">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
      {value}
    </span>
  </div>
);
