export const ToolbarSection = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`flex flex-col px-2 border-r border-slate-300 last:border-r-0 h-full justify-center flex-shrink-0 ${className}`}
  >
    <div className="flex items-center gap-0.5 mb-1 justify-center">
      {children}
    </div>
    <div className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider select-none">
      {title}
    </div>
  </div>
);
