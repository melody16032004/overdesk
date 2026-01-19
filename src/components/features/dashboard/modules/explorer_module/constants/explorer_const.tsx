import { FileSystemItem } from "../types/explorer_type";

export const INITIAL_FILES: FileSystemItem[] = [
  {
    id: "root",
    name: "root",
    type: "folder",
    isOpen: true,
    parentId: null,
    children: [
      {
        id: "readme_md",
        name: "README.md",
        type: "file",
        content: "# Welcome to IDE Lite\n\nNow with Tabs & Renaming!",
        parentId: "root",
      },
    ],
  },
];
