import { Loader2, Wifi, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";

export const Disconnected = ({
  status,
  stars,
  themeBorder,
  themeText,
  errorMsg,
  themeClass,
}: any) => {
  return (
    <div className="h-[100dvh] w-full bg-[#09101a] text-slate-100 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none">{stars}</div>
      <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
        <div
          className={`w-[300px] h-[300px] rounded-full border-4 ${themeBorder} animate-[ping_3s_linear_infinite]`}
        ></div>
        <div
          className={`absolute w-[200px] h-[200px] rounded-full border-4 ${themeBorder} animate-[ping_3s_linear_infinite_1s]`}
        ></div>
      </div>
      <div className="z-10 flex flex-col items-center gap-6 p-8 text-center max-w-sm">
        <div
          className={`w-24 h-24 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl relative`}
        >
          {status === "connecting" ? (
            <>
              <Loader2 className={`w-10 h-10 ${themeText} animate-spin`} />
              <div
                className={`absolute -bottom-1 -right-1 w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center border border-white/10`}
              >
                <Wifi className="w-4 h-4 text-white" />
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-10 h-10 text-red-500" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center border border-white/10">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            </>
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {status === "connecting" ? "Đang kết nối..." : "Mất kết nối"}
          </h2>
          <p className="text-sm text-slate-400">
            {status === "connecting"
              ? "Đang tìm kiếm thiết bị chủ. Vui lòng đợi."
              : errorMsg || "Không thể liên lạc với máy chủ."}
          </p>
        </div>
        {status === "error" && (
          <button
            onClick={() => window.location.reload()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white shadow-lg active:scale-95 transition-all ${themeClass}`}
          >
            <RefreshCw size={18} /> Thử lại ngay
          </button>
        )}
      </div>
      <div className="absolute bottom-8 text-[10px] text-slate-600 font-mono">
        OVERDESK P2P • SECURE LINK
      </div>
    </div>
  );
};
