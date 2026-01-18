import React, {
  useState,
  useRef,
  useEffect,
  Suspense,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Stars,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  TransformControls,
  Stats as ThreeStats,
} from "@react-three/drei";
import { Physics, useBox, usePlane, useSphere } from "@react-three/cannon";
import {
  Geometry,
  Base,
  Subtraction,
  Addition,
  Intersection,
} from "@react-three/csg";
import * as THREE from "three";
import {
  Box,
  Circle,
  Triangle,
  Move,
  Maximize,
  RotateCw,
  Layers,
  Settings2,
  Grid as GridIcon,
  X,
  Magnet,
  Copy,
  Scissors,
  ClipboardPaste,
  ArrowDownToLine,
  Crosshair,
  Combine,
  Slice,
  Hexagon,
  Zap,
  Play,
  RefreshCw,
  Cuboid,
  List,
  Gauge,
  Activity,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw, // Icon Reset
} from "lucide-react";
import clsx from "clsx";

// --- TYPES ---
type TransformMode = "translate" | "rotate" | "scale";
type ShapeType = "box" | "sphere" | "torus" | "cone" | "knot" | "gem" | "csg";
type AnimType = "none" | "spin" | "float" | "pulse" | "wobble";
type CsgOperation = "base" | "add" | "sub" | "int";

interface SceneObject {
  id: string;
  name?: string;
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  animation: AnimType;
  animSpeed: number;
  csgChildren?: SceneObject[];
  csgOp?: CsgOperation;
  triggerUrl?: string;
  triggerLabel?: string;
  mass: number;
  bounciness: number;
  visible: boolean;
  locked: boolean;
}

interface SceneConfig {
  bgColor: string;
  gridVisible: boolean;
  ambientIntensity: number;
  enableFog: boolean;
  fogDensity: number;
  snapEnabled: boolean;
  snapStep: number;
}

interface ObjectStats {
  position: [number, number, number];
  velocity: [number, number, number];
}

// --- CONSTANTS & DEFAULTS ---
const STORAGE_KEY_DATA = "overdesk_3d_objects_v1";
const STORAGE_KEY_CONFIG = "overdesk_3d_config_v1";

const DEFAULT_CONFIG: SceneConfig = {
  bgColor: "#09090b",
  gridVisible: true,
  ambientIntensity: 0.6,
  enableFog: false,
  fogDensity: 0.03,
  snapEnabled: false,
  snapStep: 0.5,
};

const DEFAULT_OBJECTS: SceneObject[] = [
  {
    id: "1",
    name: "Blue Cube",
    type: "box",
    position: [0, 5, 0],
    rotation: [0.5, 0.5, 0],
    scale: [1, 1, 1],
    color: "#6366f1",
    animation: "none",
    animSpeed: 1,
    mass: 1,
    bounciness: 0.5,
    visible: true,
    locked: false,
  },
  {
    id: "2",
    name: "Pink Ball",
    type: "sphere",
    position: [0.5, 8, 0.5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: "#ec4899",
    animation: "none",
    animSpeed: 1,
    mass: 2,
    bounciness: 0.8,
    visible: true,
    locked: false,
  },
  {
    id: "floor",
    name: "Ground",
    type: "box",
    position: [0, -0.5, 0],
    rotation: [0, 0, 0],
    scale: [20, 1, 20],
    color: "#333333",
    animation: "none",
    animSpeed: 0,
    mass: 0,
    bounciness: 0.1,
    visible: true,
    locked: true,
  },
];

const TEMPLATES = [
  {
    label: "Planet",
    type: "sphere",
    scale: [2, 2, 2],
    color: "#3b82f6",
    mass: 5,
    bounciness: 0.5,
    animation: "spin" as AnimType,
    speed: 0.5,
    icon: <Circle size={16} />,
  },
  {
    label: "Crate",
    type: "box",
    scale: [1, 1, 1],
    color: "#eab308",
    mass: 1,
    bounciness: 0.2,
    animation: "none" as AnimType,
    speed: 0,
    icon: <Cuboid size={16} />,
  },
  {
    label: "Bouncy Ball",
    type: "sphere",
    scale: [1, 1, 1],
    color: "#ec4899",
    mass: 1,
    bounciness: 0.9,
    animation: "none" as AnimType,
    speed: 0,
    icon: <Circle size={16} />,
  },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- HELPER ---
const GeometryShape = ({ type }: { type: ShapeType }) => {
  switch (type) {
    case "box":
      return <boxGeometry args={[1, 1, 1]} />;
    case "sphere":
      return <sphereGeometry args={[0.7, 32, 32]} />;
    case "torus":
      return <torusGeometry args={[0.6, 0.2, 16, 32]} />;
    case "cone":
      return <coneGeometry args={[0.7, 1.5, 32]} />;
    case "knot":
      return <torusKnotGeometry args={[0.5, 0.15, 64, 8]} />;
    case "gem":
      return <icosahedronGeometry args={[0.7, 0]} />;
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
};

const CsgMesh = ({ data }: { data: SceneObject }) => {
  if (!data.csgChildren || data.csgChildren.length === 0) return null;
  return (
    <Geometry>
      {data.csgChildren.map((child, index) => {
        const Component =
          index === 0
            ? Base
            : child.csgOp === "sub"
            ? Subtraction
            : child.csgOp === "int"
            ? Intersection
            : Addition;
        return (
          <Component
            key={child.id}
            position={child.position}
            rotation={child.rotation as any}
            scale={child.scale}
          >
            <GeometryShape type={child.type} />
          </Component>
        );
      })}
    </Geometry>
  );
};

const PhysicsFloor = () => {
  usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: "Static",
    material: { friction: 0.1, restitution: 0.5 },
  }));
  return null;
};

// --- SIMULATED OBJECT ---
const SimulatedSphere = ({
  data,
  isSelected,
  onTrigger,
  onStatsUpdate,
}: {
  data: SceneObject;
  isSelected: boolean;
  onTrigger: (url: string) => void;
  onStatsUpdate: (stats: ObjectStats) => void;
}) => {
  const radius = 0.7 * data.scale[0];
  const [ref, api] = useSphere(() => ({
    mass: data.mass,
    position: data.position,
    rotation: data.rotation as any,
    args: [radius],
    material: { friction: 0.1, restitution: data.bounciness },
  }));

  useEffect(() => {
    if (!isSelected) return;
    let currentPos = [0, 0, 0];
    const pSub = api.position.subscribe((v) => {
      currentPos = v;
      onStatsUpdate({ position: v as any, velocity: [0, 0, 0] });
    });
    const vSub = api.velocity.subscribe((v) =>
      onStatsUpdate({ position: currentPos as any, velocity: v as any })
    );
    return () => {
      pSub();
      vSub();
    };
  }, [isSelected, api]);

  return (
    <mesh
      ref={ref as any}
      scale={data.scale}
      onClick={(e) => {
        e.stopPropagation();
        if (data.triggerUrl) onTrigger(data.triggerUrl);
      }}
      castShadow
      receiveShadow
    >
      <GeometryShape type={data.type} />
      <meshStandardMaterial
        color={data.color}
        roughness={0.2}
        metalness={0.5}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.SphereGeometry(0.7, 16, 16)]} />
          <lineBasicMaterial color="#ffff00" />
        </lineSegments>
      )}
    </mesh>
  );
};

const SimulatedBox = ({
  data,
  isSelected,
  onTrigger,
  onStatsUpdate,
}: {
  data: SceneObject;
  isSelected: boolean;
  onTrigger: (url: string) => void;
  onStatsUpdate: (stats: ObjectStats) => void;
}) => {
  const [ref, api] = useBox(() => ({
    mass: data.mass,
    position: data.position,
    rotation: data.rotation as any,
    args: [data.scale[0], data.scale[1], data.scale[2]],
    material: { friction: 0.1, restitution: data.bounciness },
  }));

  useEffect(() => {
    if (!isSelected) return;
    let currentPos = [0, 0, 0];
    const pSub = api.position.subscribe((v) => {
      currentPos = v;
      onStatsUpdate({ position: v as any, velocity: [0, 0, 0] });
    });
    const vSub = api.velocity.subscribe((v) =>
      onStatsUpdate({ position: currentPos as any, velocity: v as any })
    );
    return () => {
      pSub();
      vSub();
    };
  }, [isSelected, api]);

  return (
    <mesh
      ref={ref as any}
      scale={data.scale}
      onClick={(e) => {
        e.stopPropagation();
        if (data.triggerUrl) onTrigger(data.triggerUrl);
      }}
      castShadow
      receiveShadow
    >
      {data.type === "csg" ? (
        <CsgMesh data={data} />
      ) : (
        <GeometryShape type={data.type} />
      )}
      <meshStandardMaterial
        color={data.color}
        roughness={0.2}
        metalness={0.5}
        emissive={data.type === "knot" ? data.color : "#000000"}
        emissiveIntensity={data.type === "knot" ? 0.2 : 0}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
          <lineBasicMaterial color="#ffff00" />
        </lineSegments>
      )}
    </mesh>
  );
};

const SimulatedObject = ({
  data,
  isSelected,
  onTrigger,
  onStatsUpdate,
}: {
  data: SceneObject;
  isSelected: boolean;
  onTrigger: (url: string) => void;
  onStatsUpdate: (stats: ObjectStats) => void;
}) => {
  if (data.type === "sphere")
    return (
      <SimulatedSphere
        data={data}
        isSelected={isSelected}
        onTrigger={onTrigger}
        onStatsUpdate={onStatsUpdate}
      />
    );
  return (
    <SimulatedBox
      data={data}
      isSelected={isSelected}
      onTrigger={onTrigger}
      onStatsUpdate={onStatsUpdate}
    />
  );
};

// --- EDITABLE OBJECT ---
const EditableObject = ({
  data,
  isSelected,
  mode,
  config,
  onSelect,
  onUpdate,
}: {
  data: SceneObject;
  isSelected: boolean;
  mode: TransformMode;
  config: SceneConfig;
  onSelect: (e: any) => void;
  onUpdate: (id: string, props: Partial<SceneObject>) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!meshRef.current || isSelected) return;
    const time = state.clock.getElapsedTime();
    const speed = data.animSpeed || 1;
    if (data.animation === "float")
      meshRef.current.position.y =
        data.position[1] + Math.sin(time * speed * 2) * 0.3;
    if (data.animation === "spin") {
      meshRef.current.rotation.y += 0.01 * speed;
      meshRef.current.rotation.x += 0.005 * speed;
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={data.position}
        rotation={data.rotation as any}
        scale={data.scale}
        onClick={onSelect}
        castShadow
        receiveShadow
      >
        {data.type === "csg" ? (
          <CsgMesh data={data} />
        ) : (
          <GeometryShape type={data.type} />
        )}
        <meshStandardMaterial
          color={isSelected ? "#facc15" : data.color}
          roughness={0.2}
          metalness={0.5}
          emissive={
            isSelected
              ? "#443300"
              : data.type === "knot"
              ? data.color
              : "#000000"
          }
          emissiveIntensity={data.type === "knot" ? 0.2 : 0}
          opacity={data.locked ? 0.8 : 1}
          transparent={data.locked}
        />
      </mesh>

      {isSelected && !data.locked && (
        <TransformControls
          object={meshRef}
          mode={mode}
          translationSnap={config.snapEnabled ? config.snapStep : null}
          rotationSnap={config.snapEnabled ? Math.PI / 4 : null}
          scaleSnap={config.snapEnabled ? 0.1 : null}
          onObjectChange={() => {
            if (meshRef.current) {
              const { position, rotation, scale } = meshRef.current;
              onUpdate(data.id, {
                position: [position.x, position.y, position.z],
                rotation: [rotation.x, rotation.y, rotation.z],
                scale: [scale.x, scale.y, scale.z],
              });
            }
          }}
        />
      )}
    </>
  );
};

// --- MAIN MODULE ---
export const Space3DModule = () => {
  // [AUTO-LOAD] Initialize State from LocalStorage
  const [objects, setObjects] = useState<SceneObject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      return saved ? JSON.parse(saved) : DEFAULT_OBJECTS;
    } catch (e) {
      console.error("Failed to load scene objects", e);
      return DEFAULT_OBJECTS;
    }
  });

  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");
  const [showSettings, setShowSettings] = useState(false);
  const [clipboard, setClipboard] = useState<SceneObject | null>(null);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [timeScale, setTimeScale] = useState(1);
  const [liveStats, setLiveStats] = useState<ObjectStats>({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
  });

  // [AUTO-SAVE] Effect to save data on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(objects));
  }, [objects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(sceneConfig));
  }, [sceneConfig]);

  // [NEW] Factory Reset Action
  const handleFactoryReset = () => {
    if (confirm("Reset toàn bộ Scene về mặc định? Dữ liệu hiện tại sẽ mất.")) {
      setObjects(DEFAULT_OBJECTS);
      setSceneConfig(DEFAULT_CONFIG);
      setSelectedIds([]);
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_CONFIG);
    }
  };

  const handleTogglePlay = () => {
    if (!isPlayMode) {
      setSelectedIds([]);
      setResetKey((prev) => prev + 1);
    } else {
      setSelectedIds([]);
      setLiveStats({ position: [0, 0, 0], velocity: [0, 0, 0] });
    }
    setIsPlayMode(!isPlayMode);
  };

  const handleSelect = (e: any, id: string) => {
    if (e) e.stopPropagation();
    if (e && (e.shiftKey || e.ctrlKey) && !isPlayMode) {
      if (selectedIds.includes(id))
        setSelectedIds((prev) => prev.filter((i) => i !== id));
      else setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds([id]);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o))
    );
  };

  const handleToggleLock = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o))
    );
  };

  const handleAddObject = (
    type: ShapeType,
    props: Partial<SceneObject> = {}
  ) => {
    const newObj: SceneObject = {
      id: generateId(),
      name: `New ${type}`,
      type,
      position: [0, 5, 0],
      rotation: [Math.random(), Math.random(), 0],
      scale: [1, 1, 1],
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      animation: "none",
      animSpeed: 1,
      mass: 1,
      bounciness: 0.5,
      visible: true,
      locked: false,
      ...props,
    };
    setObjects([...objects, newObj]);
    setSelectedIds([newObj.id]);
  };

  const handleDeleteSelected = useCallback(() => {
    setObjects((prev) => prev.filter((o) => !selectedIds.includes(o.id)));
    setSelectedIds([]);
  }, [selectedIds]);

  const handleUpdateObject = (id: string, props: Partial<SceneObject>) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...props } : o))
    );
  };

  const handleExecuteTrigger = (url: string) => {
    window.open(url, "_blank");
  };

  const selectedObject = objects.find((o) => o.id === selectedIds[0]);
  const handleCopy = () => {
    if (selectedObject) setClipboard(selectedObject);
  };
  const handleCut = () => {
    if (selectedObject) {
      setClipboard(selectedObject);
      handleDeleteSelected();
    }
  };
  const handlePaste = () => {
    if (clipboard) {
      const newObj = {
        ...clipboard,
        id: generateId(),
        name: `${clipboard.name} (Copy)`,
        position: [
          clipboard.position[0] + 1,
          clipboard.position[1],
          clipboard.position[2] + 1,
        ] as [number, number, number],
        visible: true,
        locked: false,
      };
      setObjects([...objects, newObj]);
      setSelectedIds([newObj.id]);
    }
  };
  const handleAlignFloor = () => {
    if (selectedObject)
      handleUpdateObject(selectedObject.id, {
        position: [
          selectedObject.position[0],
          selectedObject.scale[1] / 2,
          selectedObject.position[2],
        ],
      });
  };
  const handleAlignCenter = () => {
    if (selectedObject)
      handleUpdateObject(selectedObject.id, {
        position: [0, selectedObject.position[1], 0],
      });
  };
  const performBoolean = (operation: "add" | "sub") => {
    if (selectedIds.length < 2) return;
    const selectedObjs = objects.filter((o) => selectedIds.includes(o.id));
    const sorted = selectedObjs.sort(
      (a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id)
    );
    const baseObj = sorted[0];
    const csgChildren: SceneObject[] = sorted.map((obj, index) => ({
      ...obj,
      position: [
        obj.position[0] - baseObj.position[0],
        obj.position[1] - baseObj.position[1],
        obj.position[2] - baseObj.position[2],
      ],
      csgOp: index === 0 ? "base" : operation,
    }));
    const newCsgObj: SceneObject = {
      ...baseObj,
      id: generateId(),
      name: `Composite ${operation}`,
      type: "csg",
      csgChildren,
      visible: true,
      locked: false,
    };
    setObjects([
      ...objects.filter((o) => !selectedIds.includes(o.id)),
      newCsgObj,
    ]);
    setSelectedIds([newCsgObj.id]);
  };

  const handleStatsUpdate = (stats: ObjectStats) => {
    setLiveStats((prev) => ({
      position: stats.position || prev.position,
      velocity: stats.velocity || prev.velocity,
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === " ") {
        e.preventDefault();
        handleTogglePlay();
        return;
      }
      if (!isPlayMode) {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case "c":
              handleCopy();
              break;
            case "x":
              handleCut();
              break;
            case "v":
              handlePaste();
              break;
          }
        } else {
          switch (e.key.toLowerCase()) {
            case "w":
              setTransformMode("translate");
              break;
            case "e":
              setTransformMode("rotate");
              break;
            case "r":
              setTransformMode("scale");
              break;
            case "delete":
            case "backspace":
              handleDeleteSelected();
              break;
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, clipboard, isPlayMode]);

  return (
    <div className="h-full w-full bg-black relative overflow-hidden flex flex-col font-sans select-none">
      {/* TOOLBAR */}
      <div
        className={clsx(
          "absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 p-1.5 backdrop-blur-md rounded-xl border shadow-xl transition-colors duration-300",
          isPlayMode
            ? "bg-indigo-900/80 border-indigo-500/50"
            : "bg-[#1a1a1a]/90 border-white/10"
        )}
      >
        <div className="flex gap-2 border-r border-white/10 pr-2 mr-1 items-center">
          <button
            onClick={handleTogglePlay}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-bold text-xs",
              isPlayMode
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            )}
            title="Spacebar to Toggle"
          >
            {isPlayMode ? (
              <>
                <RefreshCw size={14} /> RESET & EDIT
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" /> SIMULATE
              </>
            )}
          </button>
          {isPlayMode && (
            <div className="flex items-center gap-2 px-2">
              <Gauge size={14} className="text-indigo-300" />
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                className="w-16 accent-indigo-400 h-1 bg-white/20 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-white font-mono w-8">
                {timeScale}x
              </span>
            </div>
          )}
        </div>

        {!isPlayMode && (
          <>
            <div className="flex gap-1 border-r border-white/10 pr-2 mr-1">
              <button
                onClick={() => setTransformMode("translate")}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  transformMode === "translate"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                title="Move"
              >
                <Move size={18} />
              </button>
              <button
                onClick={() => setTransformMode("rotate")}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  transformMode === "rotate"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                title="Rotate"
              >
                <RotateCw size={18} />
              </button>
              <button
                onClick={() => setTransformMode("scale")}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  transformMode === "scale"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                title="Scale"
              >
                <Maximize size={18} />
              </button>
            </div>
            <div className="flex gap-1 border-r border-white/10 pr-2 mr-1">
              <button
                onClick={() => performBoolean("add")}
                className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/20"
                title="Union"
              >
                <Combine size={18} />
              </button>
              <button
                onClick={() => performBoolean("sub")}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20"
                title="Subtract"
              >
                <Slice size={18} />
              </button>
            </div>
            <div className="flex gap-1 border-r border-white/10 pr-2 mr-1">
              <button
                onClick={() =>
                  setSceneConfig((p) => ({ ...p, snapEnabled: !p.snapEnabled }))
                }
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  sceneConfig.snapEnabled
                    ? "bg-amber-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                title="Magnet"
              >
                <Magnet size={18} />
              </button>
              <button
                onClick={handleCopy}
                disabled={selectedIds.length === 0}
                className="p-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-30"
                title="Copy"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={handlePaste}
                disabled={!clipboard}
                className="p-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-30"
                title="Paste"
              >
                <ClipboardPaste size={18} />
              </button>
            </div>
          </>
        )}

        <div className="flex gap-1">
          <button
            onClick={() =>
              setSceneConfig((p) => ({ ...p, gridVisible: !p.gridVisible }))
            }
            className={clsx(
              "p-2 rounded-lg transition-colors",
              sceneConfig.gridVisible
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
            title="Grid"
          >
            <GridIcon size={18} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              showSettings
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
            title="Settings"
          >
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-64 bg-[#1a1a1a]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl p-4 animate-in slide-in-from-top-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-gray-400 font-bold uppercase">
                Background
              </label>
              <input
                type="color"
                value={sceneConfig.bgColor}
                onChange={(e) =>
                  setSceneConfig({ ...sceneConfig, bgColor: e.target.value })
                }
                className="w-6 h-6 rounded bg-transparent border-0 p-0 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] text-gray-400 font-bold uppercase">
                  Brightness
                </label>
                <span className="text-[10px] text-white font-mono">
                  {sceneConfig.ambientIntensity}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={sceneConfig.ambientIntensity}
                onChange={(e) =>
                  setSceneConfig({
                    ...sceneConfig,
                    ambientIntensity: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            {/* [NEW] Factory Reset Button */}
            <div className="pt-2 border-t border-white/10 mt-2">
              <button
                onClick={handleFactoryReset}
                className="w-full flex items-center justify-center gap-2 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-[10px] font-bold uppercase"
              >
                <RotateCcw size={12} /> Reset to Factory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL: HIERARCHY & SHAPES */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 flex flex-col gap-3 p-3 bg-[#1a1a1a]/80 backdrop-blur-md rounded-xl border border-white/10 shadow-xl max-h-[80vh] w-56 animate-in slide-in-from-left-5">
        {!isPlayMode && (
          <div className="flex flex-col gap-3 border-b border-white/10 pb-3">
            <p className="text-[9px] font-bold text-gray-500 text-center uppercase tracking-wider">
              Create
            </p>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => handleAddObject("box")}
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-300"
                title="Cube"
              >
                <Box size={14} />
              </button>
              <button
                onClick={() => handleAddObject("sphere")}
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-300"
                title="Sphere"
              >
                <Circle size={14} />
              </button>
              <button
                onClick={() => handleAddObject("cone")}
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-300"
                title="Cone"
              >
                <Triangle size={14} />
              </button>
              <button
                onClick={() => handleAddObject("gem")}
                className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-300"
                title="Gem"
              >
                <Hexagon size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() =>
                    handleAddObject(t.type as ShapeType, {
                      name: t.label,
                      scale: t.scale as any,
                      color: t.color,
                      animation: t.animation,
                      animSpeed: t.speed,
                      mass: t.mass,
                      bounciness: t.bounciness,
                    })
                  }
                  className="flex items-center gap-2 p-1.5 rounded bg-white/5 hover:bg-indigo-600/20 text-gray-300 text-[10px] hover:text-white"
                >
                  <span className="opacity-70">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hierarchy List (Scrollable) */}
        <div className="flex flex-col gap-1 flex-1 overflow-hidden min-h-0">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <List size={10} /> Hierarchy ({objects.length})
          </p>
          <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-0.5 pr-1 max-h-48">
            {objects.map((obj) => (
              <div
                key={obj.id}
                onClick={(e) => handleSelect(e, obj.id)}
                className={clsx(
                  "flex items-center justify-between p-1.5 rounded cursor-pointer text-[10px] group transition-all",
                  selectedIds.includes(obj.id)
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-white/5 text-gray-400",
                  !obj.visible && "opacity-50"
                )}
              >
                <div className="flex items-center gap-2 truncate flex-1">
                  {obj.type === "box" ? (
                    <Box size={10} />
                  ) : (
                    <Circle size={10} />
                  )}
                  <span className="truncate max-w-[80px]">
                    {obj.name || obj.type}
                  </span>
                  {/* Locked Indicator */}
                  {obj.locked && <Lock size={8} className="text-amber-400" />}
                </div>

                {!isPlayMode && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Lock Toggle */}
                    <button
                      onClick={(e) => handleToggleLock(e, obj.id)}
                      className="hover:text-amber-400 p-0.5"
                      title={obj.locked ? "Unlock" : "Lock"}
                    >
                      {obj.locked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                    {/* Visibility Toggle */}
                    <button
                      onClick={(e) => handleToggleVisibility(e, obj.id)}
                      className="hover:text-white p-0.5"
                      title="Show/Hide"
                    >
                      {obj.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                    {/* Delete */}
                    {!obj.locked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setObjects((prev) =>
                            prev.filter((o) => o.id !== obj.id)
                          );
                        }}
                        className="hover:text-red-300 p-0.5"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE STATS (Play Mode) */}
      {isPlayMode && selectedIds.length > 0 && (
        <div className="absolute top-20 right-4 z-20 w-48 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-3 animate-in slide-in-from-right-5 font-mono text-xs text-white">
          <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold uppercase tracking-wider text-[10px]">
            <Activity size={12} /> Live Physics
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-gray-400">
              <span>Height (Y)</span>{" "}
              <span className="text-white">
                {liveStats.position[1].toFixed(2)}m
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Speed</span>{" "}
              <span className="text-white">
                {Math.hypot(
                  liveStats.velocity[0],
                  liveStats.velocity[1],
                  liveStats.velocity[2]
                ).toFixed(2)}{" "}
                m/s
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Pos X</span>{" "}
              <span className="text-white">
                {liveStats.position[0].toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Pos Z</span>{" "}
              <span className="text-white">
                {liveStats.position[2].toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT SIDEBAR (Properties - Edit Mode Only) */}
      {selectedObject && !isPlayMode && (
        <div
          className={clsx(
            "absolute top-20 right-4 z-20 w-60 bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl p-4 animate-in slide-in-from-right-10 overflow-y-auto max-h-[80vh]",
            selectedObject.locked && "opacity-75 pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              {selectedObject.locked ? (
                <span className="text-amber-400 flex items-center gap-1 text-[9px] border border-amber-400/50 p-1 rounded">
                  <Lock size={10} />
                </span>
              ) : (
                <Layers size={12} />
              )}
              Properties{" "}
            </span>
            <div className="flex gap-1 ml-2 pl-2 border-l border-white/10">
              <button
                onClick={handleAlignFloor}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <ArrowDownToLine size={14} />
              </button>
              <button
                onClick={handleAlignCenter}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <Crosshair size={14} />
              </button>
              <button
                onClick={handleCut}
                className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
              >
                <Scissors size={14} />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase">
                Name
              </label>
              <input
                type="text"
                value={selectedObject.name || ""}
                onChange={(e) =>
                  handleUpdateObject(selectedObject.id, {
                    name: e.target.value,
                  })
                }
                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase">
                Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["X", "Y", "Z"].map((axis, i) => (
                  <div
                    key={axis}
                    className="bg-black/30 rounded p-1.5 border border-white/5 flex items-center gap-1.5"
                  >
                    <span className="text-[9px] text-indigo-500 font-bold">
                      {axis}
                    </span>
                    <span className="text-[10px] text-gray-300 font-mono">
                      {selectedObject.position[i].toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-white/5">
              <label className="text-[10px] text-gray-500 font-bold uppercase">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedObject.color}
                  onChange={(e) =>
                    handleUpdateObject(selectedObject.id, {
                      color: e.target.value,
                    })
                  }
                  className="w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-[10px] text-rose-400 font-bold uppercase flex items-center gap-1">
                <Zap size={12} /> Physics
              </label>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-gray-500">Mass</label>
                  <span className="text-[10px] text-white font-mono">
                    {selectedObject.mass ?? 1}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={selectedObject.mass ?? 1}
                  onChange={(e) =>
                    handleUpdateObject(selectedObject.id, {
                      mass: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-rose-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-gray-500">Bounce</label>
                  <span className="text-[10px] text-white font-mono">
                    {selectedObject.bounciness ?? 0.5}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedObject.bounciness ?? 0.5}
                  onChange={(e) =>
                    handleUpdateObject(selectedObject.id, {
                      bounciness: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-rose-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CANVAS --- */}
      <Canvas
        shadows
        onPointerMissed={() => (isPlayMode ? {} : setSelectedIds([]))}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[5, 10, 10]} fov={50} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={50}
        />
        <ThreeStats className="!left-auto !top-auto !bottom-0 !right-0 opacity-50 pointer-events-none" />

        <color attach="background" args={[sceneConfig.bgColor]} />
        {sceneConfig.enableFog && (
          <fog
            attach="fog"
            args={[sceneConfig.bgColor, 5, 1 / sceneConfig.fogDensity]}
          />
        )}
        <ambientLight intensity={sceneConfig.ambientIntensity} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <Environment preset="city" />
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {sceneConfig.gridVisible && (
          <group>
            <Grid
              position={[0, -0.01, 0]}
              args={[20, 20]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#444"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#6366f1"
              fadeDistance={20}
              infiniteGrid
            />
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.6}
              scale={20}
              blur={2}
              far={1}
            />
          </group>
        )}

        <Suspense fallback={null}>
          {isPlayMode ? (
            <Physics
              key={resetKey}
              gravity={[0, -9.81, 0]}
              stepSize={(1 / 60) * timeScale}
            >
              <PhysicsFloor />
              {objects
                .filter((o) => o.visible)
                .map((obj) => (
                  <SimulatedObject
                    key={obj.id}
                    data={obj}
                    isSelected={selectedIds.includes(obj.id)}
                    onTrigger={handleExecuteTrigger}
                    onStatsUpdate={handleStatsUpdate}
                  />
                ))}
            </Physics>
          ) : (
            objects
              .filter((o) => o.visible)
              .map((obj) => (
                <EditableObject
                  key={obj.id}
                  data={obj}
                  isSelected={selectedIds.includes(obj.id)}
                  mode={transformMode}
                  config={sceneConfig}
                  onSelect={(e) => handleSelect(e, obj.id)}
                  onUpdate={handleUpdateObject}
                />
              ))
          )}
        </Suspense>

        {!isPlayMode && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport
              axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
              labelColor="white"
            />
          </GizmoHelper>
        )}
      </Canvas>
    </div>
  );
};
