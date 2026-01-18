import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Upload,
  Music as MusicIcon,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Trash2,
  X,
  VolumeX,
  GripVertical,
} from "lucide-react";
import { useMusicStore, globalAudio } from "../../../../stores/useMusicStore";
import { useAppStore } from "../../../../stores/useAppStore";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";

// --- GLOBAL AUDIO CONTEXT SINGLETON (Đưa ra ngoài component) ---
// Giúp giữ kết nối visualizer không bị ngắt khi unmount component
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaElementAudioSourceNode | null = null;

const setupAudioGraph = () => {
  if (source) return; // Nếu đã kết nối rồi thì không làm lại (tránh lỗi)

  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    // Kết nối Global Audio vào Context
    source = audioContext.createMediaElementSource(globalAudio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  } catch (e) {
    console.error("Audio Graph Setup Error:", e);
  }
};

// --- UTILS: INDEXED DB ---
const DB_NAME = "OverDeskMusicDB";
const STORE_NAME = "songs";
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
  });
};
const saveFileToDB = async (id: string, file: Blob) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(file, id);
};
const getFileFromDB = async (id: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};

export const MusicModule = () => {
  const {
    playlist,
    currentIndex,
    isPlaying,
    repeatMode,
    isShuffle,
    volume,
    togglePlay,
    playNext,
    playPrev,
    setRepeatMode,
    toggleShuffle,
    addSong,
    setCurrentIndex,
    setPlaylist,
    setVolume,
    loadSource,
    setIsPlaying,
    reorderPlaylist,
  } = useMusicStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag Refs

  const currentSong = playlist[currentIndex];

  // --- DRAG & DROP HANDLERS ---

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(playlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderPlaylist(items);
  };

  // --- SELECT SONG HANDLER ---
  const handleSelectSong = (idx: number) => {
    setCurrentIndex(idx);
    setShowPlaylist(false); // 👇 Auto close
  };

  // --- VISUALIZER DRAWING FUNCTION ---
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser!.getByteFrequencyData(dataArray); // Dấu ! vì chắc chắn analyser đã init

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barWidth = (w / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.8;
        const gradient = ctx.createLinearGradient(0, h, 0, 0);
        gradient.addColorStop(0, "#6366f1");
        gradient.addColorStop(0.5, "#ec4899");
        gradient.addColorStop(1, "#a855f7");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, h - barHeight, barWidth, barHeight, 4);
        ctx.fill();
        x += barWidth + 2;
      }
    };
    draw();
  };

  // --- MOUNT & RESUME LOGIC (FIX LỖI MẤT CỘT NHẠC) ---
  useEffect(() => {
    // 1. Sync thông tin cơ bản
    setCurrentTime(globalAudio.currentTime);
    setDuration(globalAudio.duration || 0);
    globalAudio.volume = volume;

    // 2. Setup Audio Graph (Chỉ chạy 1 lần nếu chưa có)
    setupAudioGraph();

    // 3. Nếu đang hát -> Kích hoạt lại vòng lặp vẽ
    if (isPlaying) {
      if (audioContext?.state === "suspended") {
        audioContext.resume();
      }
      drawVisualizer();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []); // Run once on mount (khi mở bubble)

  // --- WATCH IS_PLAYING ---
  useEffect(() => {
    if (isPlaying) {
      // Resume context nếu bị browser treo
      if (audioContext?.state === "suspended") audioContext.resume();

      // Đảm bảo visualizer chạy
      // Hủy animation cũ trước để tránh chạy chồng chéo
      cancelAnimationFrame(animationRef.current);
      drawVisualizer();
    } else {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying]);

  // --- LOAD SOURCE LOGIC ---
  useEffect(() => {
    const prepareAudio = async () => {
      if (!currentSong) return;

      const activeSongId = globalAudio.getAttribute("data-active-song-id");
      if (activeSongId === currentSong.id) {
        setCurrentTime(globalAudio.currentTime);
        setDuration(globalAudio.duration || 0);
        return;
      }

      let src = currentSong.url;
      if (currentSong.isLocal) {
        const blob = await getFileFromDB(currentSong.id);
        if (blob) src = URL.createObjectURL(blob);
      }

      loadSource(src);
      globalAudio.setAttribute("data-active-song-id", currentSong.id);

      if (isPlaying) {
        globalAudio.play().catch(() => {});
        // Đảm bảo visualizer chạy khi đổi bài
        cancelAnimationFrame(animationRef.current);
        drawVisualizer();
      }
    };
    prepareAudio();
  }, [currentSong?.id]);

  // --- EVENT LISTENERS ---
  useEffect(() => {
    const updateTime = () => setCurrentTime(globalAudio.currentTime);
    const updateDuration = () => setDuration(globalAudio.duration);

    const handleEnded = () => {
      if (useAppStore.getState().lastActiveApp === "music") {
        if (repeatMode === "one") {
          globalAudio.currentTime = 0;
          globalAudio.play();
        } else {
          playNext();
        }
      } else {
        setIsPlaying(false);
        globalAudio.pause();
        globalAudio.currentTime = 0;
      }
    };

    globalAudio.addEventListener("timeupdate", updateTime);
    globalAudio.addEventListener("loadedmetadata", updateDuration);
    globalAudio.addEventListener("ended", handleEnded);

    return () => {
      globalAudio.removeEventListener("timeupdate", updateTime);
      globalAudio.removeEventListener("loadedmetadata", updateDuration);
      globalAudio.removeEventListener("ended", handleEnded);
    };
  }, [repeatMode, playNext, setIsPlaying]);

  // --- UI HANDLERS ---
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    globalAudio.currentTime = time;
    setCurrentTime(time);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = `song-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 5)}`;
        await saveFileToDB(id, file);
        addSong({
          id: id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: "",
          isLocal: true,
        });
      }
      alert("Songs added!");
    }
  };

  const cycleRepeat = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  const removeSong = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 1);
    setPlaylist(newPlaylist);
    if (index === currentIndex) {
      setIsPlaying(false);
      globalAudio.pause();
      globalAudio.currentTime = 0;
      globalAudio.removeAttribute("data-active-song-id");
    }
    if (index < currentIndex) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="h-full w-full pb-72 flex flex-col bg-slate-900 text-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-slate-900 to-black pointer-events-none"></div>

      {/* HEADER */}
      <div className="flex-none p-6 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900/90 to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`absolute inset-0 bg-pink-500 rounded-xl blur-lg opacity-40 ${
                isPlaying ? "animate-pulse" : ""
              }`}
            ></div>
            <div className="relative p-3 bg-slate-800 rounded-xl border border-white/10 shadow-xl">
              <MusicIcon size={24} className="text-pink-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Sonic Wave
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? "bg-green-500 animate-pulse" : "bg-slate-500"
                }`}
              ></div>
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                {isPlaying ? "LIVE AUDIO" : "STANDBY"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`p-2.5 rounded-xl transition-all border ${
              showPlaylist
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                : "bg-white/5 border-white/10 text-slate-300"
            }`}
          >
            <ListMusic size={20} />
          </button>
          <label className="cursor-pointer p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white border border-white/10">
            <input
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Upload size={20} />
          </label>
        </div>
      </div>

      {/* MAIN BODY: VISUALIZER */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 z-10">
        {/* VISUALIZER CONTAINER */}
        <div
          className="absolute inset-0 flex items-end justify-center z-0 opacity-60 pointer-events-none
            pb-[14rem]       /* Mobile: Padding đáy lớn (vì cụm control xếp dọc chiếm chỗ) */
            md:pb-28         /* Tablet: Giảm padding */
            lg:pb-32         /* Desktop: Padding chuẩn */
          "
        >
          <canvas
            ref={canvasRef}
            /* LƯU Ý: Bỏ width={500} height={400} cứng ở đây. 
           Hãy để code JS trong hàm drawVisualizer tự set width/height 
           theo kích thước thật của thẻ div cha (containerRef) để nét nhất.
        */
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center mb-10 z-20 w-full max-w-2xl px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white truncate drop-shadow-lg mb-3">
            {currentSong?.name || "Select a Song"}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10">
              STEREO
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10">
              44.1kHz
            </span>
          </div>
        </div>
        <div className="h-[30vh]"></div>
        {/* CONTROLS */}
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl">
          {/* Progress */}
          <div className="mb-6 group">
            <div className="flex justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="text-pink-400">{formatTime(currentTime)}</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </div>
            <div className="relative h-1 bg-slate-800 rounded-full cursor-pointer overflow-hidden group-hover:h-2 transition-all">
              <div className="absolute top-0 left-0 h-full bg-slate-700 w-full"></div>
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              ></div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-between mb-1.5"></div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-4 bg-white/5 p-2 rounded-2xl shadow-inner">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-all ${
                isShuffle
                  ? "text-pink-400 bg-pink-400/10"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              <Shuffle size={15} />
            </button>

            <div className="w-full flex justify-center items-center gap-6">
              {/* Previous */}
              <button
                onClick={playPrev}
                className="text-slate-400 hover:text-white hover:scale-110 transition-all"
              >
                <SkipBack size={15} fill="currentColor" />
              </button>
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-indigo-500 to-pink-600 text-white flex items-center justify-center hover:scale-105 active:scale-80 transition-all shadow-[0_0_20px_rgba(236,72,153,0.4)] ring-3 ring-slate-900"
              >
                {isPlaying ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-1" />
                )}
              </button>
              {/* Next */}
              <button
                onClick={playNext}
                className="text-slate-400 hover:text-white hover:scale-110 transition-all"
              >
                <SkipForward size={15} fill="currentColor" />
              </button>
            </div>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-full transition-all relative ${
                repeatMode !== "off"
                  ? "text-pink-400 bg-pink-400/10"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {repeatMode === "one" ? (
                <Repeat1 size={15} />
              ) : (
                <Repeat size={15} />
              )}
            </button>
          </div>
          {/* Volume */}
          <div className="flex items-center gap-2 group w-full mt-1 bg-white/5 p-3 rounded-2xl shadow-inner">
            <button
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="flex-1 h-1 bg-slate-700 rounded-full relative">
              <div
                className="absolute top-0 left-0 h-full bg-slate-400 rounded-full"
                style={{ width: `${volume * 100}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- PLAYLIST SIDEBAR --- */}
      <div
        className={`absolute top-0 right-0 w-80 
    h-full max-h-[100dvh]  /* QUAN TRỌNG: Giới hạn chiều cao bằng đúng màn hình */
    bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 
    transition-transform duration-300 z-50 shadow-2xl flex flex-col
    ${showPlaylist ? "translate-x-0" : "translate-x-full"}
  `}
      >
        {/* 1. HEADER (Cố định chiều cao h-14) */}
        <div className="h-14 px-4 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-widest">
            <ListMusic size={14} className="text-indigo-500" /> Playlist (
            {playlist.length})
          </h3>
          <button
            onClick={() => setShowPlaylist(false)}
            className="text-slate-500 hover:text-white hover:rotate-90 transition-all p-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. KHU VỰC CUỘN (SCROLLABLE AREA) */}
        {/* QUAN TRỌNG: height = 100% - 3.5rem (chiều cao header) */}
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto custom-scrollbar p-2 pb-24">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="playlist">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col gap-1"
                >
                  {playlist.map((song, idx) => (
                    <Draggable key={song.id} draggableId={song.id} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                          }}
                          onClick={() => handleSelectSong(idx)}
                          className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border select-none shrink-0
                      ${
                        idx === currentIndex
                          ? "bg-indigo-500/10 border-indigo-500/40"
                          : "hover:bg-white/5 border-transparent"
                      }
                      ${
                        snapshot.isDragging
                          ? "bg-indigo-500/20 shadow-xl z-50 ring-1 ring-indigo-500/50"
                          : ""
                      }
                    `}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-slate-600 group-hover:text-slate-400 p-1 shrink-0"
                            >
                              <GripVertical size={14} />
                            </div>

                            <div className="overflow-hidden">
                              <div
                                className={`text-sm font-medium truncate ${
                                  idx === currentIndex
                                    ? "text-indigo-400"
                                    : "text-slate-300 group-hover:text-white"
                                }`}
                              >
                                {song.name}
                              </div>
                              {idx === currentIndex && isPlaying && (
                                <div className="text-[9px] text-indigo-500/70 font-mono mt-0.5 animate-pulse">
                                  Now Playing...
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => removeSong(idx, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-all text-slate-500 shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Empty State */}
          {playlist.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-xs">
              <MusicIcon size={24} className="mb-2 opacity-20" />
              <p>No songs in playlist</p>
            </div>
          )}

          {/* Một khoảng trống ở dưới cùng để đảm bảo scroll được tới item cuối */}
          <div className="h-10 shrink-0" />
        </div>
      </div>
    </div>
  );
};
