import {
  FileCode,
  Code2,
  Database,
  Terminal,
  FileJson,
  Hash,
} from "lucide-react";

export const SUPPORTED_LANGS = [
  { id: "javascript", label: "JavaScript", ext: "js", icon: FileCode },
  { id: "typescript", label: "TypeScript", ext: "ts", icon: FileCode },
  { id: "html", label: "HTML", ext: "html", icon: Code2 },
  { id: "css", label: "CSS", ext: "css", icon: Hash },
  { id: "sql", label: "SQL", ext: "sql", icon: Database },
  { id: "python", label: "Python", ext: "py", icon: Terminal },
  { id: "json", label: "JSON", ext: "json", icon: FileJson },
];
