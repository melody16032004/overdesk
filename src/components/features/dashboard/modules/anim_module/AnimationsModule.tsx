import React, { useState, useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import {
  Play,
  Pause,
  Upload,
  Trash2,
  Zap,
  Grid,
  Scissors,
  Video,
  Menu,
  X,
  MoreVertical,
  CheckSquare,
  Square,
  Edit,
  Crosshair,
  MousePointer2,
  PenTool,
  AlertTriangle,
} from "lucide-react";
import { AnimGroupData, AnimGroupRuntime } from "./types/anim_type";
import { dbHelper } from "./helper/anim_helper";
import { PixelDrawer } from "./components/PixelDrawer";

// --- MAIN WRAPPER (No changes to logic below) ---
export const FrameAnimationUltimate = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spritesMapRef = useRef<Map<string, PIXI.AnimatedSprite>>(new Map());

  const [animGroups, setAnimGroups] = useState<AnimGroupRuntime[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(12);
  const [scale, setScale] = useState(1);
  const [bgColor, setBgColor] = useState("#18181b");
  const [loop /*, setLoop*/] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [showSlicer, setShowSlicer] = useState(false);
  const [showPixelDrawer, setShowPixelDrawer] = useState(false);
  const [slicerImage, setSlicerImage] = useState<string | null>(null);
  const [sliceConfig, setSliceConfig] = useState({ rows: 1, cols: 6 });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [modalRename, setModalRename] = useState<{
    isOpen: boolean;
    id: string | null;
    name: string;
  }>({ isOpen: false, id: null, name: "" });
  const [modalDelete, setModalDelete] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    if (!document.getElementById("gifshot-script")) {
      const script = document.createElement("script");
      script.id = "gifshot-script";
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.3.2/gifshot.min.js";
      document.body.appendChild(script);
    }
    PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
    PIXI.settings.ROUND_PIXELS = true;

    if (!containerRef.current) return;
    const parent = containerRef.current;

    const app = new PIXI.Application({
      resizeTo: parent,
      backgroundAlpha: 0,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true, // Quan trọng cho High DPI
    });

    const canvas = app.view as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";

    parent.appendChild(canvas);
    appRef.current = app;

    const loadData = async () => {
      try {
        const storedData = await dbHelper.getAll();
        if (storedData && storedData.length > 0) {
          const loadedGroups: AnimGroupRuntime[] = storedData.map((d) => ({
            ...d,
            frames: d.imageBlobs.map((blob) =>
              PIXI.Texture.from(URL.createObjectURL(blob)),
            ),
          }));
          setAnimGroups(loadedGroups);
          if (loadedGroups.length > 0) {
            setActiveIds(new Set([loadedGroups[0].id]));
            setFocusedId(loadedGroups[0].id);
          }
        }
      } catch (e) {}
    };
    loadData();

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener("contextmenu", handleContextMenu);

    const resizeObserver = new ResizeObserver(() => {
      app.resize();
    });
    resizeObserver.observe(parent);

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkMobile);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);

  const saveGroupToDB = async (group: AnimGroupRuntime) => {
    const dataToSave: AnimGroupData = {
      id: group.id,
      name: group.name,
      imageBlobs: group.imageBlobs,
      sliceConfig: group.sliceConfig,
    };
    await dbHelper.save(dataToSave);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    if (files.length === 1 && files[0].type.startsWith("image/")) {
      const url = URL.createObjectURL(files[0]);
      setSlicerImage(url);
      setShowSlicer(true);
      setSliceConfig({ rows: 1, cols: 6 });
      return;
    }
    processMultipleFiles(files);
  };

  const processMultipleFiles = async (files: File[]) => {
    files.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
    const groups: Record<string, File[]> = {};
    files.forEach((f) => {
      const nameKey = f.name
        .replace(/[-_]?\d+\.(png|jpg|jpeg)$/i, "")
        .replace(/\.(png|jpg|jpeg)$/i, "");
      const key = nameKey || "Sequence";
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    const newGroupsPromise = Object.keys(groups).map(async (key) => {
      const groupFiles = groups[key];
      const textures = groupFiles.map((f) =>
        PIXI.Texture.from(URL.createObjectURL(f)),
      );
      const newGroup: AnimGroupRuntime = {
        id: key + "_" + Date.now(),
        name: key,
        frames: textures,
        imageBlobs: groupFiles,
      };
      await saveGroupToDB(newGroup);
      return newGroup;
    });
    const newGroups = await Promise.all(newGroupsPromise);
    setAnimGroups((prev) => [...prev, ...newGroups]);
    if (newGroups.length > 0) {
      setActiveIds((prev) => new Set(prev).add(newGroups[0].id));
      setFocusedId(newGroups[0].id);
    }
  };

  const handlePixelSave = async (blob: Blob) => {
    const texture = PIXI.Texture.from(URL.createObjectURL(blob));
    const newId = "Pixel_" + Date.now();
    const newGroup: AnimGroupRuntime = {
      id: newId,
      name: "Pixel Art",
      frames: [texture],
      imageBlobs: [blob],
    };
    await saveGroupToDB(newGroup);
    setAnimGroups((prev) => [...prev, newGroup]);
    setActiveIds((prev) => new Set(prev).add(newId));
    setFocusedId(newId);
    setShowPixelDrawer(false);
  };

  const handleSliceConfirm = async () => {
    if (!slicerImage || !appRef.current) return;
    const baseTexture = PIXI.BaseTexture.from(slicerImage);
    const tempImg = new Image();
    tempImg.src = slicerImage;
    tempImg.onload = async () => {
      const w = tempImg.width / sliceConfig.cols;
      const h = tempImg.height / sliceConfig.rows;
      const textures: PIXI.Texture[] = [];
      const blobs: Blob[] = [];
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext("2d");
      for (let r = 0; r < sliceConfig.rows; r++) {
        for (let c = 0; c < sliceConfig.cols; c++) {
          try {
            const rect = new PIXI.Rectangle(c * w, r * h, w, h);
            textures.push(new PIXI.Texture(baseTexture, rect));
          } catch (e) {}
          if (ctx) {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(tempImg, c * w, r * h, w, h, 0, 0, w, h);
            await new Promise<void>((resolve) =>
              tempCanvas.toBlob((b) => {
                if (b) blobs.push(b);
                resolve();
              }),
            );
          }
        }
      }
      if (editingGroupId) {
        const updatedGroup = animGroups.find((g) => g.id === editingGroupId);
        if (updatedGroup) {
          const newGroup = {
            ...updatedGroup,
            frames: textures,
            imageBlobs: blobs,
            sliceConfig,
          };
          await saveGroupToDB(newGroup);
          setAnimGroups((prev) =>
            prev.map((g) => (g.id === editingGroupId ? newGroup : g)),
          );
          const sprite = spritesMapRef.current.get(editingGroupId);
          if (sprite) {
            sprite.textures = textures;
            sprite.play();
          }
        }
      } else {
        const newId = "Sheet_" + Date.now();
        const newGroup: AnimGroupRuntime = {
          id: newId,
          name: "Sliced Sheet",
          frames: textures,
          imageBlobs: blobs,
          sliceConfig,
        };
        await saveGroupToDB(newGroup);
        setAnimGroups((prev) => [...prev, newGroup]);
        setActiveIds((prev) => new Set(prev).add(newId));
        setFocusedId(newId);
      }
      setShowSlicer(false);
      setSlicerImage(null);
      setEditingGroupId(null);
    };
  };

  const confirmDelete = async () => {
    if (modalDelete.id) {
      await dbHelper.delete(modalDelete.id);
      setAnimGroups((prev) => prev.filter((g) => g.id !== modalDelete.id));
      setActiveIds((prev) => {
        const n = new Set(prev);
        n.delete(modalDelete.id!);
        return n;
      });
      if (focusedId === modalDelete.id) setFocusedId(null);
    }
    setModalDelete({ isOpen: false, id: null });
  };

  const confirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalRename.id && modalRename.name) {
      const group = animGroups.find((g) => g.id === modalRename.id);
      if (group) {
        const newGroup = { ...group, name: modalRename.name };
        await saveGroupToDB(newGroup);
        setAnimGroups((prev) =>
          prev.map((g) => (g.id === modalRename.id ? newGroup : g)),
        );
      }
    }
    setModalRename({ isOpen: false, id: null, name: "" });
  };

  const exportStrip = () => {
    const group = animGroups.find((g) => g.id === focusedId);
    if (!group) return;
    const frames = group.frames;
    if (frames.length === 0) return;
    const frameW = frames[0].width;
    const frameH = frames[0].height;
    const canvas = document.createElement("canvas");
    canvas.width = frameW * frames.length;
    canvas.height = frameH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const renderTexture = (index: number) => {
      if (index >= frames.length) {
        const link = document.createElement("a");
        link.download = `${group.name}_strip.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        return;
      }
      const tex = frames[index];
      const img = (tex.baseTexture.resource as any).source as HTMLImageElement;
      if (img)
        ctx.drawImage(
          img,
          tex.frame.x,
          tex.frame.y,
          tex.frame.width,
          tex.frame.height,
          index * frameW,
          0,
          frameW,
          frameH,
        );
      renderTexture(index + 1);
    };
    renderTexture(0);
  };

  const exportGIF = () => {
    const group = animGroups.find((g) => g.id === focusedId);
    if (!group) return;
    // @ts-ignore
    if (typeof gifshot === "undefined") {
      alert("Loading GIF lib...");
      return;
    }
    const images: string[] = [];
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    tempCanvas.width = group.frames[0].width;
    tempCanvas.height = group.frames[0].height;
    group.frames.forEach((tex) => {
      ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      const img = (tex.baseTexture.resource as any).source as HTMLImageElement;
      if (img) {
        ctx.drawImage(
          img,
          tex.frame.x,
          tex.frame.y,
          tex.frame.width,
          tex.frame.height,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height,
        );
        images.push(tempCanvas.toDataURL());
      }
    });
    // @ts-ignore
    gifshot.createGIF(
      {
        images,
        interval: 1 / fps,
        gifWidth: tempCanvas.width * scale,
        gifHeight: tempCanvas.height * scale,
      },
      (obj: any) => {
        if (!obj.error) {
          const link = document.createElement("a");
          link.download = `${group.name}.gif`;
          link.href = obj.image;
          link.click();
        }
      },
    );
  };

  useEffect(() => {
    if (!appRef.current) return;
    const app = appRef.current;
    spritesMapRef.current.forEach((sprite, id) => {
      if (!activeIds.has(id)) {
        sprite.destroy();
        app.stage.removeChild(sprite);
        spritesMapRef.current.delete(id);
      }
    });
    activeIds.forEach((id) => {
      if (!spritesMapRef.current.has(id)) {
        const group = animGroups.find((g) => g.id === id);
        if (group) {
          const sprite = new PIXI.AnimatedSprite(group.frames);
          sprite.anchor.set(0.5);
          sprite.x = app.screen.width / 2;
          sprite.y = app.screen.height / 2;
          sprite.animationSpeed = 12 / 60;
          sprite.play();
          group.frames.forEach(
            (t) => (t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST),
          );
          sprite.eventMode = "static";
          sprite.cursor = "grab";
          let dragData: any = null;
          sprite.on("pointerdown", (e) => {
            dragData = e.data;
            sprite.alpha = 0.6;
            sprite.cursor = "grabbing";
            setFocusedId(id);
          });
          sprite.on("pointermove", () => {
            if (dragData) {
              const newPos = dragData.getLocalPosition(sprite.parent);
              sprite.x = newPos.x;
              sprite.y = newPos.y;
            }
          });
          const end = () => {
            dragData = null;
            sprite.alpha = 1;
            sprite.cursor = "grab";
          };
          sprite.on("pointerup", end);
          sprite.on("pointerupoutside", end);
          sprite.on("rightdown", () => {
            sprite.x = app.screen.width / 2;
            sprite.y = app.screen.height / 2;
          });
          app.stage.addChild(sprite);
          spritesMapRef.current.set(id, sprite);
          sprite.scale.set(2);
        }
      }
    });
  }, [activeIds, animGroups]);

  useEffect(() => {
    if (!focusedId) return;
    const sprite = spritesMapRef.current.get(focusedId);
    if (sprite) {
      sprite.animationSpeed = fps / 60;
      sprite.scale.set(scale);
      sprite.loop = loop;
      if (isPlaying && !sprite.playing) sprite.play();
      if (!isPlaying && sprite.playing) sprite.stop();
    }
  }, [focusedId, fps, scale, loop, isPlaying]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!focusedId) return;
      if (
        containerRef.current &&
        containerRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) =>
          Math.max(0.1, Math.min(20, parseFloat((prev + delta).toFixed(1)))),
        );
      }
    };
    const handleContext = (e: MouseEvent) => {
      if (!focusedId) return;
      if (
        containerRef.current &&
        containerRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        const sprite = spritesMapRef.current.get(focusedId);
        if (sprite && appRef.current) {
          sprite.x = appRef.current.screen.width / 2;
          sprite.y = appRef.current.screen.height / 2;
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("contextmenu", handleContext);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", handleContext);
    };
  }, [focusedId]);

  return (
    <div
      className="relative flex h-full w-full bg-[#09090b] text-slate-200 font-sans overflow-hidden select-none"
      onClick={() => setMenuOpenId(null)}
    >
      {showPixelDrawer && (
        <PixelDrawer
          onClose={() => setShowPixelDrawer(false)}
          onSave={handlePixelSave}
        />
      )}
      {modalDelete.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle /> <h3 className="font-bold">Delete Animation?</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModalDelete({ isOpen: false, id: null })}
                className="flex-1 py-2 bg-zinc-800 rounded hover:bg-zinc-700 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-900/50 text-red-200 rounded hover:bg-red-900 text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {modalRename.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-white mb-4">Rename Animation</h3>
            <form onSubmit={confirmRename}>
              <input
                autoFocus
                type="text"
                value={modalRename.name}
                onChange={(e) =>
                  setModalRename((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded text-white mb-6 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setModalRename({ isOpen: false, id: null, name: "" })
                  }
                  className="flex-1 py-2 bg-zinc-800 rounded hover:bg-zinc-700 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 rounded hover:bg-indigo-500 text-white text-sm font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <aside
        className={`flex flex-col border-r border-white/10 bg-[#12121a] z-30 transition-all duration-300 h-full ${
          isMobile ? "absolute top-0 bottom-0 w-72 shadow-2xl" : "relative w-72"
        } ${isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute"}`}
      >
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
          <span className="font-bold text-indigo-400 flex items-center gap-2">
            <Zap size={16} className="fill-current" /> Studio V11
          </span>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)}>
              <X size={18} className="text-slate-400" />
            </button>
          )}
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col items-center justify-center h-16 border border-dashed border-zinc-600 rounded bg-zinc-900/50 hover:bg-zinc-800 cursor-pointer group">
            <Upload
              className="text-zinc-500 group-hover:text-indigo-400"
              size={16}
            />
            <span className="text-[10px] text-zinc-400 mt-1">Import</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowPixelDrawer(true)}
            className="flex flex-col items-center justify-center h-16 border border-dashed border-zinc-600 rounded bg-zinc-900/50 hover:bg-zinc-800 group"
          >
            <PenTool
              className="text-zinc-500 group-hover:text-emerald-400"
              size={16}
            />
            <span className="text-[10px] text-zinc-400 mt-1">Draw New</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {animGroups.map((group) => (
            <div
              key={group.id}
              className={`group p-2 rounded cursor-pointer flex items-center gap-2 relative border select-none ${
                focusedId === group.id
                  ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-100"
                  : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400"
              }`}
              onClick={() => setFocusedId(group.id)}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const newSet = new Set(activeIds);
                  if (newSet.has(group.id)) newSet.delete(group.id);
                  else newSet.add(group.id);
                  setActiveIds(newSet);
                }}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                {activeIds.has(group.id) ? (
                  <CheckSquare size={16} className="text-indigo-400" />
                ) : (
                  <Square size={16} />
                )}
              </div>
              <div className="w-8 h-8 bg-black/40 rounded flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                {group.frames.length > 0 && (
                  <img
                    src={(group.frames[0].baseTexture.resource as any).url}
                    className="w-full h-full object-contain pixelated"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{group.name}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === group.id ? null : group.id);
                }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <MoreVertical size={14} />
              </button>
              {menuOpenId === group.id && (
                <div className="absolute right-0 top-8 bg-zinc-800 border border-white/10 rounded shadow-xl z-50 w-32 py-1 flex flex-col">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalRename({
                        isOpen: true,
                        id: group.id,
                        name: group.name,
                      });
                      setMenuOpenId(null);
                    }}
                    className="px-3 py-2 text-left text-xs hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Edit size={12} /> Rename
                  </button>
                  {group.sliceConfig && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlicerImage(
                          (group.frames[0].baseTexture.resource as any).url,
                        );
                        setSliceConfig(group.sliceConfig!);
                        setEditingGroupId(group.id);
                        setShowSlicer(true);
                        setMenuOpenId(null);
                      }}
                      className="px-3 py-2 text-left text-xs hover:bg-zinc-700 flex items-center gap-2 text-yellow-400"
                    >
                      <Scissors size={12} /> Edit Sheet
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalDelete({ isOpen: true, id: group.id });
                      setMenuOpenId(null);
                    }}
                    className="px-3 py-2 text-left text-xs hover:bg-red-900/50 text-red-400 flex items-center gap-2"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/5 space-y-2 bg-[#0e0e14] shrink-0">
          <button
            onClick={exportStrip}
            disabled={!focusedId}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 border border-white/5"
          >
            <Grid size={12} /> STRIP
          </button>
          <button
            onClick={exportGIF}
            disabled={!focusedId}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Video size={12} /> GIF
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <header className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b] shrink-0">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <Menu size={18} />
              </button>
            )}
            <span className="text-xs font-bold text-zinc-300 ml-2 border-l border-zinc-700 pl-3">
              {focusedId
                ? animGroups.find((g) => g.id === focusedId)?.name
                : "Select an animation"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <div className="flex items-center gap-1">
              <MousePointer2 size={12} /> <span>Drag</span>
            </div>
            <div className="flex items-center gap-1">
              <Crosshair size={12} /> <span>R-Click Center</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-full px-2 py-0.5 border border-white/5">
              <span className="font-bold">BG</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-none p-0"
              />
            </div>
          </div>
        </header>
        <div
          className="flex-1 relative overflow-hidden min-h-0 min-w-0"
          style={{ backgroundColor: bgColor }}
        >
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          ></div>
          {/* <div ref={containerRef} className="w-full h-full absolute inset-0" /> */}
          <div
            ref={containerRef}
            className="w-full h-full absolute inset-0 overflow-hidden"
            style={{ touchAction: "none" }} // Chặn hành vi cuộn mặc định trên mobile để drag tốt hơn
          />
        </div>
        <div className="h-16 bg-[#12121a] border-t border-white/5 px-4 flex items-center justify-between shrink-0 gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-indigo-400 transition shadow-lg shrink-0"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <div
            className={`flex-1 flex items-center gap-6 max-w-md transition-opacity ${
              focusedId ? "opacity-100" : "opacity-30 pointer-events-none"
            }`}
          >
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                <span>Speed</span>{" "}
                <span className="text-indigo-400">{fps}</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                <span>Zoom</span>{" "}
                <span className="text-indigo-400">{scale}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </main>
      {showSlicer && slicerImage && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90%]">
            <div className="p-3 border-b border-zinc-700 bg-[#202025] flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-2">
                <Scissors size={14} /> Slicer
              </span>
              <button
                onClick={() => {
                  setShowSlicer(false);
                  setEditingGroupId(null);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-black/50 overflow-auto p-4 flex items-center justify-center relative">
              <div className="relative inline-block">
                <img
                  src={slicerImage}
                  className="max-w-none pixelated"
                  style={{ imageRendering: "pixelated" }}
                />
                <div
                  className="absolute inset-0 pointer-events-none border border-indigo-500/50"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
                    backgroundSize: `${100 / sliceConfig.cols}% ${
                      100 / sliceConfig.rows
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="p-4 bg-[#18181b] border-t border-zinc-700 flex gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Cols
                </label>
                <input
                  type="number"
                  min="1"
                  value={sliceConfig.cols}
                  onChange={(e) =>
                    setSliceConfig({
                      ...sliceConfig,
                      cols: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Rows
                </label>
                <input
                  type="number"
                  min="1"
                  value={sliceConfig.rows}
                  onChange={(e) =>
                    setSliceConfig({
                      ...sliceConfig,
                      rows: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                />
              </div>
              <button
                onClick={handleSliceConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded h-9 mt-auto"
              >
                {editingGroupId ? "UPDATE" : "CREATE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
