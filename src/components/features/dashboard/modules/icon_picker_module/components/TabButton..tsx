export const TabButton = ({
  isActive,
  onClick,
  icon,
  label,
  count,
  color,
}: any) => {
  const colorClass = isActive
    ? `bg-${color}-600 text-white`
    : "bg-[#3e3e42] hover:bg-[#4e4e52]";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${colorClass}`}
    >
      {icon} {label}
      {count !== null && (
        <span className="opacity-60 text-[10px]">{count}</span>
      )}
    </button>
  );
};
