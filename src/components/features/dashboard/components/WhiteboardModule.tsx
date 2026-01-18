import { useEffect, useRef, useState, useCallback } from "react";
import {
  PenTool,
  Eraser,
  Trash2,
  Download,
  Undo,
  Redo,
  Maximize2,
  Move,
  Type,
  Image as ImageIcon,
  X,
  HelpCircle,
  Sun,
  Moon,
  Keyboard,
  FileJson,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Settings,
  Save,
  AlertTriangle,
  Layers,
  Plus,
  Eye,
  EyeOff,
  Wand2,
} from "lucide-react";
import { useToastStore } from "../../../../stores/useToastStore";

// --- TYPES ---
interface Point {
  x: number;
  y: number;
}
type ElementType = "stroke" | "text";
interface BaseElement {
  id: string;
  type: ElementType;
  color: string;
}

interface StrokeElement extends BaseElement {
  type: "stroke";
  points: Point[];
  width: number;
  tool: "pen" | "eraser";
}

interface TextElement extends BaseElement {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

type WhiteboardElement = StrokeElement | TextElement;

interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  elements: WhiteboardElement[];
}

interface Camera {
  x: number;
  y: number;
  z: number;
}

const DEFAULT_PRESETS = [
  "#ffffff",
  "#00e5ff",
  "#00ff9f",
  "#ffff00",
  "#ff0055",
  "#bd00ff",
  "#ff9900",
  "#3b82f6",
];

const STORAGE_KEY_DATA = "wb_autosave_data_v2";
const STORAGE_KEY_CONFIG = "wb_user_config";

export const WhiteboardModule = () => {
  const { showToast } = useToastStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editingColorIndex = useRef<number | null>(null);

  // --- STATES ---

  // 1. Layers State
  const [layers, setLayers] = useState<Layer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.layers) return parsed.layers;
      if (parsed.elements && Array.isArray(parsed.elements)) {
        return [
          {
            id: "layer-1",
            name: "Layer 1",
            isVisible: true,
            elements: parsed.elements,
          },
        ];
      }
    }
    return [{ id: "layer-1", name: "Layer 1", isVisible: true, elements: [] }];
  });

  const [activeLayerId, setActiveLayerId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved ? JSON.parse(saved).activeLayerId || "layer-1" : "layer-1";
  });

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [camera, setCamera] = useState<Camera>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved
      ? JSON.parse(saved).camera || { x: 0, y: 0, z: 1 }
      : { x: 0, y: 0, z: 1 };
  });

  const [bgMode, setBgMode] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved ? JSON.parse(saved).bgMode || "dark" : "dark";
  });

  const [history, setHistory] = useState<Layer[][]>([]);
  const [redoStack, setRedoStack] = useState<Layer[][]>([]);

  const [currentStroke, setCurrentStroke] = useState<StrokeElement | null>(
    null
  );

  // Laser States
  const [laserPoints, setLaserPoints] = useState<
    { x: number; y: number; time: number }[]
  >([]);
  // 👇 State mới: Vị trí con trỏ chuột (để vẽ đầu laser)
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point | null>(null);

  const [tool, setTool] = useState<"pen" | "eraser" | "laser">("pen");
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [isDockVisible, setIsDockVisible] = useState(true);
  const [isLayerPanelVisible, setIsLayerPanelVisible] = useState(false);

  const [presetColors, setPresetColors] = useState<string[]>(() => {
    const saved = localStorage.getItem("wb_preset_colors");
    return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
  });
  const [color, setColor] = useState<string>(presetColors[1]);

  const [userConfig, setUserConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved
      ? JSON.parse(saved)
      : { savePath: "Downloads", defaultFormat: "png" };
  });

  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    name: "cyber-sketch",
    format: "png",
  });
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // --- AUTO-SAVE ---
  useEffect(() => {
    const dataToSave = { layers, activeLayerId, camera, bgMode };
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(dataToSave));
  }, [layers, activeLayerId, camera, bgMode]);

  // --- LASER DECAY ---
  useEffect(() => {
    let animationFrameId: number;
    const decayLaser = () => {
      if (laserPoints.length > 0) {
        const now = Date.now();
        const remaining = laserPoints.filter((p) => now - p.time < 1000);
        if (remaining.length !== laserPoints.length) {
          setLaserPoints(remaining);
        }
      }
      animationFrameId = requestAnimationFrame(decayLaser);
    };
    decayLaser();
    return () => cancelAnimationFrame(animationFrameId);
  }, [laserPoints]);

  const pushToHistory = () => {
    setHistory((prev) => {
      const newHist = [...prev, layers];
      if (newHist.length > 20) return newHist.slice(newHist.length - 20);
      return newHist;
    });
    setRedoStack([]);
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setRedoStack((prev) => [...prev, layers]);
    setLayers(previousState);
    setHistory((prev) => prev.slice(0, -1));
  }, [history, layers]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, layers]);
    setLayers(nextState);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack, layers]);

  // --- LAYER ACTIONS ---
  const handleAddLayer = () => {
    pushToHistory();
    const newId = `layer-${Date.now()}`;
    setLayers((prev) => [
      ...prev,
      {
        id: newId,
        name: `Layer ${prev.length + 1}`,
        isVisible: true,
        elements: [],
      },
    ]);
    setActiveLayerId(newId);
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      showToast("Cannot delete the last layer", "error");
      return;
    }
    pushToHistory();
    const newLayers = layers.filter((l) => l.id !== id);
    setLayers(newLayers);
    if (activeLayerId === id) {
      setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
    showToast("Layer deleted", "info");
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isVisible: !l.isVisible } : l))
    );
  };

  const handleRenameLayer = (id: string) => {
    if (!editingName.trim()) {
      setEditingLayerId(null);
      return;
    }
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name: editingName } : l))
    );
    setEditingLayerId(null);
  };

  const handleClearBoard = useCallback(() => {
    pushToHistory();
    setLayers((prev) => prev.map((l) => ({ ...l, elements: [] })));
    setCamera({ x: 0, y: 0, z: 1 });
    showToast("All layers cleared", "info");
  }, [showToast]);

  // --- RENDERER ---
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bgColor = bgMode === "dark" ? "#0a0a0a" : "#f8fafc";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.z, camera.z);
    ctx.translate(-canvas.width / 2 + camera.x, -canvas.height / 2 + camera.y);

    const drawStroke = (stroke: StrokeElement, isLaser = false) => {
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.width;

      if (stroke.tool === "eraser") {
        ctx.strokeStyle = bgColor;
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = stroke.color;
        if (bgMode === "dark" && (camera.z > 0.5 || isLaser)) {
          ctx.shadowBlur = isLaser ? stroke.width * 2 : stroke.width;
          ctx.shadowColor = stroke.color;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }
      ctx.stroke();
    };

    const drawText = (textEl: TextElement) => {
      ctx.font = `bold ${textEl.fontSize}px monospace`;
      ctx.fillStyle = textEl.color;
      ctx.shadowBlur = bgMode === "dark" ? 5 : 0;
      ctx.shadowColor = textEl.color;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(textEl.text, textEl.x, textEl.y);
    };

    // 1. Draw Layers
    layers.forEach((layer) => {
      if (!layer.isVisible) return;
      layer.elements.forEach((el) => {
        if (el.type === "stroke") drawStroke(el as StrokeElement);
        if (el.type === "text") drawText(el as TextElement);
      });
      if (activeLayerId === layer.id && currentStroke) {
        drawStroke(currentStroke);
      }
    });

    // 2. Draw Active Laser Path
    if (laserPoints.length > 1) {
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const gradient = ctx.createLinearGradient(
        laserPoints[0].x,
        laserPoints[0].y,
        laserPoints[laserPoints.length - 1].x,
        laserPoints[laserPoints.length - 1].y
      );
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(1, color);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      ctx.moveTo(laserPoints[0].x, laserPoints[0].y);
      for (let i = 1; i < laserPoints.length; i++) {
        ctx.lineTo(laserPoints[i].x, laserPoints[i].y);
      }
      ctx.stroke();
    }

    // 3. Draw Laser Cursor (Đốm sáng đầu bút)
    // Vẽ đốm sáng ở vị trí chuột hiện tại nếu tool là laser
    if (tool === "laser" && cursorPos) {
      ctx.beginPath();
      ctx.fillStyle = color;
      // Kích thước đốm sáng bằng kích thước bút
      // Chia cho camera.z để kích thước đốm sáng không bị phóng to theo zoom (giữ nguyên kích thước nhìn thấy)
      // Hoặc giữ nguyên để nó to theo zoom. Ở đây ta giữ nguyên kích thước logic.
      ctx.arc(cursorPos.x, cursorPos.y, lineWidth / 2, 0, Math.PI * 2);

      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.fill();

      // Tâm sáng màu trắng (cho chế độ Dark mode đẹp hơn)
      if (bgMode === "dark") {
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(cursorPos.x, cursorPos.y, lineWidth / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [
    layers,
    currentStroke,
    camera,
    bgMode,
    activeLayerId,
    laserPoints,
    color,
    lineWidth,
    tool,
    cursorPos,
  ]);

  useEffect(() => {
    requestAnimationFrame(renderCanvas);
  }, [renderCanvas]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        renderCanvas();
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [renderCanvas]);

  // --- INTERACTION ---
  const getMouseWorldPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // @ts-ignore
      clientX = e.clientX;
      // @ts-ignore
      clientY = e.clientY;
    }
    return {
      x:
        (clientX - rect.left - canvas.width / 2) / camera.z +
        canvas.width / 2 -
        camera.x,
      y:
        (clientY - rect.top - canvas.height / 2) / camera.z +
        canvas.height / 2 -
        camera.y,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ("button" in e && e.button === 2) {
      setIsPanning(true);
      // @ts-ignore
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    const pos = getMouseWorldPos(e);

    if (tool === "laser") {
      setLaserPoints([{ x: pos.x, y: pos.y, time: Date.now() }]);
      setCursorPos(pos); // Cập nhật vị trí đốm sáng
    } else {
      setCurrentStroke({
        id: Date.now().toString(),
        type: "stroke",
        points: [pos],
        color: color,
        width: lineWidth / camera.z,
        tool: tool,
      });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPanning) {
      let clientX, clientY;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // @ts-ignore
        clientX = e.clientX;
        // @ts-ignore
        clientY = e.clientY;
      }
      if (lastMousePos) {
        const dx = (clientX - lastMousePos.x) / camera.z;
        const dy = (clientY - lastMousePos.y) / camera.z;
        setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: clientX, y: clientY });
      }
      return;
    }

    const pos = getMouseWorldPos(e);

    if (tool === "laser") {
      // Cập nhật vị trí đốm sáng
      setCursorPos(pos);
      // Nếu đang vẽ (laserPoints có điểm đầu), thêm điểm
      if (laserPoints.length > 0) {
        setLaserPoints((prev) => [
          ...prev,
          { x: pos.x, y: pos.y, time: Date.now() },
        ]);
      }
    } else if (currentStroke) {
      setCurrentStroke((prev) =>
        prev ? { ...prev, points: [...prev.points, pos] } : null
      );
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setLastMousePos(null);
    }

    if (tool === "laser") {
      // Không xóa laserPoints ngay, để nó fade out tự nhiên
      // Chỉ cần ngừng nhận diện "đang vẽ" (ở đây laser vẽ liên tục khi giữ chuột)
      // Khi thả chuột, ta clear mảng laserPoints để ngừng nối nét tiếp theo vào nét cũ
      // Nhưng logic render đang dựa vào mảng này.
      // Để fade out mượt, ta giữ nguyên logic useEffect decay.
      // Ta chỉ cần ngắt quãng nét vẽ bằng cách clear mảng hoặc tạo mảng mới?
      // Logic decay hiện tại sẽ xóa điểm cũ đi.
      // Đơn giản nhất: Clear mảng để nét đứt đoạn nếu vẽ tiếp.
      setLaserPoints([]);

      // Vẫn giữ cursorPos để hiển thị đốm sáng nếu chuột vẫn ở trong canvas
      // (PointerMove sẽ cập nhật lại)
    } else if (currentStroke) {
      pushToHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, elements: [...l.elements, currentStroke] }
            : l
        )
      );
      setCurrentStroke(null);
    }
  };

  // 👇 Xử lý khi chuột rời khỏi bảng vẽ
  const handlePointerLeave = () => {
    handlePointerUp();
    setCursorPos(null); // Ẩn đốm sáng
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      setLineWidth((prev) => Math.max(1, Math.min(50, prev + delta)));
    } else {
      const scaleAmount = -e.deltaY * 0.001;
      const newZoom = Math.max(0.1, Math.min(camera.z * (1 + scaleAmount), 5));
      setCamera((prev) => ({ ...prev, z: newZoom }));
    }
  };

  const handleAddText = () => {
    if (!textInput.trim()) {
      setShowTextDialog(false);
      return;
    }
    pushToHistory();
    const newText: TextElement = {
      id: Date.now().toString(),
      type: "text",
      x: -camera.x,
      y: -camera.y,
      text: textInput,
      color: color,
      fontSize: lineWidth * 5,
    };
    setLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayerId
          ? { ...l, elements: [...l.elements, newText] }
          : l
      )
    );
    setTextInput("");
    setShowTextDialog(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(userConfig));
    setShowSettings(false);
    setExportConfig((prev) => ({ ...prev, format: userConfig.defaultFormat }));
    showToast("Settings saved!", "success");
  };

  const handleColorClick = (c: string) => {
    setColor(c);
    if (tool === "eraser") setTool("pen");
  };
  const handleColorRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    editingColorIndex.current = index;
    colorPickerRef.current?.click();
  };
  const handleColorChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingColorIndex.current !== null) {
      const newColor = e.target.value;
      const newPresets = [...presetColors];
      newPresets[editingColorIndex.current] = newColor;
      setPresetColors(newPresets);
      setColor(newColor);
      localStorage.setItem("wb_preset_colors", JSON.stringify(newPresets));
    }
  };

  const saveFileToDisk = async (blob: Blob, filename: string) => {
    try {
      const win = window as any;
      if (win.showSaveFilePicker) {
        const handle = await win.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "Whiteboard File",
              accept: { [blob.type]: [`.${filename.split(".").pop()}`] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast("File saved successfully!", "success");
        return;
      }
      throw new Error("Fallback");
    } catch (err) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Download started", "success");
    }
  };

  const handleSaveProject = async () => {
    const data = {
      version: 2,
      timestamp: Date.now(),
      layers,
      activeLayerId,
      camera,
      bgMode,
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const filename = `${exportConfig.name || "project"}.board`;
    await saveFileToDisk(blob, filename);
    setShowExport(false);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);

        if (data.version === 2 || data.layers) {
          setLayers(data.layers);
          if (data.activeLayerId) setActiveLayerId(data.activeLayerId);
        } else if (data.elements) {
          setLayers([
            {
              id: "layer-1",
              name: "Layer 1",
              isVisible: true,
              elements: data.elements,
            },
          ]);
          setActiveLayerId("layer-1");
        }

        if (data.camera) setCamera(data.camera);
        if (data.bgMode) setBgMode(data.bgMode);
        setRedoStack([]);
        setShowExport(false);
        showToast("Project loaded!", "success");
      } catch (err) {
        showToast("Invalid project file!", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const executeExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const filename = `${exportConfig.name || "sketch"}.${
          exportConfig.format
        }`;
        await saveFileToDisk(blob, filename);
        setShowExport(false);
      },
      `image/${exportConfig.format}`,
      1.0
    );
  };

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "8" && !e.ctrlKey && !e.shiftKey) {
        const index = parseInt(e.key) - 1;
        setColor(presetColors[index]);
        if (tool === "eraser") setTool("pen");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowDown") {
        e.preventDefault();
        setIsDockVisible(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowUp") {
        e.preventDefault();
        setIsDockVisible(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handleClearBoard();
      }
      if (e.shiftKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        setShowExport(true);
      }
      if (e.shiftKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        setTool("pen");
      }
      if (e.shiftKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        setTool("eraser");
      }
      if (e.shiftKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        setTool("laser");
      }
      if (e.shiftKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setShowTextDialog(true);
      }
      if (e.key === "F1" || (e.shiftKey && e.key === "?")) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, presetColors, handleClearBoard, tool]);

  return (
    <div
      className={`h-full flex flex-col relative select-none overflow-hidden group font-sans transition-colors duration-300 ${
        bgMode === "dark"
          ? "bg-[#0a0a0a] text-white"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      <input
        ref={colorPickerRef}
        type="color"
        className="hidden"
        onChange={handleColorChangeInput}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".board,.json"
        className="hidden"
        onChange={handleLoadProject}
      />

      {/* --- LAYER PANEL (LEFT SIDE) --- */}
      <div
        className={`absolute top-4 left-4 z-30 transition-all duration-300 ease-in-out ${
          isLayerPanelVisible
            ? "translate-x-0 opacity-100"
            : "-translate-x-[120%] opacity-0"
        }`}
      >
        <div
          className={`w-64 backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden flex flex-col ${
            bgMode === "dark"
              ? "bg-black/80 border-white/10"
              : "bg-white/90 border-black/10"
          }`}
        >
          {/* HEADER */}
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLayerPanelVisible(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Close Layers"
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="text-sm font-bold flex items-center gap-2 select-none">
                <Layers size={16} /> Layers
              </h3>
            </div>
            <button
              onClick={handleAddLayer}
              className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors"
              title="Add New Layer"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* LIST */}
          <div className="flex-1 max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {[...layers].reverse().map((layer) => (
              <div
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm group/layer transition-all border ${
                  activeLayerId === layer.id
                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(79,70,229,0.1)]"
                    : "border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className={`transition-colors ${
                    layer.isVisible ? "text-indigo-400" : "text-slate-600"
                  }`}
                >
                  {layer.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                {editingLayerId === layer.id ? (
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-white text-xs px-1 py-0.5 rounded outline-none border border-indigo-500 min-w-0"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameLayer(layer.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRenameLayer(layer.id)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="flex-1 truncate font-medium select-none"
                    title="Double click to rename"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingLayerId(layer.id);
                      setEditingName(layer.name);
                    }}
                  >
                    {layer.name}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLayer(layer.id);
                  }}
                  className="opacity-0 group-hover/layer:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BUTTON OPEN LAYER */}
      <div
        className={`absolute top-4 left-4 z-20 transition-all duration-300 ${
          isLayerPanelVisible
            ? "opacity-0 -translate-x-full pointer-events-none"
            : "opacity-100 translate-x-0"
        }`}
      >
        <button
          onClick={() => setIsLayerPanelVisible(true)}
          className={`p-3 backdrop-blur-xl rounded-xl border shadow-lg group transition-all hover:scale-105 hover:pr-4 ${
            bgMode === "dark"
              ? "bg-black/50 border-white/10 text-slate-400 hover:text-white"
              : "bg-white/50 border-black/10 text-slate-500 hover:text-black"
          }`}
          title="Open Layers"
        >
          <div className="flex items-center gap-2">
            <Layers size={20} />
            <span className="w-0 overflow-hidden group-hover:w-auto text-xs font-bold whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100">
              Layers
            </span>
          </div>
        </button>
      </div>

      {/* TOP RIGHT */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={() =>
            setBgMode((prev) => (prev === "dark" ? "light" : "dark"))
          }
          className="p-2 bg-black/50 backdrop-blur rounded-full text-slate-400 hover:text-white border border-white/10"
          title="Toggle Theme"
        >
          {bgMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 bg-black/50 backdrop-blur rounded-full text-slate-400 hover:text-white border border-white/10"
          title="Settings"
        >
          <Settings size={20} />
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 bg-black/50 backdrop-blur rounded-full text-slate-400 hover:text-white border border-white/10"
          title="Shortcuts"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* CANVAS */}
      <div
        ref={containerRef}
        className={`flex-1 w-full h-full cursor-crosshair relative rounded-xl overflow-hidden ring-1 shadow-inner m-2 ${
          bgMode === "dark"
            ? "ring-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
            : "ring-black/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] bg-white"
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerLeave} // 👇 Sửa sự kiện MouseLeave
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={`touch-none w-full h-full block ${
            tool === "laser" ? "cursor-none" : ""
          }`}
        />
        {/* Info */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-slate-300 font-mono pointer-events-none border border-white/10 flex gap-4">
          <span>ZOOM: {Math.round(camera.z * 100)}%</span>
          <span className="text-indigo-400">
            LAYER: {layers.find((l) => l.id === activeLayerId)?.name}
          </span>
        </div>
      </div>

      {/* --- UNIFIED DOCK --- */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[95%] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          isDockVisible ? "translate-y-0" : "translate-y-[120%]"
        }`}
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <button
            onClick={() => setIsDockVisible(!isDockVisible)}
            className={`p-1 bg-black/50 backdrop-blur text-slate-400 rounded-t-lg border-t border-x border-white/10 hover:text-white transition-opacity ${
              isDockVisible ? "opacity-0 hover:opacity-100" : "opacity-100"
            }`}
          >
            {isDockVisible ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronUp size={20} />
            )}
          </button>
        </div>

        <div
          className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-3 backdrop-blur-xl rounded-2xl border shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${
            bgMode === "dark"
              ? "bg-black/70 border-white/20"
              : "bg-white/80 border-black/10"
          }`}
        >
          <div
            className={`flex gap-2 items-center ${
              bgMode === "dark" ? "bg-white/10" : "bg-black/10"
            } p-3 rounded-xl`}
          >
            {presetColors.map((c, idx) => (
              <button
                key={idx}
                title={`Right click to edit (Key: ${idx + 1})`}
                onClick={() => handleColorClick(c)}
                onContextMenu={(e) => handleColorRightClick(e, idx)}
                className={`w-5 h-5 rounded-full transition-all duration-300 relative flex items-center justify-center group/cbtn ${
                  color === c && tool !== "eraser"
                    ? `scale-110 ring-1 ${
                        bgMode === "dark" ? "ring-white" : "ring-black"
                      } ring-offset-1 ring-offset-transparent shadow-[0_0_15px_currentColor]`
                    : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: c, color: c }}
              >
                <span
                  className={`text-[10px] font-bold ${
                    bgMode === "dark"
                      ? "text-black mix-blend-screen"
                      : "text-white mix-blend-difference"
                  } opacity-0 group-hover/cbtn:opacity-100`}
                >
                  {idx + 1}
                </span>
                {color === c && tool === "pen" && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: c }}
                  ></div>
                )}
              </button>
            ))}
          </div>
          <div
            className={`h-8 w-[1px] hidden sm:block ${
              bgMode === "dark" ? "bg-white/10" : "bg-black/10"
            }`}
          ></div>
          <div
            className={`flex gap-1 p-1 rounded-xl ${
              bgMode === "dark" ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <ToolButton
              active={tool === "pen"}
              onClick={() => setTool("pen")}
              icon={<PenTool size={18} />}
              activeColor={color}
              label="Pen (Shift+G)"
              bgMode={bgMode}
            />
            <ToolButton
              active={tool === "eraser"}
              onClick={() => setTool("eraser")}
              icon={<Eraser size={18} />}
              activeColor={bgMode === "dark" ? "#ffffff" : "#000000"}
              label="Eraser (Shift+R)"
              bgMode={bgMode}
            />
            <ToolButton
              active={tool === "laser"}
              onClick={() => setTool("laser")}
              icon={<Wand2 size={18} />}
              activeColor={color}
              label="Laser (Shift+L)"
              bgMode={bgMode}
            />
            <ToolButton
              active={showTextDialog}
              onClick={() => setShowTextDialog(true)}
              icon={<Type size={18} />}
              activeColor={color}
              label="Text (Shift+T)"
              bgMode={bgMode}
            />
            <ToolButton
              active={isPanning}
              onClick={() => setIsPanning(!isPanning)}
              icon={<Move size={18} />}
              activeColor={bgMode === "dark" ? "#ffffff" : "#000000"}
              label="Pan (Hold Right Click)"
              bgMode={bgMode}
            />
          </div>
          <div
            className={`h-8 w-[1px] hidden sm:block ${
              bgMode === "dark" ? "bg-white/10" : "bg-black/10"
            }`}
          ></div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
              bgMode === "dark" ? "bg-white/5" : "bg-black/5"
            }`}
          >
            <Maximize2
              size={16}
              className={
                bgMode === "dark" ? "text-slate-400" : "text-slate-500"
              }
            />
            <input
              type="range"
              min="1"
              max="50"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-20 sm:w-24 h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor:
                  tool === "pen"
                    ? color
                    : bgMode === "dark"
                    ? "white"
                    : "black",
                backgroundColor: bgMode === "dark" ? "#334155" : "#cbd5e1",
              }}
            />
          </div>
          <div
            className={`h-8 w-[1px] hidden sm:block ${
              bgMode === "dark" ? "bg-white/10" : "bg-black/10"
            }`}
          ></div>
          <div className="flex gap-2">
            <ActionButton
              onClick={handleUndo}
              icon={<Undo size={18} />}
              label="Undo"
              disabled={history.length === 0}
              bgMode={bgMode}
            />
            <ActionButton
              onClick={handleRedo}
              icon={<Redo size={18} />}
              label="Redo"
              disabled={redoStack.length === 0}
              bgMode={bgMode}
            />
            <ActionButton
              onClick={handleClearBoard}
              icon={<Trash2 size={18} />}
              label="Clear"
              danger
              bgMode={bgMode}
            />
            <ActionButton
              onClick={() => setShowExport(true)}
              icon={<Download size={18} />}
              label="Menu"
              success
              bgMode={bgMode}
            />
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          userConfig={userConfig}
          setUserConfig={setUserConfig}
          onSave={handleSaveSettings}
        />
      )}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          exportConfig={exportConfig}
          setExportConfig={setExportConfig}
          onExportImage={executeExportImage}
          onSaveProject={handleSaveProject}
          onLoadClick={() => fileInputRef.current?.click()}
        />
      )}
      {showTextDialog && (
        <TextDialog
          onClose={() => setShowTextDialog(false)}
          textInput={textInput}
          setTextInput={setTextInput}
          onAdd={handleAddText}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

// --- Sub-components ---
const ToolButton = ({
  active,
  onClick,
  icon,
  activeColor,
  label,
  bgMode,
}: any) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group/tbtn ${
      active
        ? bgMode === "dark"
          ? "text-white shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]"
          : "text-black shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]"
        : bgMode === "dark"
        ? "text-slate-400 hover:text-white hover:bg-white/10"
        : "text-slate-500 hover:text-black hover:bg-black/10"
    }`}
    style={
      active
        ? { backgroundColor: `${activeColor}20`, borderColor: activeColor }
        : {}
    }
  >
    {active && (
      <div
        className="absolute inset-0 opacity-30 blur-md"
        style={{ backgroundColor: activeColor }}
      ></div>
    )}
    <div className="relative z-10" style={active ? { color: activeColor } : {}}>
      {icon}
    </div>
  </button>
);

const ActionButton = ({
  onClick,
  icon,
  label,
  danger,
  success,
  disabled,
  bgMode,
}: any) => {
  let baseClass = `p-2.5 rounded-xl transition-all duration-300 relative group/btn ${
    bgMode === "dark"
      ? "text-slate-400 hover:bg-white/10 hover:text-white"
      : "text-slate-500 hover:bg-black/10 hover:text-black"
  }`;
  if (danger)
    baseClass = `p-2.5 rounded-xl transition-all duration-300 relative group/btn ${
      bgMode === "dark"
        ? "text-slate-400 hover:bg-red-500/20 hover:text-red-400"
        : "text-slate-500 hover:bg-red-500/20 hover:text-red-600"
    }`;
  if (success)
    baseClass = `p-2.5 rounded-xl transition-all duration-300 relative group/btn ${
      bgMode === "dark"
        ? "text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400"
        : "text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-600"
    }`;
  if (disabled)
    baseClass =
      "p-2.5 rounded-xl text-slate-600 cursor-not-allowed opacity-50 relative group/btn";
  return (
    <button onClick={onClick} disabled={disabled} className={baseClass}>
      {icon}
      {!disabled && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold bg-black/80 text-white rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </span>
      )}
    </button>
  );
};

const SettingsModal = ({ onClose, userConfig, setUserConfig, onSave }: any) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-96 text-white relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white"
      >
        <X size={20} />
      </button>
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Settings size={20} className="text-orange-400" /> Settings
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">
            Default Export Path
          </label>
          <input
            type="text"
            className="w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none"
            placeholder="Enter path"
            value={userConfig.savePath}
            onChange={(e) =>
              setUserConfig({ ...userConfig, savePath: e.target.value })
            }
          />
          <p className="text-[10px] text-yellow-500/80 mt-1 italic flex items-center gap-1">
            <AlertTriangle size={10} /> Browser restriction apply.
          </p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">
            Default Format
          </label>
          <div className="flex gap-2">
            {["png", "jpeg", "webp"].map((fmt) => (
              <button
                key={fmt}
                onClick={() =>
                  setUserConfig({ ...userConfig, defaultFormat: fmt })
                }
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase border ${
                  userConfig.defaultFormat === fmt
                    ? "bg-orange-600 border-orange-500 text-white"
                    : "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onSave}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 mt-4"
        >
          <Save size={18} /> Save Settings
        </button>
      </div>
    </div>
  </div>
);

const ExportModal = ({
  onClose,
  exportConfig,
  setExportConfig,
  onExportImage,
  onSaveProject,
  onLoadClick,
}: any) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-80 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <ImageIcon size={20} className="text-emerald-400" /> Export
        </h3>
        <button onClick={onClose}>
          <X size={20} className="text-slate-400 hover:text-white" />
        </button>
      </div>
      <div className="mb-6">
        <h4 className="text-xs text-indigo-400 font-bold uppercase mb-2">
          Project Data
        </h4>
        <div className="flex gap-2">
          <button
            onClick={onSaveProject}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center gap-2 text-sm text-slate-300"
          >
            <FileJson size={16} /> Save
          </button>
          <button
            onClick={onLoadClick}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center gap-2 text-sm text-slate-300"
          >
            <FolderOpen size={16} /> Load
          </button>
        </div>
      </div>
      <h4 className="text-xs text-emerald-400 font-bold uppercase mb-2">
        Export Image
      </h4>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">
            Filename
          </label>
          <input
            type="text"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            value={exportConfig.name}
            onChange={(e) =>
              setExportConfig({ ...exportConfig, name: e.target.value })
            }
          />
        </div>
        <div className="flex gap-2">
          {["png", "jpeg", "webp"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportConfig({ ...exportConfig, format: fmt })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${
                exportConfig.format === fmt
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
        <button
          onClick={onExportImage}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2"
        >
          <Download size={18} /> Download Image
        </button>
      </div>
    </div>
  </div>
);

const TextDialog = ({ onClose, textInput, setTextInput, onAdd }: any) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl w-80">
      <h3 className="font-bold text-sm mb-3 text-indigo-400 flex items-center gap-2">
        <Type size={16} /> Insert Text
      </h3>
      <input
        autoFocus
        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-indigo-500 mb-3"
        placeholder="Type something..."
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
      />
      <div className="flex gap-2">
        <button
          onClick={onAdd}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded text-xs font-bold text-white"
        >
          Add
        </button>
        <button
          onClick={onClose}
          className="px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

const HelpModal = ({ onClose }: any) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-96 text-white relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white"
      >
        <X size={20} />
      </button>
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Keyboard size={20} className="text-indigo-400" /> Shortcuts
      </h3>
      <div className="space-y-1.5 text-sm text-slate-300">
        <div className="flex justify-between border-b border-white/10 pb-1">
          <span>Show/Hide Dock</span>{" "}
          <span className="font-mono text-indigo-300">Ctrl + ↑ / ↓</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-1">
          <span>Undo / Redo</span>{" "}
          <span className="font-mono text-indigo-300">Ctrl + Z / Y</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-1">
          <span>Laser Tool</span>{" "}
          <span className="font-mono text-indigo-300">Shift + L</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-1">
          <span>Pan Canvas</span>{" "}
          <span className="font-mono text-indigo-300">Hold Right Click</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-1">
          <span>Brush Size</span>{" "}
          <span className="font-mono text-indigo-300">Ctrl + Scroll</span>
        </div>
      </div>
    </div>
  </div>
);
