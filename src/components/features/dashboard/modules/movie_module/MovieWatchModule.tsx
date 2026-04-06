import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Maximize,
  Sun,
  Moon,
  Tv,
  Share2,
  MessageCircle,
  Lightbulb,
  Volume2,
  VolumeX,
  Upload,
  FileVideo,
  Film,
  MousePointer2,
  X,
  Music,
  Loader2,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { supabase } from "../../../../../supabaseClient";

// --- TYPES ---
interface Movie {
  id: string;
  title: string;
  video_url: string;
  duration?: number;
  created_at: string;
  user_id?: string;
}

// --- HELPER ---
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" + s : s}`;
};

export const MovieWatchModule = () => {
  // --- STATE ---
  // Data State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);

  // [FIXED] Đã thêm lại 2 dòng này
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState(0);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // UI State
  const [isTheater, setIsTheater] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // --- INIT DATA ---
  useEffect(() => {
    fetchMovies();
  }, []);

  // --- CRUD OPERATIONS ---

  // 1. READ: Fetch all movies
  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMovies(data || []);

      // Tự động chọn video đầu tiên nếu có
      if (data && data.length > 0 && !currentMovie) {
        // setCurrentMovie(data[0]);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  // 2. CREATE: Upload video & Save metadata
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file.");
      return;
    }

    setIsUploading(true);
    // setUploadProgress(0);

    try {
      // A. Upload to Storage
      // Đặt tên file unique để tránh trùng lặp
      const fileExt = file.name.split(".").pop();
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(uniqueName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // B. Get Public URL
      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(uniqueName);

      // C. Save to Database
      const { data: insertData, error: insertError } = await supabase
        .from("movies")
        .insert([
          {
            title: file.name,
            video_url: urlData.publicUrl,
          },
        ])
        .select();

      if (insertError) throw insertError;

      // D. Update Local State
      if (insertData) {
        setMovies([insertData[0], ...movies]);
        setCurrentMovie(insertData[0]); // Auto play uploaded video
      }

      // setUploadProgress(100);
      setTimeout(() => setIsUploading(false), 1000);
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
      setIsUploading(false);
    }
  };

  // 3. DELETE: Remove video
  const deleteMovie = async (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering play
    if (!window.confirm("Bạn có chắc chắn muốn xóa video này không?")) return;

    try {
      // A. Delete from DB
      const { error: dbError } = await supabase
        .from("movies")
        .delete()
        .eq("id", movie.id);

      if (dbError) throw dbError;

      // C. Update Local State
      const newMovies = movies.filter((m) => m.id !== movie.id);
      setMovies(newMovies);

      // Nếu đang xem video bị xóa thì reset player
      if (currentMovie?.id === movie.id) {
        setCurrentMovie(null);
        setVideoSrc(null);
        setFileName("");
        setIsPlaying(false);
      }
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  // --- PLAYER LOGIC ---

  // Khi chọn phim mới, cập nhật player
  useEffect(() => {
    if (currentMovie) {
      setVideoSrc(currentMovie.video_url);
      setFileName(currentMovie.title);
      setIsPlaying(true); // Auto play
      setProgress(0);
      setCurrentTime(0);
    }
  }, [currentMovie]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(curr);
      setDuration(total || 0);
      setProgress((curr / total) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (val / 100) * duration;
      setProgress(val);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleTheater = () => {
    setIsTheater(!isTheater);
    if (isTheater && mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div
      ref={mainScrollRef}
      className={clsx(
        "h-full w-full font-sans transition-colors duration-300 flex flex-col relative overflow-y-auto custom-scrollbar",
        isDark ? "bg-[#0f0f0f] text-slate-200" : "bg-slate-50 text-slate-800",
      )}
    >
      <div
        className={clsx(
          "fixed inset-0 bg-black z-[40] transition-opacity duration-500 pointer-events-none",
          isLightsOff ? "opacity-95" : "opacity-0",
        )}
      />

      {/* HEADER */}
      <header
        className={clsx(
          "sticky top-0 z-50 h-16 border-b backdrop-blur-md flex items-center justify-between px-4 lg:px-8 transition-colors shrink-0",
          isDark
            ? "bg-[#0f0f0f]/90 border-white/5"
            : "bg-white/90 border-slate-200",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-red-600/30">
            <Film size={18} />
          </div>
          <span className="font-bold text-lg hidden sm:block">
            Cinema <span className="font-light opacity-60">Cloud</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleFileUpload}
          />

          {isUploading ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Uploading...
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              <Upload size={16} />{" "}
              <span className="hidden sm:inline">Upload New</span>
            </button>
          )}

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        className={clsx(
          "flex-1 w-full mx-auto p-4 lg:p-6 transition-all duration-300",
          isTheater ? "max-w-full px-0 py-0" : "max-w-[1600px]",
        )}
      >
        <div
          className={clsx(
            "grid gap-6",
            isTheater ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12",
          )}
        >
          {/* === PLAYER AREA === */}
          <div
            className={clsx(
              "flex flex-col gap-4",
              isTheater ? "col-span-1" : "lg:col-span-9",
            )}
          >
            {/* VIDEO CONTAINER */}
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
              className={clsx(
                "relative group bg-black overflow-hidden shadow-2xl transition-all duration-500",
                document.fullscreenElement
                  ? "w-full h-full rounded-none"
                  : isTheater
                    ? "h-[85vh] rounded-none"
                    : "aspect-video rounded-2xl ring-1 ring-white/10",
              )}
              onDoubleClick={toggleFullscreen}
            >
              {videoSrc ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    onClick={togglePlay}
                    autoPlay
                  />

                  {/* CONTROLS OVERLAY */}
                  <div
                    className={clsx(
                      "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-between p-4 md:p-6 transition-opacity duration-300",
                      showControls || !isPlaying ? "opacity-100" : "opacity-0",
                    )}
                  >
                    {/* Top Bar */}
                    <div className="flex justify-between items-start">
                      <h2 className="text-white font-bold text-lg drop-shadow-md line-clamp-1">
                        {currentMovie?.title || fileName}
                      </h2>
                      <button
                        onClick={() => {
                          setVideoSrc(null);
                          setCurrentMovie(null);
                          setFileName("");
                        }}
                        className="p-2 bg-white/10 hover:bg-red-600 text-white rounded-full backdrop-blur transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Play Button (Center) */}
                    {!isPlaying && (
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={togglePlay}
                      >
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center pl-1 border border-white/20 hover:bg-red-600 hover:border-red-600 hover:scale-110 transition-all duration-300 shadow-2xl">
                          <Play fill="white" size={36} className="text-white" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="space-y-2">
                      <div className="group/time relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer hover:h-2.5 transition-all flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.1"
                          value={progress}
                          onChange={handleSeek}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        <div
                          className="h-full bg-red-600 rounded-full relative"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 border-2 border-white rounded-full scale-0 group-hover/time:scale-100 transition-transform shadow-lg"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-white">
                          <button
                            onClick={togglePlay}
                            className="hover:text-red-500 transition-colors"
                          >
                            {isPlaying ? (
                              <Pause fill="currentColor" size={24} />
                            ) : (
                              <Play fill="currentColor" size={24} />
                            )}
                          </button>

                          <div className="flex items-center gap-2 group/vol relative">
                            <button
                              onClick={() => {
                                const newMute = !isMuted;
                                setIsMuted(newMute);
                                if (videoRef.current)
                                  videoRef.current.muted = newMute;
                              }}
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeX size={24} />
                              ) : (
                                <Volume2 size={24} />
                              )}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setVolume(v);
                                setIsMuted(v === 0);
                                if (videoRef.current)
                                  videoRef.current.volume = v;
                              }}
                              className="w-20 h-1 bg-white/50 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <span className="text-sm font-mono opacity-90">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-white">
                          <button
                            onClick={() => setIsLightsOff(!isLightsOff)}
                            className={clsx(
                              "hover:text-yellow-400 transition-colors",
                              isLightsOff && "text-yellow-400",
                            )}
                            title="Tắt đèn"
                          >
                            <Lightbulb size={22} />
                          </button>
                          <button
                            onClick={toggleTheater}
                            className={clsx(
                              "hover:text-blue-400 transition-colors",
                              isTheater && "text-blue-400",
                            )}
                            title="Chế độ rạp"
                          >
                            <Tv size={22} />
                          </button>
                          <button
                            onClick={toggleFullscreen}
                            className="hover:text-white transition-colors"
                            title="Toàn màn hình"
                          >
                            <Maximize size={22} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* EMPTY STATE */
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#0a0a0a] cursor-pointer border-2 border-dashed border-white/5 hover:border-white/20 transition-all m-4 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-24 h-24 bg-gradient-to-tr from-white/5 to-white/0 rounded-full flex items-center justify-center mb-6 animate-pulse ring-1 ring-white/10">
                    <MousePointer2 size={40} className="opacity-50" />
                  </div>
                  <h3
                    className={clsx(
                      "text-xl font-bold mb-2",
                      isDark ? "text-white" : "text-slate-800",
                    )}
                  >
                    Select or Drag Video
                  </h3>
                  <p className="text-sm opacity-60">
                    to start watching instantly
                  </p>
                </div>
              )}
            </div>

            {/* INFO BAR */}
            <div
              className={clsx(
                "flex flex-col md:flex-row gap-6 p-6 rounded-2xl border",
                isDark
                  ? "bg-[#18181b] border-white/5"
                  : "bg-white border-slate-200",
              )}
            >
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                <Music size={32} />
              </div>
              <div className="flex-1">
                <h1
                  className={clsx(
                    "text-2xl font-black mb-1 line-clamp-1",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  {currentMovie?.title || fileName || "No Video Playing"}
                </h1>
                <p className="text-sm opacity-60 leading-relaxed">
                  Cloud Cinema Player. Uploaded videos are securely stored and
                  streamed from high-speed servers. Enjoy cinematic experience.
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2",
                      isDark
                        ? "hover:bg-white/5 border-white/10"
                        : "hover:bg-slate-100 border-slate-200",
                    )}
                  >
                    <Share2 size={16} /> Share
                  </button>
                  <button
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2",
                      isDark
                        ? "hover:bg-white/5 border-white/10"
                        : "hover:bg-slate-100 border-slate-200",
                    )}
                  >
                    <MessageCircle size={16} /> Comments
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* === RIGHT: PLAYLIST (3/12) === */}
          <div
            className={clsx(
              "flex flex-col gap-6",
              isTheater ? "col-span-1" : "lg:col-span-3",
            )}
          >
            <div
              className={clsx(
                "rounded-2xl border overflow-hidden flex flex-col shadow-lg sticky top-6",
                isDark
                  ? "bg-[#18181b] border-white/5"
                  : "bg-white border-slate-200",
              )}
            >
              <div
                className={clsx(
                  "p-4 border-b flex items-center justify-between",
                  isDark
                    ? "border-white/5 bg-[#202023]"
                    : "border-slate-100 bg-slate-50",
                )}
              >
                <h3 className="font-bold text-sm uppercase">Cloud Playlist</h3>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-400">
                  {movies.length} videos
                </span>
              </div>

              <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                {movies.length > 0 ? (
                  movies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => setCurrentMovie(movie)}
                      className={clsx(
                        "flex gap-3 p-2 rounded-xl cursor-pointer transition-all border group relative overflow-hidden",
                        currentMovie?.id === movie.id
                          ? "bg-red-600/10 border-red-600/50"
                          : isDark
                            ? "bg-transparent border-transparent hover:bg-white/5"
                            : "bg-transparent border-transparent hover:bg-slate-100",
                      )}
                    >
                      {currentMovie?.id === movie.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                      )}

                      <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                        {/* Placeholder Thumbnail - In real app, generate thumbnails */}
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                          <FileVideo size={20} className="opacity-50" />
                        </div>
                        <div
                          className={clsx(
                            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
                            currentMovie?.id === movie.id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                        >
                          <Play size={20} fill="white" className="text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center relative">
                        <div
                          className={clsx(
                            "text-sm font-bold truncate mb-1",
                            currentMovie?.id === movie.id
                              ? "text-red-500"
                              : isDark
                                ? "text-slate-200"
                                : "text-slate-800",
                          )}
                        >
                          {movie.title}
                        </div>
                        <div className="text-[10px] opacity-60 truncate">
                          {new Date(movie.created_at).toLocaleDateString()}
                        </div>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={(e) => deleteMovie(movie, e)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-500 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Video"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 opacity-50">
                    <FileVideo size={48} className="mb-2 opacity-50" />
                    <p className="text-sm">No videos yet</p>
                    <p className="text-xs mt-1">
                      Upload a video to get started
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 border border-dashed border-slate-500/30 rounded-xl text-sm font-bold opacity-60 hover:opacity-100 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {isUploading ? "Uploading..." : "Upload New Video"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
