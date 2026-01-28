export const CoeffInput = ({
  label,
  id,
  valObj,
  setValObj,
}: {
  label: string;
  id: string;
  valObj: any;
  setValObj: any;
}) => (
  <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-lg border border-slate-200 dark:border-white/10">
    <span className="text-[10px] font-bold text-slate-400 w-4 text-center">
      {label}
    </span>
    <input
      type="number"
      placeholder="0"
      className="w-full bg-transparent text-sm font-bold text-slate-700 dark:text-white outline-none text-right"
      value={valObj[id] || ""}
      onChange={(e) => setValObj({ ...valObj, [id]: e.target.value })}
    />
  </div>
);
