import { useState, useRef } from "react";
import {
  FileText,
  Scissors,
  Image as ImageIcon,
  Download,
  Trash2,
  ShieldCheck,
  Loader2,
  FileUp,
  Archive,
  X,
  RotateCw,
  Stamp,
  Settings2,
} from "lucide-react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { PdfFile, ToolMode } from "./types/pdf_types";

// --- COMPONENT ---
export const PdfModule = () => {
  // --- 1. STATE & REFS ---
  // UI Mode
  const [activeTab, setActiveTab] = useState<ToolMode>("merge");

  // Data State
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pro Settings
  const [watermarkText, setWatermarkText] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 2. UTILS & HELPERS (Pure functions) ---
  const getAcceptType = () => {
    if (activeTab === "img-to-pdf") return "image/png, image/jpeg";
    return "application/pdf";
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBlob = (data: Uint8Array, filename: string, type: string) => {
    const blob = new Blob([data as any], { type });
    downloadFile(blob, filename);
  };

  // --- 3. FILE MANAGEMENT (CRUD Actions) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: PdfFile[] = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        rotation: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
    if (e.target) e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const rotateFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f,
      ),
    );
  };

  const clearFiles = () => {
    setFiles([]);
    setWatermarkText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 4. CORE PDF LOGIC (Async Processing) ---

  // Sub-routine: Apply Watermark
  const applyWatermark = async (pdfDoc: PDFDocument) => {
    if (!watermarkText.trim()) return;

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = 50;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

      page.drawText(watermarkText, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size: fontSize,
        font: font,
        color: rgb(0.75, 0.75, 0.75), // Light Gray
        opacity: 0.5,
        rotate: degrees(45),
      });
    });
  };

  // Feature: Merge PDF
  const processMerge = async () => {
    if (files.length < 2) return alert("Please select at least 2 PDF files.");
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of files) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );

        copiedPages.forEach((page) => {
          const existingRotation = page.getRotation().angle;
          page.setRotation(degrees(existingRotation + pdfFile.rotation));
          mergedPdf.addPage(page);
        });
      }

      await applyWatermark(mergedPdf);

      const pdfBytes = await mergedPdf.save();
      downloadBlob(pdfBytes, "merged-document.pdf", "application/pdf");
    } catch (error) {
      console.error(error);
      alert("Error merging PDFs. Ensure files are valid.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Feature: Split PDF
  const processSplit = async () => {
    if (files.length !== 1)
      return alert("Please select exactly 1 PDF file to split.");
    setIsProcessing(true);

    try {
      const arrayBuffer = await files[0].file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const zip = new JSZip();

      const pageCount = sourcePdf.getPageCount();

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);

        const existingRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(existingRotation + files[0].rotation));

        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        zip.file(`page-${i + 1}.pdf`, pdfBytes);
      }

      const content = await zip.generateAsync({ type: "blob" });
      downloadFile(content, "split-pages.zip");
    } catch (error) {
      console.error(error);
      alert("Error splitting PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Feature: Image to PDF
  const processImgToPdf = async () => {
    if (files.length === 0) return alert("Please select images.");
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgFile of files) {
        const arrayBuffer = await imgFile.file.arrayBuffer();
        let image;

        if (imgFile.file.type === "image/jpeg") {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (imgFile.file.type === "image/png") {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          continue;
        }

        const page = pdfDoc.addPage();
        const { width, height } = image.scale(1);
        const isRotated90 = imgFile.rotation % 180 !== 0;

        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        const scaleFactor = Math.min(
          pageWidth / (isRotated90 ? height : width),
          pageHeight / (isRotated90 ? width : height),
        );

        const drawWidth = width * scaleFactor;
        const drawHeight = height * scaleFactor;

        page.drawImage(image, {
          x:
            pageWidth / 2 -
            drawWidth / 2 +
            (isRotated90 ? (drawWidth - drawHeight) / 2 : 0),
          y:
            pageHeight / 2 -
            drawHeight / 2 +
            (isRotated90 ? (drawHeight - drawWidth) / 2 : 0),
          width: drawWidth,
          height: drawHeight,
          rotate: degrees(imgFile.rotation),
        });
      }

      await applyWatermark(pdfDoc);

      const pdfBytes = await pdfDoc.save();
      downloadBlob(pdfBytes, "images-converted.pdf", "application/pdf");
    } catch (error) {
      console.error(error);
      alert("Error converting images.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 5. UI HANDLERS ---
  const switchTab = (mode: ToolMode) => {
    setActiveTab(mode);
    clearFiles();
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between z-20">
        <div className="font-bold text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-rose-500/20 rounded-lg">
            <FileText size={20} className="text-rose-500" />
          </div>
          <span>PDF Swiss Knife</span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Local Processing
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-16 md:w-60 bg-[#1e293b] border-r border-slate-800 flex flex-col p-2 gap-2 shrink-0 transition-all">
          <button
            onClick={() => switchTab("merge")}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              activeTab === "merge"
                ? "bg-rose-600 text-white shadow-lg"
                : "hover:bg-slate-800 text-slate-400"
            }`}
            title="Merge PDF"
          >
            <FileText size={20} />{" "}
            <span className="hidden md:block text-sm font-bold">Merge PDF</span>
          </button>
          <button
            onClick={() => switchTab("split")}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              activeTab === "split"
                ? "bg-orange-600 text-white shadow-lg"
                : "hover:bg-slate-800 text-slate-400"
            }`}
            title="Split PDF"
          >
            <Scissors size={20} />{" "}
            <span className="hidden md:block text-sm font-bold">Split PDF</span>
          </button>
          <button
            onClick={() => switchTab("img-to-pdf")}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              activeTab === "img-to-pdf"
                ? "bg-blue-600 text-white shadow-lg"
                : "hover:bg-slate-800 text-slate-400"
            }`}
            title="Image to PDF"
          >
            <ImageIcon size={20} />{" "}
            <span className="hidden md:block text-sm font-bold">
              Image to PDF
            </span>
          </button>
        </div>

        {/* MAIN AREA - WRAPPER FOR SCROLL AND FOOTER */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {activeTab === "merge" && (
                  <>
                    <FileText className="text-rose-500" /> Merge PDFs
                  </>
                )}
                {activeTab === "split" && (
                  <>
                    <Scissors className="text-orange-500" /> Split PDF
                  </>
                )}
                {activeTab === "img-to-pdf" && (
                  <>
                    <ImageIcon className="text-blue-500" /> Images to PDF
                  </>
                )}
              </h2>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  showSettings
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Settings2 size={14} /> Pro Options
              </button>
            </div>

            {/* PRO SETTINGS PANEL */}
            {showSettings && (
              <div className="mb-6 bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase mb-3 flex items-center gap-2">
                  <Stamp size={14} /> Watermark Settings
                </h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter text (e.g. CONFIDENTIAL, DRAFT)"
                    className="flex-1 bg-slate-900/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="text-[10px] text-indigo-300/60 mt-2">
                  Watermark will be applied diagonally (45°) across all pages.
                </div>
              </div>
            )}

            {/* UPLOAD AREA */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-2xl h-40 flex flex-col items-center justify-center pointer hover:bg-slate-800/50 hover:border-slate-500 transition-all group mb-6"
            >
              <div className="p-3 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-lg">
                <FileUp size={24} className="text-slate-400" />
              </div>
              <div className="text-sm font-bold text-white">
                Click to Upload {activeTab === "img-to-pdf" ? "Images" : "PDFs"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                or drag and drop here
              </div>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                accept={getAcceptType()}
                onChange={handleFileChange}
              />
            </div>

            {/* FILE LIST */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-400 text-xs uppercase flex items-center gap-2">
                <Archive size={14} /> Selected Files ({files.length})
              </h3>
              {files.length > 0 && (
                <button
                  onClick={clearFiles}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
                >
                  <X size={12} /> Clear All
                </button>
              )}
            </div>

            {files.length === 0 ? (
              <div className="flex items-center justify-center text-slate-600 italic text-sm border border-slate-800 rounded-xl bg-slate-900/50 min-h-[150px]">
                No files selected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between bg-[#1e293b] p-3 rounded-xl border border-slate-700 group animate-in fade-in slide-in-from-bottom-2 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <div className="w-6 h-6 shrink-0 bg-slate-700 rounded flex items-center justify-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </div>

                      {/* PREVIEW */}
                      <div className="relative group/preview">
                        {f.preview ? (
                          <img
                            src={f.preview}
                            alt="preview"
                            className="w-10 h-10 object-cover rounded bg-slate-950 transition-transform duration-300"
                            style={{ transform: `rotate(${f.rotation}deg)` }}
                          />
                        ) : (
                          <div
                            className="p-2 bg-rose-500/10 rounded transition-transform duration-300"
                            style={{ transform: `rotate(${f.rotation}deg)` }}
                          >
                            <FileText size={20} className="text-rose-500" />
                          </div>
                        )}
                        {f.rotation > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold shadow-sm">
                            {f.rotation}°
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="text-sm text-slate-300 truncate font-medium">
                          {f.file.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {(f.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => rotateFile(f.id)}
                        className="p-2 hover:bg-slate-700 text-slate-500 hover:text-white rounded-lg transition-colors"
                        title="Rotate 90°"
                      >
                        <RotateCw size={16} />
                      </button>
                      <button
                        onClick={() => removeFile(f.id)}
                        className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FIXED FOOTER */}
          <div className="p-4 border-t border-slate-800 bg-[#0f172a] z-20 flex justify-end shrink-0">
            <button
              disabled={files.length === 0 || isProcessing}
              onClick={() => {
                if (activeTab === "merge") processMerge();
                if (activeTab === "split") processSplit();
                if (activeTab === "img-to-pdf") processImgToPdf();
              }}
              className={`
                        px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2
                        ${
                          files.length === 0 || isProcessing
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-white text-slate-900 hover:bg-slate-200 active:scale-95"
                        }
                    `}
            >
              {isProcessing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isProcessing
                ? "Processing..."
                : activeTab === "split"
                  ? "Split & Download ZIP"
                  : "Process & Download"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
