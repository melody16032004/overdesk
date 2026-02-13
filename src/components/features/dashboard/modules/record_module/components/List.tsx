import {
  FileAudio,
  Pause,
  Play,
  Check,
  X,
  Edit2,
  MoreVertical,
  Share2,
  Loader2,
  Download,
  Music,
  Trash2,
} from "lucide-react";
import { formatTime } from "../helpers/record_helper";

export const List = ({
  recordings,
  playingId,
  playbackTime,
  playRecording,
  editingId,
  editName,
  setEditName,
  saveName,
  setEditingId,
  startEditing,
  setMenuOpenId,
  menuOpenId,
  handleShare,
  handleDownload,
  isConverting,
  handleDelete,
}: any) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 custom-scrollbar">
      {recordings.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-slate-600 opacity-60">
          <FileAudio size={40} className="mb-3" />
          <p className="text-xs uppercase tracking-wider">Empty Library</p>
        </div>
      )}

      {recordings.map((rec: any) => (
        <div
          key={rec.id}
          className={`group relative overflow-visible flex flex-col p-3 rounded-2xl border transition-all duration-300 ${
            playingId === rec.id
              ? "bg-slate-800 border-slate-600"
              : "bg-white/5 border-white/5 hover:border-white/10"
          }`}
        >
          {playingId === rec.id && (
            <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full rounded-b-2xl overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ease-linear ${
                  rec.name.includes("System") ? "bg-blue-500" : "bg-red-500"
                }`}
                style={{ width: `${(playbackTime / rec.duration) * 100}%` }}
              ></div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 relative">
            <button
              onClick={() => playRecording(rec)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                playingId === rec.id
                  ? rec.name.includes("System")
                    ? "bg-blue-500 text-white"
                    : "bg-red-500 text-white"
                  : "bg-slate-800 text-slate-400 group-hover:text-white"
              }`}
            >
              {playingId === rec.id ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-1" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              {editingId === rec.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    className="bg-transparent border-b border-blue-500 text-white text-sm w-full focus:outline-none pb-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <button onClick={saveName} className="text-green-400">
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-slate-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/title">
                  <h4
                    className="text-sm font-semibold truncate pointer text-slate-200"
                    onClick={() => playRecording(rec)}
                  >
                    {rec.name}
                  </h4>
                  <button
                    onClick={() => startEditing(rec)}
                    className="opacity-0 group-hover/title:opacity-100 text-slate-500 hover:text-white"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
                <span>{formatTime(rec.duration)}</span>
                <span>{rec.date}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border ${
                    rec.name.includes("System")
                      ? "border-blue-500/30 text-blue-400"
                      : "border-red-500/30 text-red-400"
                  }`}
                >
                  {rec.name.includes("System") ? "SYS" : "MIC"}
                </span>
              </div>
            </div>

            {/* ACTION MENU */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === rec.id ? null : rec.id);
                }}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <MoreVertical size={18} />
              </button>

              {menuOpenId === rec.id && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => handleShare(rec)}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3"
                  >
                    <Share2 size={16} /> Share
                  </button>
                  <div className="h-px bg-slate-700 mx-2" />

                  <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Download
                  </h3>
                  <button
                    onClick={() => handleDownload(rec, "wav")}
                    disabled={isConverting}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3"
                  >
                    {isConverting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <FileAudio size={16} />
                    )}
                    .wav
                  </button>
                  <button
                    onClick={() => handleDownload(rec, "webm")}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3"
                  >
                    <Download size={16} /> .webm
                  </button>
                  <button
                    onClick={() => handleDownload(rec, "mp3")}
                    disabled={isConverting}
                    className="w-full text-left px-4 py-2.5 text-xs md:text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3"
                  >
                    {isConverting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Music size={16} />
                    )}
                    .mp3
                  </button>

                  <div className="h-px bg-slate-700 mx-2"></div>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
