import { Loader2, X, ImageIcon } from "lucide-react";

export const InputArea = ({
  selectedImage,
  isOcrLoading,
  clearImage,
  text,
  setText,
  fileInputRef,
  handleImageUpload,
  setTranslated,
  setSelectedImage,
}: any) => (
  <div className="flex-1 bg-white dark:bg-black/20 rounded-xl p-3 border border-slate-200 dark:border-white/10 flex flex-col relative focus-within:border-indigo-500/50 transition-colors group">
    {/* Image Preview (Nếu có) */}
    {selectedImage && (
      <div className="relative mb-2 h-20 shrink-0 w-full bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10">
        <img
          src={selectedImage}
          alt="Source"
          className="h-full object-contain opacity-80"
        />
        {isOcrLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
        <button
          onClick={clearImage}
          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
        >
          <X size={10} />
        </button>
      </div>
    )}

    <textarea
      className="flex-1 w-full bg-transparent resize-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
      placeholder={
        isOcrLoading ? "Extracting text..." : "Type or paste image..."
      }
      value={text}
      onChange={(e) => setText(e.target.value)}
      disabled={isOcrLoading}
    />

    {/* Tools: Upload & Clear */}
    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-white/20 transition-colors"
        title="Import Image (OCR)"
      >
        <ImageIcon size={14} />
      </button>

      {text && (
        <button
          onClick={() => {
            setText("");
            setTranslated("");
            setSelectedImage(null);
          }}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/20 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  </div>
);
