export const SectionHeader = ({ icon: Icon, title }: any) => (
  <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-wider flex items-center gap-1.5 ml-1">
    <Icon size={12} /> {title}
  </h3>
);
