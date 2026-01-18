import { useEffect, useRef } from "react";
import { useScreenShareStore } from "../../../../stores/useScreenShareStore";
import { useToastStore } from "../../../../stores/useToastStore";

export const ScreenShareEngine = () => {
  const { showToast } = useToastStore();
  const store = useScreenShareStore();

  // Refs xử lý ngầm (Mixer)
  const screenVideoRef = useRef<HTMLVideoElement>(
    document.createElement("video")
  );
  const camVideoRef = useRef<HTMLVideoElement>(document.createElement("video"));
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamsRef = useRef<{
    screen: MediaStream | null;
    user: MediaStream | null;
  }>({ screen: null, user: null });

  // --- HÀM START ---
  const startStudio = async () => {
    try {
      // 1. Lấy Màn hình
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: true,
      });

      // 2. Lấy Webcam (Nếu mode stream)
      let userStream: MediaStream | null = null;
      if (store.mode === "stream") {
        try {
          userStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" },
            audio: true,
          });
        } catch {
          showToast("Mic/Cam not accessible", "warning");
        }
      }

      streamsRef.current = { screen: displayStream, user: userStream };

      // 3. Setup các video ẩn để lấy dữ liệu vẽ lên Canvas Mixer
      screenVideoRef.current.srcObject = displayStream;
      screenVideoRef.current.muted = true;
      screenVideoRef.current.play();

      if (userStream) {
        camVideoRef.current.srcObject = userStream;
        camVideoRef.current.muted = true;
        camVideoRef.current.play();
      }

      // 4. Kích hoạt Mixer chạy ngầm
      setupBackgroundMixer(displayStream, userStream);

      // 5. Cập nhật Store (Quan trọng: UI sẽ lấy stream từ đây để hiển thị)
      store.setStream(displayStream);
      store.setLive(true);
      store.setVideoUrl(null);

      // Auto Stop khi user tắt share từ browser
      displayStream.getVideoTracks()[0].onended = () => stopStudio();

      showToast("Studio active (Background Mode)", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // --- HÀM STOP (CLEANUP TRIỆT ĐỂ) ---
  const stopStudio = () => {
    // 1. Dừng ghi hình
    if (
      store.isRecording &&
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // 2. Dừng vòng lặp vẽ Canvas
    cancelAnimationFrame(animationFrameRef.current);

    // 3. QUAN TRỌNG: Dừng tất cả các luồng (Screen + Cam) trong Engine
    if (streamsRef.current.screen) {
      streamsRef.current.screen.getTracks().forEach((t) => t.stop());
    }
    if (streamsRef.current.user) {
      streamsRef.current.user.getTracks().forEach((t) => t.stop());
    }

    // 4. Dừng Audio Context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }

    // 5. Reset Refs
    screenVideoRef.current.srcObject = null;
    camVideoRef.current.srcObject = null;
    streamsRef.current = { screen: null, user: null }; // Xóa tham chiếu

    // 6. Cập nhật Store
    store.setStream(null);
    store.setLive(false);
    store.setRecording(false);
  };

  // --- MIXER LOGIC (Giữ nguyên logic cũ nhưng chạy trong component này) ---
  const setupBackgroundMixer = (
    screenStream: MediaStream,
    userStream: MediaStream | null
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    if (screenStream.getAudioTracks().length > 0)
      audioContext.createMediaStreamSource(screenStream).connect(destination);
    if (userStream && userStream.getAudioTracks().length > 0)
      audioContext.createMediaStreamSource(userStream).connect(destination);
    audioContextRef.current = audioContext;

    const drawLoop = () => {
      if (!ctx) return;
      if (canvas.width !== screenVideoRef.current.videoWidth) {
        canvas.width = screenVideoRef.current.videoWidth;
        canvas.height = screenVideoRef.current.videoHeight;
      }
      ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);

      // Vẽ webcam lên canvas (Chỉ phục vụ ghi hình)
      if (store.mode === "stream" && userStream) {
        const camW = canvas.width * 0.2;
        const camH = (camW * 3) / 4;
        // Mặc định ghi hình góc phải dưới
        ctx.drawImage(
          camVideoRef.current,
          canvas.width - camW - 20,
          canvas.height - camH - 20,
          camW,
          camH
        );
      }
      animationFrameRef.current = requestAnimationFrame(drawLoop);
    };
    drawLoop();

    const mixedStream = canvas.captureStream(30);
    if (destination.stream.getAudioTracks().length > 0)
      mixedStream.addTrack(destination.stream.getAudioTracks()[0]);
    setupMediaRecorder(mixedStream);
  };

  const setupMediaRecorder = (stream: MediaStream) => {
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
      ? "video/webm; codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 3000000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      store.setVideoUrl(URL.createObjectURL(blob));
      showToast("Recording saved", "success");
      // Lưu ý: Không gọi stopStudio ở đây để tránh tắt Live khi chỉ dừng Record
    };
    mediaRecorderRef.current = recorder;
  };

  const toggleRecord = () => {
    if (!store.isRecording) {
      mediaRecorderRef.current?.start();
      store.setRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      store.setRecording(false);
    }
  };

  const toggleMic = () => {
    const audioTrack = streamsRef.current.user?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !store.micEnabled;
      store.setMicEnabled(!store.micEnabled);
    }
  };

  // Đăng ký hàm vào Store để UI gọi được
  useEffect(() => {
    store.registerActions({ startStudio, stopStudio, toggleRecord, toggleMic });
    // Cleanup khi App tắt hẳn (F5 hoặc đóng tab)
    return () => stopStudio();
  }, [store.mode, store.isRecording, store.micEnabled]); // Re-register khi state thay đổi để closure cập nhật

  return null; // Component này không render gì cả
};
