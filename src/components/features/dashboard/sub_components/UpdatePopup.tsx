import { relaunch } from "@tauri-apps/plugin-process";
import { AlertCircle, CheckCircle, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

export const UpdatePopup = ({
  updateInfo,
  onClose,
}: {
  updateInfo: any;
  onClose: () => void;
}) => {
  const [status, setStatus] = useState<
    "idle" | "downloading" | "ready" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpdate = async () => {
    setStatus("downloading");
    try {
      let downloaded = 0;
      let total = 0;

      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength || 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (total > 0) {
              setProgress(Math.round((downloaded / total) * 100));
            }
            break;
          case "Finished":
            setStatus("ready");
            break;
        }
      });

      await relaunch();
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg("Cập nhật thất bại. Vui lòng thử lại sau.");
    }
  };

  if (!updateInfo) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <RefreshCw size={100} />
        </div>

        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
          Cập nhật mới: v{updateInfo?.version}
        </h3>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {updateInfo.body ||
            "Đã có bản cập nhật mới với nhiều tính năng hấp dẫn và sửa lỗi."}
        </p>

        {status === "downloading" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Đang tải xuống...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg mb-4 flex items-center gap-2 border border-red-500/20">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          {status !== "downloading" && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors"
            >
              Để sau
            </button>
          )}

          <button
            onClick={handleUpdate}
            disabled={status === "downloading"}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait transition-all"
          >
            {status === "idle" && (
              <>
                <Download size={14} /> Cập nhật ngay
              </>
            )}
            {status === "downloading" && (
              <>
                <RefreshCw size={14} className="animate-spin" /> Đang tải...
              </>
            )}
            {status === "ready" && (
              <>
                <CheckCircle size={14} /> Khởi động lại
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
