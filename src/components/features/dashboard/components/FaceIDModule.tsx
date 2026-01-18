import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { getCurrentWindow } from "@tauri-apps/api/window"; // 👈 Import để chỉnh size window
import {
  Scan,
  User,
  AlertTriangle,
  Activity,
  Cpu,
  Save,
  Trash2,
  CheckCircle,
} from "lucide-react";

export const FaceIDModule = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanningRef = useRef(false);
  const lastBoxRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const eyesClosedRef = useRef(false);

  const [isInitializing, setIsInitializing] = useState(true);
  const [detectionData, setDetectionData] = useState<{
    age?: number;
    gender?: string;
    expression?: string;
    name?: string;
    distance?: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());
  const [savedFaceDescriptor, setSavedFaceDescriptor] =
    useState<Float32Array | null>(null);
  const [isFaceSaved, setIsFaceSaved] = useState(false);

  // --- SETUP ---
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const initWindow = async () => {
      await appWindow.setResizable(true);
      await appWindow.setFullscreen(true);
    };
    initWindow();

    const saved = localStorage.getItem("userFaceDescriptor");
    if (saved) {
      setSavedFaceDescriptor(
        new Float32Array(Object.values(JSON.parse(saved)))
      );
      setIsFaceSaved(true);
    }

    const timer = setInterval(
      () => setSystemTime(new Date().toLocaleTimeString()),
      1000
    );

    return () => {
      clearInterval(timer);
      stopCamera();
      // Lưu ý: Không reset window ở cleanup để tránh xung đột với StrictMode
    };
  }, []);

  const handleRescan = () => {
    stopScanningRef.current = false;
    setDetectionData(null);
    lastBoxRef.current = null;
    eyesClosedRef.current = false;
    if (videoRef.current) {
      videoRef.current.play();
      handleVideoPlay();
    }
  };

  // --- LOAD MODELS ---
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        startVideo();
      } catch (err) {
        console.error(err);
        setError("AI FAILURE: Check /public/models");
        setIsInitializing(false);
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setError("CAMERA ERROR: " + err.message);
        setIsInitializing(false);
      });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // --- LOGIC DETECT ---
  const handleVideoPlay = () => {
    setIsInitializing(false);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    const detect = async () => {
      // Kiểm tra nếu video đã bị dừng hoặc component đã unmount thì thôi
      if (!video || video.paused || video.ended || !streamRef.current) return;

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()
        .withFaceDescriptors(); // 👈 Lấy thêm descriptor để so sánh

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Vẽ khung
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      if (resizedDetections.length > 0) {
        const data = resizedDetections[0];

        // --- LOGIC NHẬN DIỆN NGƯỜI QUEN ---
        let personName = "STRANGER";
        let matchDistance = 1;

        if (savedFaceDescriptor) {
          // Tạo bộ so sánh
          const faceMatcher = new faceapi.FaceMatcher(savedFaceDescriptor, 0.5); // 0.5 là độ chính xác (càng thấp càng khắt khe)
          const match = faceMatcher.findBestMatch(data.descriptor);
          if (match.label !== "unknown") {
            personName = "MY MASTER"; // Hoặc tên của bạn
            matchDistance = match.distance;
          }
        }
        // ------------------------------------

        // Ép kiểu cho expressions để TS hiểu nó là một object chứa số
        const expressions = data.expressions as Record<string, number>;

        const sorted = Object.entries(expressions)
          .filter(([_, val]) => (val as number) > 0.05) // Ép kiểu val thành number
          .sort((a, b) => (b[1] as number) - (a[1] as number)); // Ép kiểu khi sort

        const dominantExpression = sorted.length > 0 ? sorted[0][0] : "neutral";

        setDetectionData({
          age: Math.round(data.age),
          gender: data.gender,
          expression: dominantExpression,
          name: personName,
          distance: matchDistance,
        });
      } else {
        setDetectionData(null);
      }
      requestAnimationFrame(detect);
    };
    detect();
  };

  const saveMyFace = async () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      localStorage.setItem(
        "userFaceDescriptor",
        JSON.stringify(Array.from(detection.descriptor))
      );
      setSavedFaceDescriptor(detection.descriptor);
      setIsFaceSaved(true);
      alert("Saved! Please blink to verify.");
      handleRescan();
    } else {
      alert("No face detected.");
      videoRef.current.play();
    }
  };

  const deleteFace = () => {
    localStorage.removeItem("userFaceDescriptor");
    setSavedFaceDescriptor(null);
    setIsFaceSaved(false);
    handleRescan();
  };

  return (
    <div className="h-full flex flex-col p-6 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a16] to-black select-none font-sans">
      {/* CSS GIỮ NGUYÊN */}
      <style>{`
        @keyframes scan-down { 0% { top: -5%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { top: 105%; opacity: 0; } }
        @keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .scanlines::before { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); z-index: 10; background-size: 100% 2px, 3px 100%; pointer-events: none; }
        .vignette { box-shadow: inset 0 0 150px rgba(0,0,0,0.8); }
        .tech-border-corner { position: absolute; width: 20px; height: 20px; border-color: rgba(6, 182, 212, 0.5); z-index: 20; }
        .tl { top: 10px; left: 10px; border-top: 2px solid; border-left: 2px solid; }
        .tr { top: 10px; right: 10px; border-top: 2px solid; border-right: 2px solid; }
        .bl { bottom: 10px; left: 10px; border-bottom: 2px solid; border-left: 2px solid; }
        .br { bottom: 10px; right: 10px; border-bottom: 2px solid; border-right: 2px solid; }
        /* 👇 QUAN TRỌNG: Class này giúp lật ngược cả khung hình chứa video lẫn canvas */
        .mirror-mode { transform: scaleX(-1); }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 z-20">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl backdrop-blur-md border ${
              error
                ? "bg-red-500/20 border-red-500/50"
                : "bg-cyan-500/20 border-cyan-500/50"
            } shadow-[0_0_15px_rgba(6,182,212,0.3)]`}
          >
            <Scan
              className={error ? "text-red-400" : "text-cyan-400"}
              size={20}
            />
          </div>
          <div>
            <h2 className="text-white font-bold text-base tracking-wider flex items-center gap-2">
              BIOMETRIC SCAN{" "}
              <Cpu size={14} className="text-cyan-500 animate-pulse" />
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex h-2.5 w-2.5">
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isInitializing
                      ? "bg-yellow-500"
                      : error
                      ? "bg-red-600"
                      : "bg-emerald-500"
                  } animate-pulse`}
                ></span>
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-widest ${
                  error ? "text-red-400" : "text-cyan-300/80"
                }`}
              >
                {isInitializing
                  ? "INITIALIZING..."
                  : error
                  ? "OFFLINE"
                  : "SYSTEM ONLINE"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-white/80 font-mono text-sm tracking-widest">
            {systemTime}
          </div>
          {/* Nút lưu khuôn mặt */}
          {!isInitializing && !error && (
            <div className="flex gap-2">
              {!isFaceSaved ? (
                <button
                  onClick={saveMyFace}
                  className="flex items-center gap-2 px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-300 text-xs font-bold rounded hover:scale-105 transition-all"
                >
                  <Save size={14} /> SAVE MY FACE
                </button>
              ) : (
                <button
                  onClick={deleteFace}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 text-xs font-bold rounded hover:scale-105 transition-all"
                >
                  <Trash2 size={14} /> FORGET ME
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden bg-black group rounded-sm ring-1 ring-cyan-900/30 vignette flex justify-center items-center">
        {/* Tech corners */}
        <div className="tech-border-corner tl"></div>
        <div className="tech-border-corner tr"></div>
        <div className="tech-border-corner bl"></div>
        <div className="tech-border-corner br"></div>

        <div className="absolute inset-0 scanlines z-10 pointer-events-none"></div>

        {error ? (
          <div className="text-red-500 flex flex-col items-center gap-3 z-30">
            <AlertTriangle size={48} className="animate-pulse" />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        ) : (
          /* 👇 CONTAINER CHUNG CHO VIDEO VÀ CANVAS ĐỂ FLIP CÙNG LÚC */
          <div className="relative w-full h-full mirror-mode">
            <video
              ref={videoRef}
              autoPlay
              muted
              onPlay={handleVideoPlay}
              className="absolute w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full object-cover z-20 "
            />
          </div>
        )}

        {/* Scan Effect */}
        {!detectionData && !isInitializing && !error && (
          <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
            <div className="w-full h-2 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent animate-[scan-down_2.5s_linear_infinite] blur-[2px] shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
          </div>
        )}

        {/* Info Card HUD */}
        {detectionData && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-6 fade-in duration-300 w-auto min-w-[300px]">
            <div
              className={`backdrop-blur-xl border p-4 rounded-2xl flex items-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden ${
                detectionData.name === "MY MASTER"
                  ? "bg-emerald-900/40 border-emerald-500/50"
                  : "bg-slate-900/60 border-cyan-500/30"
              }`}
            >
              {/* Avatar / Icon */}
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ring-1 ${
                    detectionData.name === "MY MASTER"
                      ? "bg-emerald-500/20 ring-emerald-400 text-emerald-300"
                      : "bg-cyan-500/20 ring-cyan-400 text-cyan-300"
                  }`}
                >
                  {detectionData.name === "MY MASTER" ? (
                    <CheckCircle size={25} />
                  ) : (
                    <User size={25} />
                  )}
                </div>
              </div>

              {/* Data */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Activity
                    size={12}
                    className={`${
                      detectionData.name === "MY MASTER"
                        ? "text-emerald-400"
                        : "text-cyan-400"
                    } animate-pulse`}
                  />
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                      detectionData.name === "MY MASTER"
                        ? "text-emerald-400"
                        : "text-cyan-400"
                    }`}
                  >
                    SUBJECT:{" "}
                    {detectionData.name === "MY MASTER"
                      ? "VERIFIED"
                      : "DETECTED"}
                  </div>
                </div>

                <div className="text-white font-mono text-lg font-bold tracking-tight mb-1">
                  {detectionData.name || "UNKNOWN"}
                </div>

                <div className="text-slate-400 font-mono text-[11px] flex gap-3">
                  <span>{detectionData.gender?.toUpperCase()}</span>
                  <span>•</span>
                  <span>{detectionData.age} YRS</span>
                  <span>•</span>
                  <span className="capitalize text-white">
                    {detectionData.expression}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
