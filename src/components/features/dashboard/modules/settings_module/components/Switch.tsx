export const Switch = ({ checked, onChange }: any) => (
  <button
    onClick={onChange}
    className={`w-10 h-5 rounded-full transition-all duration-300 relative ${
      checked
        ? "bg-indigo-500 shadow-indigo-500/50"
        : "bg-slate-200 dark:bg-slate-700"
    }`}
  >
    <div
      className={`w-3.5 h-3.5 bg-white rounded-full shadow-md absolute top-0.5 transition-all duration-300 ${
        checked ? "left-[22px]" : "left-[4px]"
      }`}
    />
  </button>
);
