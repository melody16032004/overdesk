export const TableButton = ({
  onClick,
  children,
  title,
  danger,
  disabled,
}: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
        flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded border transition-all
        ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-400"
            : danger
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "bg-white text-slate-700 border-slate-200 hover:bg-amber-100 hover:border-amber-300"
        }
    `}
  >
    {children}
  </button>
);
