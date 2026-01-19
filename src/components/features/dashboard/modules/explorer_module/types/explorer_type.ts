export type FileType = "file" | "folder";

export interface FileSystemItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  isOpen?: boolean;
  children?: FileSystemItem[];
  parentId?: string | null;
}
