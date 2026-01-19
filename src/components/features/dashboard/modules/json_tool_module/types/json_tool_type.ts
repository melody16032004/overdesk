export type Mode = "format" | "diff";

export interface DiffLine {
  type: "same" | "add" | "remove";
  content: string;
  lineNum?: number;
}
