export const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <div
    onClick={onChange}
    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all select-none ${
      checked
        ? "bg-indigo-500/10 border-indigo-500/50"
        : "bg-slate-800 border-slate-700"
    }`}
  >
    <span
      className={`text-[10px] font-bold ${
        checked ? "text-indigo-400" : "text-slate-400"
      }`}
    >
      {label}
    </span>
    <div
      className={`w-6 h-3 rounded-full relative transition-colors ${
        checked ? "bg-indigo-500" : "bg-slate-600"
      }`}
    >
      <div
        className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${
          checked ? "left-3.5" : "left-0.5"
        }`}
      ></div>
    </div>
  </div>
);
