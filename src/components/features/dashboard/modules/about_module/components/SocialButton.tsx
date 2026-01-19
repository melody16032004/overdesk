export const SocialButton = ({
  icon: Icon,
  link,
}: {
  icon: any;
  link: string;
}) => (
  <a
    href={link}
    target="_blank"
    rel="noreferrer"
    className="p-3 rounded-2xl transition-all duration-300 hover:-translate-y-1 bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-md dark:bg-black/30 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 dark:hover:shadow-none"
  >
    <Icon size={18} />
  </a>
);
