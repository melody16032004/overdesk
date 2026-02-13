import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react"; // 👈 Import thư viện QR
import { fetch } from "@tauri-apps/plugin-http";
import {
  Camera,
  Timer,
  Smartphone,
  X,
  Loader2,
  Copy,
  Trash2,
} from "lucide-react";
import { CLOUD_NAME, FILTERS, UPLOAD_PRESET } from "./constants/camera_const";
import { formatTime } from "./helpers/camera_helper";
import { ErrorState } from "./components/ErrorState";
import { Control } from "./components/Control";
import { Viewport } from "./components/Viewport";

export const CameraModule = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- STATE CHUNG ---
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"photo" | "video">("photo");

  // --- STATE PHOTO ---
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);

  // --- STATE VIDEO ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // --- STATE SHARE MOBILE (MỚI) ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [deleteToken, setDeleteToken] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 👇 ĐIỀN THÔNG TIN CỦA BẠN VÀO ĐÂY

  // --- 1. QUẢN LÝ CAMERA ---
  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.enabled = false;
        track.stop();
      });
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: 1.777,
        },
        audio: mode === "video",
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setError(null);
      if (videoRef.current) videoRef.current.srcObject = newStream;
    } catch (err: any) {
      setError("Cannot access Camera/Microphone.");
      console.error(err);
    }
  };

  useEffect(() => {
    if (!capturedImage && !recordedVideoUrl) {
      startCamera();
    }
    return () => stopCamera();
  }, [capturedImage, recordedVideoUrl, mode]);

  // --- 2. LOGIC PHOTO & VIDEO ---
  const triggerPhoto = () => {
    if (isTimerEnabled) setCountdown(3);
    else captureNow();
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      captureNow();
      setCountdown(null);
    }
  }, [countdown]);

  const captureNow = () => {
    if (videoRef.current && canvasRef.current) {
      const audio = new AudioContext();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.1);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.filter = FILTERS[activeFilter].css;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        if (zoom > 1) {
          const w = canvas.width / zoom;
          const h = canvas.height / zoom;
          ctx.drawImage(
            video,
            (canvas.width - w) / 2,
            (canvas.height - h) / 2,
            w,
            h,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        setCapturedImage(canvas.toDataURL("image/png", 1.0));
        stopCamera();
      }
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp9",
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedVideoUrl(URL.createObjectURL(blob));
      stopCamera();
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const downloadMedia = () => {
    const link = document.createElement("a");
    const date = Date.now();
    if (mode === "photo" && capturedImage) {
      link.href = capturedImage;
      link.download = `photo-${date}.png`;
    } else if (mode === "video" && recordedVideoUrl) {
      link.href = recordedVideoUrl;
      link.download = `video-${date}.webm`;
    }
    link.click();
  };

  const cleanupCloudinary = async () => {
    if (!deleteToken) return;

    setIsDeleting(true);
    console.log("Deleting file from Cloudinary...");

    try {
      const formData = new FormData();
      formData.append("token", deleteToken); // Token lấy được lúc upload

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();
      console.log("Delete Result:", result);

      // Reset token sau khi xóa xong
      setDeleteToken(null);
    } catch (e) {
      console.error("Failed to delete file:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    // 1. Tắt modal ngay cho mượt
    setShowShareModal(false);
    // 2. Gọi hàm xóa ngầm bên dưới
    cleanupCloudinary();
  };

  const retake = () => {
    setCapturedImage(null);
    setRecordedVideoUrl(null);
    setShareUrl(null);
    // Nếu chưa đóng modal mà bấm retake thì cũng phải xóa file cũ đi
    if (deleteToken) cleanupCloudinary();
    setShowShareModal(false);
  };

  // --- 3. LOGIC SHARE TO MOBILE (MỚI) ---
  const handleShareToMobile = async () => {
    setShowShareModal(true);
    if (shareUrl) return;

    setIsUploading(true);
    try {
      let blob: Blob;
      if (mode === "photo" && capturedImage) {
        const res = await window.fetch(capturedImage);
        blob = await res.blob();
      } else if (mode === "video" && recordedVideoUrl) {
        const res = await window.fetch(recordedVideoUrl);
        blob = await res.blob();
      } else {
        throw new Error("No media to upload");
      }

      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const fileType = mode === "photo" ? "image/png" : "video/webm";
      const fileName = mode === "photo" ? "capture.png" : "video.webm";
      const file = new File([uint8Array], fileName, { type: fileType });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("tags", "overdesk_share");

      console.log("Uploading to Cloudinary...");
      const resourceType = mode === "photo" ? "image" : "video";
      const apiUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

      const response = await fetch(apiUrl, { method: "POST", body: formData });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloudinary Error: ${response.status} - ${errText}`);
      }

      const result = await response.json();
      console.log("Cloudinary Success:", result);

      // 👇 QUAN TRỌNG: LƯU LẠI DELETE TOKEN
      if (result.delete_token) {
        setDeleteToken(result.delete_token);
      } else {
        console.warn(
          "No delete_token returned. Did you enable it in Cloudinary Settings?",
        );
      }

      if (result.secure_url) {
        let finalUrl = result.secure_url;
        if (mode === "video") {
          finalUrl = finalUrl.replace(".webm", ".mp4");
          const uploadIndex = finalUrl.indexOf("/upload/");
          if (uploadIndex !== -1) {
            finalUrl =
              finalUrl.slice(0, uploadIndex + 8) +
              "vc_h264/" +
              finalUrl.slice(uploadIndex + 8);
          }
        }
        setShareUrl(finalUrl);
      } else {
        throw new Error("No URL returned");
      }
    } catch (err: any) {
      console.error("Upload Error:", err);
      setShareUrl(null);
      setError(`Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden relative select-none">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2 shrink-0 z-10">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Camera className="text-indigo-500" /> Pro Camera
        </h2>
        {!capturedImage && !recordedVideoUrl && !error && mode === "photo" && (
          <button
            onClick={() => setIsTimerEnabled(!isTimerEnabled)}
            className={`p-2 rounded-full transition-all ${
              isTimerEnabled
                ? "bg-indigo-500 text-white"
                : "bg-slate-100 dark:bg-white/10 text-slate-500"
            }`}
          >
            <Timer size={18} />
          </button>
        )}
      </div>

      {error ? (
        <ErrorState error={error} startCamera={startCamera} />
      ) : (
        <div className="flex-1 bg-black rounded-3xl overflow-hidden relative flex flex-col items-center justify-center shadow-2xl border-4 border-slate-100 dark:border-white/10 group">
          {/* COUNTDOWN & INDICATOR */}
          {countdown !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <span className="text-9xl font-bold text-white animate-ping">
                {countdown}
              </span>
            </div>
          )}
          {isRecording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-xs font-mono font-bold text-white">
                {formatTime(recordingTime)}
              </span>
            </div>
          )}

          {/* --- SHARE MODAL --- */}
          {showShareModal && (
            <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200 p-6 text-center">
              {/* 👇 NÚT ĐÓNG GỌI HÀM MỚI */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
              >
                <X size={20} />
              </button>

              <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center relative overflow-hidden">
                {/* Overlay khi đang xóa */}
                {isDeleting && (
                  <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center text-red-500">
                    <Trash2 className="animate-bounce mb-2" />
                    <span className="text-xs font-bold">
                      Cleaning up cloud storage...
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Smartphone className="text-indigo-500" /> Scan with Phone
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  File will be deleted when you close this
                </p>

                {isUploading ? (
                  <div className="h-48 flex flex-col items-center justify-center gap-4">
                    <Loader2
                      className="animate-spin text-indigo-500"
                      size={40}
                    />
                    <span className="text-xs font-bold text-slate-500">
                      Uploading to Cloud...
                    </span>
                  </div>
                ) : shareUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-2 border-2 border-indigo-100 rounded-xl">
                      <QRCodeSVG value={shareUrl} size={180} />
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-slate-100 text-[10px] p-2 rounded-lg text-slate-500 outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(shareUrl)}
                        className="p-2 bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-100"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-3 py-1 rounded-full">
                      Ready to scan!
                    </span>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm font-bold">
                    Upload Failed. Check internet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEWPORT */}
          <Viewport
            capturedImage={capturedImage}
            recordedVideoUrl={recordedVideoUrl}
            videoRef={videoRef}
            mode={mode}
            zoom={zoom}
            activeFilter={activeFilter}
            canvasRef={canvasRef}
          />

          {/* CONTROLS */}
          <Control
            capturedImage={capturedImage}
            recordedVideoUrl={recordedVideoUrl}
            retake={retake}
            handleShareToMobile={handleShareToMobile}
            downloadMedia={downloadMedia}
            isRecording={isRecording}
            zoom={zoom}
            setZoom={setZoom}
            mode={mode}
            setMode={setMode}
            setActiveFilter={setActiveFilter}
            activeFilter={activeFilter}
            triggerPhoto={triggerPhoto}
            stopRecording={stopRecording}
            startRecording={startRecording}
          />
        </div>
      )}
    </div>
  );
};
