import { useState, useRef, useEffect, useMemo } from "react";
import imageCompression from "browser-image-compression";
import heic2any from "heic2any";
import JSZip from "jszip";
import {
  Image as ImageIcon,
  UploadCloud,
  Download,
  Settings2,
  Trash2,
  Archive,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  X,
  Minimize2,
  Layers,
  Eye,
  Scissors,
} from "lucide-react";

// --- TYPES ---
interface ProcessedImage {
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

export const ImageCompressorModule = () => {
  // State
  const [files, setFiles] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compareItem, setCompareItem] = useState<ProcessedImage | null>(null); // Modal Compare

  // Settings
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [outputFormat, setOutputFormat] = useState<
    "original" | "image/jpeg" | "image/png" | "image/webp"
  >("original");
  const [keepExif, setKeepExif] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // --- STATS ---
  const stats = useMemo(() => {
    const totalOriginal = files.reduce((acc, f) => acc + f.originalSize, 0);
    const totalCompressed = files.reduce(
      (acc, f) => acc + (f.compressedSize || f.originalSize),
      0
    );
    const saved = totalOriginal - totalCompressed;
    return { totalOriginal, totalCompressed, saved };
  }, [files]);

  // --- UTILS ---
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // --- HANDLERS: UPLOAD & PASTE ---
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: ProcessedImage[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substring(7),
      originalFile: file,
      previewUrl: URL.createObjectURL(file),
      compressedBlob: null,
      compressedUrl: null,
      status: "pending",
      originalSize: file.size,
      compressedSize: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
    }
  };

  // Add Paste Listener
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => {
      URL.revokeObjectURL(f.previewUrl);
      if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
    });
    setFiles([]);
  };

  // --- CORE LOGIC ---
  const processImages = async () => {
    setIsProcessing(true);
    const newFiles = [...files];

    for (let i = 0; i < newFiles.length; i++) {
      const item = newFiles[i];
      if (item.status === "done") continue; // Skip done

      item.status = "processing";
      setFiles([...newFiles]); // Force render

      try {
        let inputFile = item.originalFile;

        // HEIC Converter
        if (
          inputFile.type === "image/heic" ||
          inputFile.name.toLowerCase().endsWith(".heic")
        ) {
          const convertedBlob = await heic2any({
            blob: inputFile,
            toType: "image/jpeg",
            quality: quality,
          });
          const finalBlob = Array.isArray(convertedBlob)
            ? convertedBlob[0]
            : convertedBlob;
          inputFile = new File(
            [finalBlob],
            inputFile.name.replace(/\.heic$/i, ".jpg"),
            { type: "image/jpeg" }
          );
        }

        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: maxWidth,
          useWebWorker: true,
          initialQuality: quality,
          fileType: outputFormat === "original" ? undefined : outputFormat,
          exifOrientation: keepExif ? undefined : 1, // Strip EXIF if false
        };

        const compressedFile = await imageCompression(inputFile, options);

        item.compressedBlob = compressedFile;
        item.compressedUrl = URL.createObjectURL(compressedFile);
        item.compressedSize = compressedFile.size;
        item.status = "done";
      } catch (error) {
        console.error("Error:", error);
        item.status = "error";
        item.errorMsg = "Lỗi";
      }
      setFiles([...newFiles]);
    }
    setIsProcessing(false);
  };

  // --- DOWNLOAD ---
  const downloadSingle = (item: ProcessedImage) => {
    if (!item.compressedUrl) return;
    const link = document.createElement("a");
    link.href = item.compressedUrl;

    let ext = item.originalFile.name.split(".").pop();
    if (outputFormat !== "original") ext = outputFormat.split("/")[1];
    if (item.originalFile.type.includes("heic")) ext = "jpg";

    link.download = `min_${item.originalFile.name.split(".")[0]}.${ext}`;
    link.click();
  };

  const downloadAllZip = async () => {
    const zip = new JSZip();
    files.forEach((f) => {
      if (f.status === "done" && f.compressedBlob) {
        let ext = f.originalFile.name.split(".").pop();
        if (outputFormat !== "original") ext = outputFormat.split("/")[1];
        if (f.originalFile.type.includes("heic")) ext = "jpg";
        zip.file(
          `min_${f.originalFile.name.split(".")[0]}.${ext}`,
          f.compressedBlob
        );
      }
    });
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `optimized_images.zip`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20 gap-3">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <ImageIcon size={20} className="text-emerald-500" />
          </div>
          <span className="hidden sm:inline">Image Compressor</span>
          <span className="sm:hidden">Compressor</span>
        </div>

        {/* Quick Stats */}
        {files.length > 0 && stats.saved > 0 && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-slate-800 rounded-full text-xs border border-slate-700">
            <span className="text-slate-400">
              Gốc: {formatBytes(stats.totalOriginal)}
            </span>
            <ArrowRight size={10} />
            <span className="text-white">
              Nén: {formatBytes(stats.totalCompressed)}
            </span>
            <span className="text-emerald-400 font-bold ml-1">
              (-{formatBytes(stats.saved)})
            </span>
          </div>
        )}

        {files.length > 0 && (
          <button
            onClick={downloadAllZip}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-lg"
          >
            <Archive size={14} />{" "}
            <span className="hidden sm:inline">Download ZIP</span>
          </button>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT: MAIN AREA */}
        <div className="flex-1 bg-[#0f172a] p-4 flex flex-col relative overflow-hidden">
          {/* Upload Zone */}
          <div
            ref={dropZoneRef}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-2xl ${
              files.length === 0 ? "flex-1" : "h-32"
            } flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 hover:border-emerald-500/50 transition-all group mb-4 shrink-0 relative overflow-hidden`}
          >
            <div className="p-4 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-xl relative z-10">
              <UploadCloud size={32} className="text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-slate-300 relative z-10">
              Kéo thả ảnh hoặc Ctrl+V
            </div>
            <div className="text-xs text-slate-500 mt-1 relative z-10">
              Hỗ trợ JPG, PNG, WEBP, HEIC
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.heic"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-20 lg:pb-0">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="bg-[#1e293b] p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-3 group animate-in fade-in slide-in-from-bottom-2 hover:border-slate-600 transition-colors"
                >
                  {/* Preview */}
                  <div className="w-12 h-12 rounded-lg bg-slate-900 shrink-0 overflow-hidden relative border border-slate-700">
                    {f.status === "processing" ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RefreshCw
                          size={18}
                          className="animate-spin text-emerald-500"
                        />
                      </div>
                    ) : (
                      <img
                        src={f.compressedUrl || f.previewUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                    <span className="text-sm font-medium text-white truncate">
                      {f.originalFile.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                        {formatBytes(f.originalSize)}
                      </span>
                      {f.status === "done" && (
                        <>
                          <ArrowRight size={10} />
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {formatBytes(f.compressedSize)}
                          </span>
                          <span className="text-emerald-500">
                            (-
                            {(
                              (1 - f.compressedSize / f.originalSize) *
                              100
                            ).toFixed(0)}
                            %)
                          </span>
                        </>
                      )}
                      {f.status === "error" && (
                        <span className="text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          {f.errorMsg}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {f.status === "done" && (
                      <>
                        <button
                          onClick={() => setCompareItem(f)}
                          className="p-2 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg"
                          title="So sánh"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => downloadSingle(f)}
                          className="p-2 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-500 rounded-lg"
                          title="Tải về"
                        >
                          <Download size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: SETTINGS (Desktop) / BOTTOM (Mobile) */}
        <div className="w-full lg:w-80 bg-[#1e293b] border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col gap-6 shrink-0 z-10 shadow-xl overflow-y-auto max-h-[40vh] lg:max-h-full">
          {/* 1. Quality */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Scissors size={14} /> Mức nén (Quality)
              </label>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                {Math.round(quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Low Size</span>
              <span>Best Quality</span>
            </div>
          </div>

          <div className="h-px bg-slate-700/50"></div>

          {/* 2. Options */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
              <Settings2 size={14} /> Cài đặt nâng cao
            </label>

            {/* Format */}
            <div className="grid grid-cols-2 gap-2">
              {["original", "image/jpeg", "image/png", "image/webp"].map(
                (fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt as any)}
                    className={`py-2 rounded-lg text-[10px] font-bold border transition-all truncate ${
                      outputFormat === fmt
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {fmt === "original"
                      ? "Giữ nguyên"
                      : fmt.split("/")[1].toUpperCase()}
                  </button>
                )
              )}
            </div>

            {/* Resize */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase">
                Max Width
              </label>
              <select
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2.5 outline-none focus:border-emerald-500"
              >
                <option value={3840}>4K (3840px)</option>
                <option value={1920}>Full HD (1920px)</option>
                <option value={1280}>HD (1280px)</option>
                <option value={800}>Mobile (800px)</option>
              </select>
            </div>

            {/* Metadata */}
            <div
              onClick={() => setKeepExif(!keepExif)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                keepExif
                  ? "bg-indigo-500/10 border-indigo-500"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <span
                className={`text-xs font-bold ${
                  keepExif ? "text-indigo-400" : "text-slate-400"
                }`}
              >
                Giữ thông tin ảnh (EXIF)
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  keepExif
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-slate-600"
                }`}
              >
                {keepExif && <CheckCircle2 size={10} className="text-white" />}
              </div>
            </div>
          </div>

          <div className="flex-1 lg:block hidden"></div>

          {/* Main Action */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <button
              onClick={processImages}
              disabled={isProcessing || files.length === 0}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isProcessing || files.length === 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-white text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              }`}
            >
              {isProcessing ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Minimize2 size={18} />
              )}
              {isProcessing ? "Đang xử lý..." : "Nén tất cả"}
            </button>

            {files.length > 0 && (
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Xóa danh sách
              </button>
            )}
          </div>
        </div>

        {/* --- MODAL: COMPARE (PRO FEATURE) --- */}
        {compareItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e293b] w-full max-w-4xl rounded-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-indigo-500" /> So sánh chất
                  lượng
                </h3>
                <button
                  onClick={() => setCompareItem(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 relative overflow-hidden bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-slate-900 flex items-center justify-center p-4">
                {/* Comparison logic could be complex, for now simplify with Side-by-Side or Toggle */}
                <div className="flex flex-col md:flex-row gap-4 w-full h-full">
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 text-center uppercase">
                      Gốc ({formatBytes(compareItem.originalSize)})
                    </span>
                    <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 bg-black/50 flex items-center justify-center">
                      <img
                        src={compareItem.previewUrl}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    <ArrowRight size={24} className="text-slate-600" />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-400 text-center uppercase">
                      Sau nén ({formatBytes(compareItem.compressedSize)})
                    </span>
                    <div className="flex-1 rounded-xl overflow-hidden border border-emerald-500/30 bg-black/50 flex items-center justify-center relative">
                      {compareItem.compressedUrl && (
                        <img
                          src={compareItem.compressedUrl}
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                        -
                        {(
                          (1 -
                            compareItem.compressedSize /
                              compareItem.originalSize) *
                          100
                        ).toFixed(0)}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end">
                <button
                  onClick={() => downloadSingle(compareItem)}
                  className="px-6 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 flex items-center gap-2"
                >
                  <Download size={16} /> Tải ảnh này
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
