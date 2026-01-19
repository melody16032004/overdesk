export const SectionHeader = ({ title }: { title: string }) => (
  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
    {title}
  </h4>
);
