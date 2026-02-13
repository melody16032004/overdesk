import {
  Download,
  FileIcon,
  Paperclip,
  Check,
  Copy,
  CheckCheck,
} from "lucide-react";
import { useState } from "react";
import {
  HighlightText,
  formatBytes,
  isValidUrl,
  isImageUrl,
} from "../helpers/device_hub_helper";
import { MsgType } from "../types/device_hub_type";

export const MessageBubble = ({
  msg,
  searchTerm,
  onDownload,
}: {
  msg: MsgType;
  searchTerm: string;
  onDownload: (blob: Blob, name: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  // Hàm Copy mạnh mẽ (hoạt động cả HTTP và HTTPS)
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = msg.content;

    try {
      // Cách 1: API Chuẩn (HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Cách 2: Fallback (HTTP / Mobile cũ)
        // Tạo một thẻ textarea ảo để copy
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // Đảm bảo nó không hiển thị gây vướng nhưng vẫn thuộc DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        // Thực hiện lệnh copy
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) throw new Error("Fallback copy failed");
      }

      // Hiệu ứng thành công
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Không thể sao chép tin nhắn này."); // Báo lỗi cho người dùng biết
    }
  };

  // 1. FILE RENDER
  if (msg.type === "file" && msg.fileData) {
    const isImage = msg.fileData.type.startsWith("image/");

    if (isImage) {
      const imgUrl = URL.createObjectURL(msg.fileData);
      return (
        <div
          className="flex flex-col gap-1 group pointer"
          onClick={() => onDownload(msg.fileData!, msg.content)}
        >
          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/20">
            <img
              src={imgUrl}
              alt="preview"
              className="max-h-60 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="bg-black/60 p-2 rounded-full backdrop-blur-md">
                <Download size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-1 mt-1">
            <span className="text-[10px] opacity-70 truncate max-w-[150px]">
              <HighlightText text={msg.content} highlight={searchTerm} />
            </span>
            <span className="text-[10px] opacity-60 font-medium">
              {formatBytes(msg.fileData.size)}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div
        className="flex items-center gap-3 min-w-[200px] pointer group"
        onClick={() => onDownload(msg.fileData!, msg.content)}
      >
        <div className="bg-white/20 p-3 rounded-full flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
          <FileIcon size={24} className="text-white" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-sm font-bold leading-tight mb-0.5">
            <HighlightText text={msg.content} highlight={searchTerm} />
          </div>
          <div className="text-[11px] opacity-80 flex items-center gap-1">
            {formatBytes(msg.fileData.size)} • File
          </div>
        </div>
        <div className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
          <Download size={20} className="text-white" />
        </div>
      </div>
    );
  }

  // 2. TEXT RENDER
  const isLink = msg.type === "text" && isValidUrl(msg.content);
  const isImgLink = isLink && isImageUrl(msg.content);

  return (
    <div className="flex flex-col relative">
      {isImgLink ? (
        <div className="rounded-lg overflow-hidden border border-white/10 mb-1 relative group">
          <img
            src={msg.content}
            alt="sent"
            className="max-h-64 w-full object-cover"
          />
          <a
            href={msg.content}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <div className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm">
              <Download size={24} />
            </div>
          </a>
        </div>
      ) : isLink ? (
        <div className="bg-black/20 p-3 rounded-xl flex items-center gap-3 mb-1">
          <div className="p-2 bg-white/10 rounded-lg shrink-0 text-white">
            <Paperclip size={18} />
          </div>
          <div className="overflow-hidden">
            <a
              href={msg.content}
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-sm truncate block font-medium text-white"
            >
              <HighlightText text={msg.content} highlight={searchTerm} />
            </a>
            <span className="text-[10px] text-slate-400">Liên kết ngoài</span>
          </div>
        </div>
      ) : (
        <span className="text-[16px] leading-relaxed break-words">
          <HighlightText text={msg.content} highlight={searchTerm} />
        </span>
      )}

      {/* FOOTER: Time & Copy Button */}
      <div
        className={`text-[10px] mt-1 flex items-center justify-end gap-3 select-none ${msg.from === "me" ? "text-white/70" : "text-slate-500"}`}
      >
        {/* Nút Copy - Đã tăng kích thước vùng bấm (p-2) để dễ bấm trên điện thoại */}
        <button
          onClick={handleCopy}
          className="group flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity p-1.5 -m-1.5"
          title="Sao chép"
        >
          {copied ? (
            <Check
              size={14}
              className={msg.from === "me" ? "text-white" : "text-green-500"}
              strokeWidth={3}
            />
          ) : (
            <Copy size={12} />
          )}
        </button>

        <span className="flex items-center gap-1">
          {new Date(msg.id).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {msg.from === "me" && <CheckCheck size={14} />}
        </span>
      </div>
    </div>
  );
};
