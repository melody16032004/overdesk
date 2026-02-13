import { useState, useRef, useEffect } from "react";
import { Mic, Monitor } from "lucide-react";
import {
  useRecordStore,
  saveRecordingToDB,
  getRecordingFromDB,
  deleteRecordingFromDB,
  Recording,
} from "../../../../../stores/useRecordStore";
import { useToastStore } from "../../../../../stores/useToastStore";
import {
  getSmartName,
  bufferToWave,
  bufferToMp3,
  formatTime,
} from "./helpers/record_helper";
import { List } from "./components/List";
import { Visualizer } from "./components/Visualizer";

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
          canvas.height - barHeight,
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
    format: "webm" | "wav" | "mp3",
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
          "Trình duyệt trên máy tính chưa hỗ trợ chia sẻ file trực tiếp lên Messenger/Facebook.\n\nBạn có muốn tải file về máy để tự gửi không?",
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
          r.id === editingId ? { ...r, name: editName } : r,
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
      <Visualizer
        isRecording={isRecording}
        canvasRef={canvasRef}
        setSourceType={setSourceType}
        sourceType={sourceType}
        stopRecording={stopRecording}
        startRecording={startRecording}
      />

      {/* LIST */}
      <List
        recordings={recordings}
        playingId={playingId}
        playbackTime={playbackTime}
        playRecording={playRecording}
        editingId={editingId}
        editName={editName}
        setEditName={setEditName}
        saveName={saveName}
        setEditingId={setEditingId}
        startEditing={startEditing}
        setMenuOpenId={setMenuOpenId}
        menuOpenId={menuOpenId}
        handleShare={handleShare}
        handleDownload={handleDownload}
        isConverting={isConverting}
        handleDelete={handleDelete}
      />
    </div>
  );
};
