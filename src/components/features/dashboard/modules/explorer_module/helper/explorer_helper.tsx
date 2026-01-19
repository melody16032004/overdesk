import { FileJson, FileCode, FileText, File } from "lucide-react";

export const getFileIcon = (name: string) => {
  if (name.endsWith(".json"))
    return <FileJson size={14} className="text-yellow-400" />;
  if (name.endsWith(".tsx") || name.endsWith(".ts") || name.endsWith(".js"))
    return <FileCode size={14} className="text-blue-400" />;
  if (name.endsWith(".css") || name.endsWith(".scss"))
    return <FileCode size={14} className="text-pink-400" />;
  if (name.endsWith(".html"))
    return <FileCode size={14} className="text-orange-400" />;
  if (name.endsWith(".md") || name.endsWith(".txt"))
    return <FileText size={14} className="text-slate-400" />;
  return <File size={14} className="text-slate-500" />;
};
