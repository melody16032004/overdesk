export const getStatusColor = (s: number | null) => {
  if (s === null) return "text-slate-500";
  if (s === 0) return "text-red-500"; // Network Error
  if (s >= 200 && s < 300) return "text-emerald-400";
  if (s >= 400) return "text-red-400";
  return "text-orange-400";
};

export const formatSize = (bytes: number) => {
  return bytes > 1024 ? `${(bytes / 1024).toFixed(2)} KB` : `${bytes} B`;
};
