export const MenuButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
  color,
  label,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  color?: string;
  label?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      flex flex-col items-center justify-center min-w-[42px] h-[54px] px-1 mx-0.5 rounded-md transition-all flex-shrink-0
      ${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100"}
      ${
        isActive
          ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
          : "text-slate-600"
      }
    `}
  >
    <div className="mb-1" style={color ? { color: color } : {}}>
      {children}
    </div>
    {label && (
      <span className="text-[9px] font-medium leading-none text-slate-500">
        {label}
      </span>
    )}
  </button>
);
