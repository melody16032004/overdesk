export type PkgManager = "npm" | "yarn" | "pnpm" | "bun";
export type CategoryId =
  | "favorites"
  | "react"
  | "vue"
  | "node"
  | "python"
  | "flutter"
  | "go"
  | "rust"
  | "css"
  | "utils"
  | "test"
  | "db";

export interface Library {
  id: string;
  name: string;
  cmdName: string;
  desc: string;
  category: Exclude<CategoryId, "favorites">;
  url: string;
  isDev?: boolean;
  isCustom?: boolean;
}
