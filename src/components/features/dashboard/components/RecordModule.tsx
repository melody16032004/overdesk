import { useState, useRef, useEffect } from "react";
// 👇 SỬA IMPORT TẠI ĐÂY
import { Mp3Encoder } from "@breezystack/lamejs";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  FileAudio,
  Edit2,
  Check,
  Monitor,
  Laptop2,
  Share2,
  Download,
  MoreVertical,
  Loader2,
  Activity,
  Music,
  X,
} from "lucide-react";
import {
  useRecordStore,
  saveRecordingToDB,
  getRecordingFromDB,
  deleteRecordingFromDB,
  Recording,
} from "../../../../stores/useRecordStore";
import { useToastStore } from "../../../../stores/useToastStore";

// --- UTILS ---
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const getSmartName = (source: "mic" | "system") => {
  const hour = new Date().getHours();
  const prefix = source === "mic" ? "Voice" : "System Audio";
  if (hour < 12) return `Morning ${prefix}`;
  if (hour < 18) return `Afternoon ${prefix}`;
  return `Evening ${prefix}`;
};

// --- WAV CONVERTER UTILITY ---
const bufferToWave = (abuffer: AudioBuffer, len: number) => {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this demo)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < len) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

// --- MP3 CONVERTER (ĐÃ SỬA DÙNG @BREEZYSTACK/LAMEJS) ---
const bufferToMp3 = (buffer: AudioBuffer) => {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);

  // 👇 FIX LỖI TẠI ĐÂY:
  // Thay vì để "const mp3Data = []", ta khai báo rõ là "any[]"
  // Điều này giúp bỏ qua việc kiểm tra type ArrayBufferLike khắt khe của TypeScript
  const mp3Data: any[] = [];

  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;

  const sampleBlockSize = 1152;
  const dt = new Int16Array(left.length);
  const dt2 = new Int16Array(right.length);

  for (let i = 0; i < left.length; i++) {
    let s = Math.max(-1, Math.min(1, left[i]));
    dt[i] = s < 0 ? s * 0x8000 : s * 0x7fff;

    if (channels > 1) {
      let s2 = Math.max(-1, Math.min(1, right[i]));
      dt2[i] = s2 < 0 ? s2 * 0x8000 : s2 * 0x7fff;
    }
  }

  for (let i = 0; i < dt.length; i += sampleBlockSize) {
    const leftChunk = dt.subarray(i, i + sampleBlockSize);
    const rightChunk =
      channels > 1 ? dt2.subarray(i, i + sampleBlockSize) : undefined;

    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);

  return new Blob(mp3Data, { type: "audio/mp3" });
};

export const RecordModule = () => {
  const {
    recordings,
    isRecording,
    recordingTime,
    setIsRecording,
    setRecordingTime,
    addRecording,
    removeRecording,
  } = useRecordStore();
  const { showToast } = useToastStore();

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [sourceType, setSourceType] = useState<"mic" | "system">("mic");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  // --- RECORDING ---
  const startRecording = async () => {
    try {
      let stream: MediaStream;
      if (sourceType === "mic") {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const audioTracks = displayStream.getAudioTracks();
        if (audioTracks.length === 0) {
          alert("Please check 'Share Audio'!");
          displayStream.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = new MediaStream([audioTracks[0]]);
        displayStream.getVideoTracks().forEach((t) => t.stop());
      }

      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      drawVisualizer();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const id = `rec-${Date.now()}`;
        const duration = useRecordStore.getState().recordingTime;
        await saveRecordingToDB(id, blob);
        addRecording({
          id,
          name: `${getSmartName(sourceType)} #${recordings.length + 1}`,
          date: new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          duration: duration,
        });
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animationRef.current);
        audioContext.close();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        const currentTime = useRecordStore.getState().recordingTime;
        setRecordingTime(currentTime + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // --- VISUALIZER ---
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        const gradient = ctx.createLinearGradient(
          0,
          canvas.height,
          0,
          canvas.height - barHeight
        );
        if (sourceType === "mic") {
          gradient.addColorStop(0, "#ef4444");
          gradient.addColorStop(1, "#fb923c");
        } else {
          gradient.addColorStop(0, "#3b82f6");
          gradient.addColorStop(1, "#06b6d4");
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    };
    draw();
  };

  // --- PLAYBACK ---
  const playRecording = async (rec: Recording) => {
    if (playingId === rec.id) {
      audioPlayerRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const blob = await getRecordingFromDB(rec.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.ontimeupdate = () => setPlaybackTime(audio.currentTime);
      audio.onended = () => {
        setPlayingId(null);
        setPlaybackTime(0);
      };
      audio.play();
      setPlayingId(rec.id);
    } else {
      alert("Audio file not found!");
    }
  };

  // --- DOWNLOAD ---
  const handleDownload = async (
    rec: Recording,
    format: "webm" | "wav" | "mp3"
  ) => {
    showToast("Preparing convert & download...", "info");
    setMenuOpenId(null);
    const blob = await getRecordingFromDB(rec.id);
    if (!blob) return;

    if (format === "webm") {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rec.name}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Download file with [.webm]", "success");
    } else {
      setIsConverting(true);
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioCtx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        let outputBlob: Blob;
        let extension = "";

        if (format === "wav") {
          outputBlob = bufferToWave(audioBuffer, audioBuffer.length);
          extension = "wav";
        } else {
          outputBlob = bufferToMp3(audioBuffer);
          extension = "mp3";
        }

        const url = URL.createObjectURL(outputBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${rec.name}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Download file with [${extension}]`, "success");
      } catch (e) {
        console.error("Convert failed", e);
        alert(`Failed to convert to ${format.toUpperCase()}`);
      } finally {
        setIsConverting(false);
      }
    }
  };

  // --- SHARE ---
  const handleShare = async (rec: Recording) => {
    setMenuOpenId(null); // Đóng menu
    try {
      const blob = await getRecordingFromDB(rec.id);
      if (!blob) return alert("File not found!");

      // Tạo file có định dạng rõ ràng để OS nhận diện
      const file = new File([blob], `${rec.name}.webm`, {
        type: "audio/webm",
        lastModified: new Date().getTime(),
      });

      // Kiểm tra trình duyệt có hỗ trợ share File không
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: rec.name,
            text: "Listen to my voice recording", // Một số app sẽ dùng text này làm caption
          });
        } catch (shareError) {
          // Lỗi này thường do người dùng bấm Cancel bảng share
          if ((shareError as any).name !== "AbortError") {
            console.error("Share failed:", shareError);
          }
        }
      } else {
        // Fallback cho PC/Desktop: Không share file trực tiếp được
        // -> Tự động tải xuống và hướng dẫn người dùng
        const confirmDownload = window.confirm(
          "Trình duyệt trên máy tính chưa hỗ trợ chia sẻ file trực tiếp lên Messenger/Facebook.\n\nBạn có muốn tải file về máy để tự gửi không?"
        );

        if (confirmDownload) {
          handleDownload(rec, "webm");
        }
      }
    } catch (err) {
      console.error("Error preparing share:", err);
    }
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    if (playingId === id) {
      audioPlayerRef.current?.pause();
      setPlayingId(null);
    }
    await deleteRecordingFromDB(id);
    removeRecording(id);
  };

  const saveName = () => {
    if (editingId && editName.trim()) {
      useRecordStore.setState((state) => ({
        recordings: state.recordings.map((r) =>
          r.id === editingId ? { ...r, name: editName } : r
        ),
      }));
      setEditingId(null);
    }
  };

  const startEditing = (rec: Recording) => {
    setEditingId(rec.id);
    setEditName(rec.name);
  };

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div
      className="h-full w-full flex flex-col bg-slate-950 text-white font-sans overflow-hidden relative"
      onClick={() => setMenuOpenId(null)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none"></div>

      {/* HEADER */}
      <div className="flex-none p-4 flex items-center justify-between z-10 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl transition-colors ${
              isRecording
                ? "bg-red-500/20 text-red-500 animate-pulse"
                : "bg-white/10 text-slate-400"
            }`}
          >
            {sourceType === "mic" ? <Mic size={20} /> : <Monitor size={20} />}
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight text-white">
              Voice Memo
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider">
              {isRecording ? "RECORDING..." : "READY"}
            </p>
          </div>
        </div>
        <div
          className={`text-xl font-mono font-bold tracking-widest ${
            isRecording ? "text-red-400" : "text-slate-600"
          }`}
        >
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* VISUALIZER */}
      <div className="flex-none h-56 relative flex flex-col items-center justify-center border-b border-white/5 bg-black/20 z-10">
        <div className="absolute inset-0 w-full h-full opacity-60">
          {isRecording ? (
            <canvas ref={canvasRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
              <Activity size={40} strokeWidth={1} />
            </div>
          )}
        </div>

        {!isRecording && (
          <div className="relative z-20 flex bg-slate-800/50 p-1 rounded-full border border-white/5 mb-6">
            <button
              onClick={() => setSourceType("mic")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                sourceType === "mic"
                  ? "bg-red-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mic size={14} /> Mic
            </button>
            <button
              onClick={() => setSourceType("system")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                sourceType === "system"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor size={14} /> System
            </button>
          </div>
        )}

        <div className="relative z-20">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ring-4 ring-offset-4 ring-offset-slate-900 animate-pulse ${
              isRecording
                ? "bg-white ring-red-500 text-red-500 scale-90"
                : `${
                    sourceType === "mic" ? "bg-red-500" : "bg-blue-500"
                  } ring-slate-800 text-white hover:scale-105`
            }`}
          >
            {isRecording ? (
              <Square size={32} fill="currentColor" />
            ) : sourceType === "mic" ? (
              <Mic size={40} />
            ) : (
              <Laptop2 size={40} />
            )}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 custom-scrollbar">
        {recordings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 opacity-60">
            <FileAudio size={40} className="mb-3" />
            <p className="text-xs uppercase tracking-wider">Empty Library</p>
          </div>
        )}

        {recordings.map((rec) => (
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
                      className="text-sm font-semibold truncate cursor-pointer text-slate-200"
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
    </div>
  );
};
