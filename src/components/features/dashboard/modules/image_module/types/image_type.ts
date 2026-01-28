export interface ProcessedImage {
  id: string;
  originalFile: File;
  previewUrl: string; // URL blob gốc
  compressedBlob: Blob | null;
  compressedUrl: string | null; // URL blob nén
  status: "pending" | "processing" | "done" | "error";
  originalSize: number;
  compressedSize: number;
  errorMsg?: string;
}
