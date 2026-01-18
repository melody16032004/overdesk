import { useState, useEffect, useRef } from "react";
import {
  Users,
  Plus,
  Minus,
  Search,
  Maximize,
  Heart,
  Edit2,
  Trash2,
  Calendar,
  User,
  Upload,
  Share2,
  GitFork,
  MoreHorizontal,
  FileJson,
  Image as ImageIcon,
  Building2,
  ChevronDown,
} from "lucide-react";

// --- TYPES ---
type TreeMode = "family" | "org"; // Mở rộng thêm 'mindmap' sau này
type Gender = "male" | "female";
type RelationType = "spouse" | "child" | "subordinate";

interface TreeNode {
  id: string;
  name: string;
  // Các trường linh hoạt (Optional)
  gender?: Gender; // Family
  birthYear?: string; // Family
  deathYear?: string; // Family
  role?: string; // Org (Chức vụ)
  department?: string; // Org (Phòng ban)

  position: { x: number; y: number };
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
}

interface TreeData {
  mode: TreeMode;
  nodes: TreeNode[];
  relationships: Relationship[];
}

// --- HELPER: STYLES ---
const getModeConfig = (mode: TreeMode) => {
  if (mode === "org") {
    return {
      color: "text-blue-500",
      icon: Building2,
      label: "Organization",
      nodeWidth: 240,
      nodeHeight: 90,
    };
  }
  return {
    color: "text-pink-500",
    icon: Users,
    label: "Genealogy",
    nodeWidth: 200,
    nodeHeight: 80,
  };
};

const INITIAL_DATA: TreeData = {
  mode: "family",
  nodes: [
    {
      id: "root",
      name: "Ông Tổ",
      gender: "male",
      birthYear: "1950",
      position: { x: 500, y: 100 },
    },
  ],
  relationships: [],
};

// --- COMPONENT ---
export const TreeBuilderModule = () => {
  // --- STATE ---

  // Load toàn bộ data (Bao gồm cả Mode)
  const [treeMode, setTreeMode] = useState<TreeMode>("family");
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  // Init Data (Lazy)
  useEffect(() => {
    const saved = localStorage.getItem("dashboard_tree_builder");
    if (saved) {
      try {
        const data: TreeData = JSON.parse(saved);
        setTreeMode(data.mode || "family");
        setNodes(data.nodes || []);
        setRelationships(data.relationships || []);
      } catch (e) {
        setNodes(INITIAL_DATA.nodes);
        setRelationships(INITIAL_DATA.relationships);
      }
    } else {
      setNodes(INITIAL_DATA.nodes);
    }
  }, []);

  // View State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Interaction State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [showIOMenu, setShowIOMenu] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false); // Menu chuyển Mode

  // Logic State
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);
  const [pendingRelation, setPendingRelation] = useState<{
    sourceId: string;
    type: RelationType;
  } | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(
    null
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Form Data (Generic for both modes)
  const [formData, setFormData] = useState({
    name: "",
    gender: "male" as Gender,
    birth: "",
    death: "",
    role: "",
    dept: "",
  });

  // Refs
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem(
      "dashboard_tree_builder",
      JSON.stringify({ mode: treeMode, nodes, relationships })
    );
  }, [treeMode, nodes, relationships]);

  // --- HELPERS ---
  const config = getModeConfig(treeMode);

  // --- ACTIONS: EXPORT / IMPORT ---
  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify({ mode: treeMode, nodes, relationships })
      );
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `${treeMode}_tree.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setShowIOMenu(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.nodes) {
          setTreeMode(data.mode || "family"); // Restore mode
          setNodes(data.nodes);
          setRelationships(data.relationships || []);
          setTimeout(() => handleCenterView(data.nodes), 100);
        }
      } catch (err) {
        alert("Invalid file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowIOMenu(false);
  };

  const handleExportImage = () => {
    if (!canvasRef.current) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    if (nodes.length === 0) {
      minX = 0;
      minY = 0;
      maxX = 1000;
      maxY = 1000;
    } else {
      nodes.forEach((p) => {
        if (p.position.x < minX) minX = p.position.x;
        if (p.position.y < minY) minY = p.position.y;
        if (p.position.x + config.nodeWidth > maxX)
          maxX = p.position.x + config.nodeWidth;
        if (p.position.y + config.nodeHeight > maxY)
          maxY = p.position.y + config.nodeHeight;
      });
    }
    const padding = 100;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

    const svgOriginal = canvasRef.current.querySelector("svg");
    const svgString = svgOriginal
      ? new XMLSerializer().serializeToString(svgOriginal)
      : "";

    let htmlContent = "";
    nodes.forEach((p) => {
      // Render HTML for SVG foreignObject based on Mode
      const isOrg = treeMode === "org";
      const borderColor = isOrg
        ? "#3b82f6"
        : p.gender === "male"
        ? "#3b82f6"
        : "#ec4899";
      const headerColor = isOrg
        ? "linear-gradient(to right, #1e293b, #334155)"
        : p.gender === "male"
        ? "#3b82f6"
        : "#ec4899";
      const iconContent = isOrg ? p.name.charAt(0) : p.name.charAt(0);

      htmlContent += `
            <div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute; left:${
              p.position.x
            }px; top:${p.position.y}px; width:${config.nodeWidth}px; height:${
        config.nodeHeight
      }px; background-color:#1e1e1e; border:2px solid ${borderColor}; border-radius:12px; overflow:hidden; font-family:sans-serif; box-sizing:border-box;">
                <div style="height:6px; width:100%; background: ${headerColor};"></div>
                <div style="display:flex; padding:12px; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:${
                      isOrg ? "8px" : "50%"
                    }; background: #334155; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:18px;">${iconContent}</div>
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:bold; color:white; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${
                          p.name
                        }</div>
                        <div style="font-size:10px; color:#94a3b8; margin-top:2px;">${
                          isOrg ? p.role || "Staff" : p.birthYear || "?"
                        }</div>
                    </div>
                </div>
            </div>
          `;
    });

    const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><style>.animate-pulse { animation: none; }</style>${svgString.replace(
      /<svg[^>]*>|<\/svg>/g,
      ""
    )}<foreignObject x="${minX - padding}" y="${
      minY - padding
    }" width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; position:relative;">${htmlContent}</div></foreignObject></svg>`;
    const imgData =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(finalSvg);
    const anchor = document.createElement("a");
    anchor.setAttribute("href", imgData);
    anchor.setAttribute("download", `${treeMode}_chart.svg`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setShowIOMenu(false);
  };

  // --- ACTIONS: SWITCH MODE ---
  const handleSwitchMode = (newMode: TreeMode) => {
    if (
      nodes.length > 1 &&
      !confirm("Switching mode might make existing data look weird. Continue?")
    )
      return;
    setTreeMode(newMode);
    setShowModeMenu(false);
  };

  // --- ACTIONS: NODES & RELATIONS ---
  const handleSaveNode = () => {
    if (!formData.name.trim()) return;
    let newNodeId = editingNode?.id || Date.now().toString();

    const nodeData: TreeNode = {
      id: newNodeId,
      name: formData.name,
      position: {
        x:
          (canvasRef.current
            ? (canvasRef.current.clientWidth / 2 - offset.x) / scale
            : 400) - 100,
        y:
          (canvasRef.current
            ? (canvasRef.current.clientHeight / 2 - offset.y) / scale
            : 300) - 40,
      },
    };

    // Fill data based on mode
    if (treeMode === "family") {
      nodeData.gender = formData.gender;
      nodeData.birthYear = formData.birth;
      nodeData.deathYear = formData.death;
    } else {
      nodeData.role = formData.role;
      nodeData.department = formData.dept;
    }

    if (editingNode) {
      // Keep position
      nodeData.position = editingNode.position;
      setNodes((prev) =>
        prev.map((n) => (n.id === editingNode.id ? nodeData : n))
      );
    } else {
      // Smart Positioning for New Node
      if (pendingRelation) {
        const source = nodes.find((n) => n.id === pendingRelation.sourceId);
        if (source) {
          if (pendingRelation.type === "spouse") {
            // Beside
            nodeData.position = {
              x: source.position.x + config.nodeWidth + 50,
              y: source.position.y,
            };
          } else {
            // Below (Child/Subordinate)
            nodeData.position = {
              x: source.position.x,
              y: source.position.y + config.nodeHeight + 80,
            };
          }
        }
      }
      setNodes((prev) => [...prev, nodeData]);

      if (pendingRelation) {
        setRelationships((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sourceId: pendingRelation.sourceId,
            targetId: newNodeId,
            type: pendingRelation.type,
          },
        ]);
      }
    }
    setShowNodeModal(false);
    setPendingRelation(null);
  };

  const handleDeleteNode = (id: string) => {
    if (!confirm("Delete this node?")) return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setRelationships((prev) =>
      prev.filter((r) => r.sourceId !== id && r.targetId !== id)
    );
    setContextMenu(null);
  };

  const handleOpenModal = (
    node?: TreeNode,
    relationSource?: { id: string; type: RelationType }
  ) => {
    if (node) {
      setEditingNode(node);
      setFormData({
        name: node.name,
        gender: node.gender || "male",
        birth: node.birthYear || "",
        death: node.deathYear || "",
        role: node.role || "",
        dept: node.department || "",
      });
    } else {
      setEditingNode(null);
      // Auto guess gender for spouse
      let defaultGender: Gender = "male";
      if (
        treeMode === "family" &&
        relationSource &&
        relationSource.type === "spouse"
      ) {
        const source = nodes.find((n) => n.id === relationSource.id);
        if (source)
          defaultGender = source.gender === "male" ? "female" : "male";
      }
      setFormData({
        name: "",
        gender: defaultGender,
        birth: "",
        death: "",
        role: "",
        dept: "",
      });
      if (relationSource)
        setPendingRelation({
          sourceId: relationSource.id,
          type: relationSource.type,
        });
    }
    setShowNodeModal(true);
    setContextMenu(null);
  };

  const handleCenterView = (targetNodes = nodes) => {
    if (targetNodes.length === 0) return;
    const xs = targetNodes.map((p) => p.position.x);
    const ys = targetNodes.map((p) => p.position.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);

    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      const cx = minX + (maxX - minX) / 2 + config.nodeWidth / 2;
      const cy = minY + (maxY - minY) / 2 + config.nodeHeight / 2;
      setOffset({ x: width / 2 - cx * scale, y: height / 2 - cy * scale });
    }
  };

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent, nodeId?: string) => {
    if (e.button === 2) return;
    if (nodeId) {
      e.stopPropagation();
      setDraggingNodeId(nodeId);
    } else {
      setIsDraggingCanvas(true);
      setConnectingSourceId(null);
      setContextMenu(null);
      setShowIOMenu(false);
      setShowModeMenu(false);
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale,
      });
    }
    if (draggingNodeId) {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
            : n
        )
      );
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    } else if (isDraggingCanvas) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (targetId?: string, e?: React.MouseEvent) => {
    if (connectingSourceId && targetId && connectingSourceId !== targetId) {
      e?.stopPropagation();
      // Logic tạo relation dựa trên Mode
      let type: RelationType = "child";
      if (treeMode === "family") {
        type = confirm("Create SPOUSE connection? (Cancel for CHILD)")
          ? "spouse"
          : "child";
      } else {
        type = "subordinate"; // Org chart mặc định là quản lý -> nhân viên
      }
      setRelationships((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sourceId: connectingSourceId,
          targetId,
          type,
        },
      ]);
      setConnectingSourceId(null);
    }
    setDraggingNodeId(null);
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.001;
    setScale((prev) =>
      parseFloat(Math.min(Math.max(prev + delta, 0.2), 3).toFixed(2))
    );
  };

  // --- RENDER PATHS ---
  const getPath = (r: Relationship) => {
    const source = nodes.find((n) => n.id === r.sourceId);
    const target = nodes.find((n) => n.id === r.targetId);
    if (!source || !target) return "";

    const sx = source.position.x + config.nodeWidth / 2;
    const sy = source.position.y + config.nodeHeight / 2;
    const tx = target.position.x + config.nodeWidth / 2;
    const ty = target.position.y + config.nodeHeight / 2;

    // 1. FAMILY MODE PATHS
    if (treeMode === "family") {
      if (r.type === "spouse") {
        return `M ${sx} ${sy} C ${sx + 50} ${sy} ${tx - 50} ${ty} ${tx} ${ty}`;
      } else {
        // Tìm điểm giữa cha mẹ
        let startX = sx;
        let startY = source.position.y + config.nodeHeight;

        const spouseRel = relationships.find(
          (rel) =>
            rel.type === "spouse" &&
            (rel.sourceId === r.sourceId || rel.targetId === r.sourceId)
        );
        if (spouseRel) {
          const spouseId =
            spouseRel.sourceId === r.sourceId
              ? spouseRel.targetId
              : spouseRel.sourceId;
          const spouse = nodes.find((n) => n.id === spouseId);
          if (spouse) {
            startX =
              (source.position.x + spouse.position.x) / 2 +
              config.nodeWidth / 2;
            startY =
              (source.position.y + spouse.position.y) / 2 +
              config.nodeHeight / 2;
          }
        }
        return `M ${startX} ${startY} L ${startX} ${startY + 30} C ${startX} ${
          startY + 80
        } ${tx} ${target.position.y - 50} ${tx} ${target.position.y}`;
      }
    }

    // 2. ORG CHART MODE PATHS (Orthogonal)
    else {
      // Manager (Bottom) -> Subordinate (Top)
      const startY = source.position.y + config.nodeHeight;
      const endY = target.position.y;
      const midY = startY + (endY - startY) / 2;
      return `M ${sx} ${startY} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${endY}`;
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* TOOLBAR */}
      <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className={`font-bold flex items-center gap-2 px-2 py-1 rounded hover:bg-[#3e3e42] ${config.color}`}
            >
              <config.icon size={20} />
              <span className="hidden sm:inline">{config.label}</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
            {/* MODE SELECTOR */}
            {showModeMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowModeMenu(false)}
                ></div>
                <div className="absolute left-0 top-full mt-2 w-40 bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl z-40 overflow-hidden p-1 flex flex-col animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => handleSwitchMode("family")}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-[#3e3e42] hover:text-white rounded-lg text-left"
                  >
                    <Users size={14} className="text-pink-500" /> Genealogy
                  </button>
                  <button
                    onClick={() => handleSwitchMode("org")}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-[#3e3e42] hover:text-white rounded-lg text-left"
                  >
                    <Building2 size={14} className="text-blue-500" /> Org Chart
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative w-32 md:w-48 hidden sm:block">
            <Search
              size={14}
              className="absolute left-2 top-2 text-slate-500"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-lg pl-8 pr-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow sm:flex"
          >
            <Plus size={14} /> Add Node
          </button>
          <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#3e3e42]">
            <button
              onClick={() => setScale((s) => Math.max(0.2, s - 0.1))}
              className="p-1.5 hover:bg-[#2d2d2d] rounded"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.1))}
              className="p-1.5 hover:bg-[#2d2d2d] rounded"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={() => handleCenterView()}
            className="p-2 hover:bg-[#2d2d2d] rounded-lg border border-transparent hover:border-[#3e3e42]"
            title="Center View"
          >
            <Maximize size={16} />
          </button>

          <div className="h-6 w-px bg-[#3e3e42] mx-1"></div>

          <div className="relative">
            <button
              onClick={() => setShowIOMenu(!showIOMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                showIOMenu
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-[#1e1e1e] border-[#3e3e42] text-slate-300 hover:text-white"
              }`}
            >
              <MoreHorizontal size={14} /> Data
            </button>
            {showIOMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowIOMenu(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl z-40 overflow-hidden p-1 flex flex-col animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#3e3e42] hover:text-white rounded-lg text-left"
                  >
                    <Upload size={14} className="text-green-500" /> Import JSON
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#3e3e42] hover:text-white rounded-lg text-left"
                  >
                    <FileJson size={14} className="text-yellow-500" /> Export
                    JSON
                  </button>
                  <button
                    onClick={handleExportImage}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#3e3e42] hover:text-white rounded-lg text-left"
                  >
                    <ImageIcon size={14} className="text-pink-500" /> Export
                    Image
                  </button>
                </div>
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImportJSON}
          />
        </div>
      </div>

      {/* CANVAS */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-[#121212]"
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={() => handleMouseUp()}
        onMouseLeave={() => handleMouseUp()}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(#666 1px, transparent 1px)",
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
          }}
        />

        <div
          className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            width: "100%",
            height: "100%",
          }}
        >
          {/* 1. CONNECTIONS */}
          <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible z-0">
            {relationships.map((rel) => {
              const isSpouse = rel.type === "spouse";
              const color =
                treeMode === "org"
                  ? "#64748b"
                  : isSpouse
                  ? "#ec4899"
                  : "#3b82f6";
              const strokeWidth = treeMode === "org" ? 1.5 : 2;
              return (
                <g
                  key={rel.id}
                  className="pointer-events-auto cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete link?"))
                      setRelationships((prev) =>
                        prev.filter((r) => r.id !== rel.id)
                      );
                  }}
                >
                  <path
                    d={getPath(rel)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                  />
                  <path
                    d={getPath(rel)}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isSpouse ? "0" : "0"}
                    className="opacity-80 group-hover:opacity-100 group-hover:stroke-width-3 transition-all"
                  />
                  {isSpouse && treeMode === "family" && (
                    <foreignObject
                      x={
                        (nodes.find((n) => n.id === rel.sourceId)!.position.x +
                          nodes.find((n) => n.id === rel.targetId)!.position
                            .x) /
                          2 +
                        config.nodeWidth / 2 -
                        10
                      }
                      y={
                        (nodes.find((n) => n.id === rel.sourceId)!.position.y +
                          nodes.find((n) => n.id === rel.targetId)!.position
                            .y) /
                          2 +
                        config.nodeHeight / 2 -
                        10
                      }
                      width="20"
                      height="20"
                    >
                      <div className="w-5 h-5 bg-[#121212] rounded-full flex items-center justify-center border border-pink-500 shadow-lg z-20 relative">
                        <Heart
                          size={10}
                          className="text-pink-500 fill-pink-500"
                        />
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
            {connectingSourceId && (
              <line
                x1={
                  nodes.find((n) => n.id === connectingSourceId)!.position.x +
                  config.nodeWidth / 2
                }
                y1={
                  nodes.find((n) => n.id === connectingSourceId)!.position.y +
                  config.nodeHeight / 2
                }
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#fff"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* 2. NODES */}
          {nodes.map((node) => {
            const isMatch =
              searchQuery &&
              node.name.toLowerCase().includes(searchQuery.toLowerCase());
            const isOrg = treeMode === "org";
            const borderColor = isOrg
              ? "border-slate-500/50"
              : node.gender === "male"
              ? "border-blue-500/50"
              : "border-pink-500/50";
            const headerColor = isOrg
              ? "bg-slate-700"
              : node.gender === "male"
              ? "bg-blue-500"
              : "bg-pink-500";
            const avatarGradient = isOrg
              ? "bg-slate-700"
              : node.gender === "male"
              ? "bg-gradient-to-br from-blue-600 to-cyan-500"
              : "bg-gradient-to-br from-pink-600 to-rose-500";

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onMouseUp={(e) => handleMouseUp(node.id, e)}
                onContextMenu={(e) => handleContextMenu(e, node.id)}
                className={`
                            absolute bg-[#1e1e1e] rounded-xl shadow-lg flex flex-col z-10 border-2 select-none group transition-all overflow-hidden
                            ${borderColor}
                            ${
                              draggingNodeId === node.id
                                ? "cursor-grabbing scale-105 shadow-2xl z-50"
                                : "cursor-grab"
                            }
                            ${
                              isMatch
                                ? "ring-4 ring-yellow-500 scale-110 z-50"
                                : ""
                            }
                        `}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: config.nodeWidth,
                  height: config.nodeHeight,
                }}
              >
                <div className={`h-1.5 w-full ${headerColor}`}></div>
                <div className="flex-1 p-3 flex items-center gap-3 relative">
                  <div
                    className={`w-10 h-10 ${
                      isOrg ? "rounded-lg" : "rounded-full"
                    } flex items-center justify-center text-white font-bold text-lg ${avatarGradient} shadow-inner`}
                  >
                    {isOrg ? (
                      <User size={20} />
                    ) : (
                      node.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {node.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5 truncate">
                      {isOrg ? (
                        node.role || "Staff"
                      ) : (
                        <>
                          <Calendar size={10} /> {node.birthYear || "?"} —{" "}
                          {node.deathYear || "?"}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setConnectingSourceId(node.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-green-400 hover:bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl w-44 overflow-hidden py-1 animate-in fade-in zoom-in-95"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {treeMode === "family" ? (
            <>
              <button
                onClick={() =>
                  handleOpenModal(undefined, {
                    id: contextMenu.nodeId,
                    type: "spouse",
                  })
                }
                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Heart size={14} className="text-pink-500" /> Add Spouse
              </button>
              <button
                onClick={() =>
                  handleOpenModal(undefined, {
                    id: contextMenu.nodeId,
                    type: "child",
                  })
                }
                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <GitFork size={14} className="text-blue-500" /> Add Child
              </button>
            </>
          ) : (
            <button
              onClick={() =>
                handleOpenModal(undefined, {
                  id: contextMenu.nodeId,
                  type: "subordinate",
                })
              }
              className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-2"
            >
              <GitFork size={14} className="text-blue-500" /> Add Subordinate
            </button>
          )}
          <div className="h-px bg-[#3e3e42] my-1 mx-2"></div>
          <button
            onClick={() => {
              handleOpenModal(nodes.find((n) => n.id === contextMenu.nodeId));
            }}
            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#3e3e42] flex items-center gap-2"
          >
            <Edit2 size={14} /> Edit Info
          </button>
          <button
            onClick={() => handleDeleteNode(contextMenu.nodeId)}
            className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        ></div>
      )}

      {/* MODAL */}
      {showNodeModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#252526] border border-[#3e3e42] rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <config.icon size={20} className={config.color} />
              {editingNode ? "Edit Details" : "Add New Node"}
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Name
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  autoFocus
                  placeholder="Name..."
                />
              </div>

              {treeMode === "family" ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Gender
                    </label>
                    <div className="flex bg-[#1e1e1e] rounded-xl p-1 border border-[#3e3e42]">
                      <button
                        onClick={() =>
                          setFormData({ ...formData, gender: "male" })
                        }
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          formData.gender === "male"
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Male
                      </button>
                      <button
                        onClick={() =>
                          setFormData({ ...formData, gender: "female" })
                        }
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          formData.gender === "female"
                            ? "bg-pink-600 text-white shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Birth
                      </label>
                      <input
                        value={formData.birth}
                        onChange={(e) =>
                          setFormData({ ...formData, birth: e.target.value })
                        }
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                        placeholder="1990"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Death
                      </label>
                      <input
                        value={formData.death}
                        onChange={(e) =>
                          setFormData({ ...formData, death: e.target.value })
                        }
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                        placeholder="—"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Role / Job Title
                    </label>
                    <input
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                      placeholder="e.g. Manager"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Department
                    </label>
                    <input
                      value={formData.dept}
                      onChange={(e) =>
                        setFormData({ ...formData, dept: e.target.value })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                      placeholder="e.g. Sales"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowNodeModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#3e3e42] text-white text-xs font-bold hover:bg-[#4e4e52] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNode}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
