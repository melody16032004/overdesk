export const ControlSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-[1px] flex-1 bg-white/10"></div>
      <span className="text-[10px] font-bold uppercase opacity-50 tracking-wider">
        {title}
      </span>
      <div className="h-[1px] flex-1 bg-white/10"></div>
    </div>
    {children}
  </div>
);
