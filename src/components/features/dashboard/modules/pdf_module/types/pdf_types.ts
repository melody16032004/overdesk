export type ToolMode = "merge" | "split" | "img-to-pdf";

export interface PdfFile {
  id: string;
  file: File;
  preview?: string; // For images
  rotation: number; // 0, 90, 180, 270
}
