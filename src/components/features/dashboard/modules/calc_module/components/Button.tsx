export const Button = ({
  isScientific,
  handleBtnClick,
  label,
  val,
  type = "num",
  className = "",
  ...props
}: any) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => handleBtnClick(val || label)}
    className={`rounded-xl flex items-center justify-center font-bold transition-all active:scale-95 select-none ${isScientific ? "text-[10px] h-9" : "text-lg h-14"} ${type === "num" ? "bg-white dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm border border-slate-200 dark:border-white/5" : ""} ${type === "op" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20" : ""} ${type === "sci" ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : ""} ${type === "eval" ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/30" : ""} ${type === "var" ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" : ""} ${className}`}
    {...props}
  >
    {label}
  </button>
);
