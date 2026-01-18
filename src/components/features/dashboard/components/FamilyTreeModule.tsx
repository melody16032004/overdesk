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
} from "lucide-react";

// --- TYPES ---
type Gender = "male" | "female";
type RelationType = "spouse" | "child";

interface Person {
  id: string;
  name: string;
  gender: Gender;
  birthYear?: string;
  deathYear?: string;
  position: { x: number; y: number };
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
}

interface FamilyData {
  people: Person[];
  relationships: Relationship[];
}

// --- HELPER: COLOR & STYLE ---
const getGenderColor = (g: Gender) =>
  g === "male" ? "from-blue-500 to-cyan-500" : "from-pink-500 to-rose-500";
const getGenderBorder = (g: Gender) =>
  g === "male" ? "border-blue-500/30" : "border-pink-500/30";

// --- INITIAL DATA ---
const INITIAL_DATA: FamilyData = {
  people: [
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
export const FamilyTreeModule = () => {
  // --- STATE ---

  // 1. LAZY INIT (Fix lỗi F5 mất dữ liệu)
  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_family_tree");
      return saved ? JSON.parse(saved).people : INITIAL_DATA.people;
    } catch (e) {
      return INITIAL_DATA.people;
    }
  });

  const [relationships, setRelationships] = useState<Relationship[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_family_tree");
      return saved
        ? JSON.parse(saved).relationships
        : INITIAL_DATA.relationships;
    } catch (e) {
      return INITIAL_DATA.relationships;
    }
  });

  // View State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Menu & Modal State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    personId: string;
  } | null>(null);
  const [showIOMenu, setShowIOMenu] = useState(false); // Menu Import/Export
  const [showPersonModal, setShowPersonModal] = useState(false);

  // Logic State
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [pendingRelation, setPendingRelation] = useState<{
    sourceId: string;
    type: RelationType;
  } | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(
    null
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [formData, setFormData] = useState<{
    name: string;
    gender: Gender;
    birth: string;
    death: string;
  }>({
    name: "",
    gender: "male",
    birth: "",
    death: "",
  });

  // Refs
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem(
      "dashboard_family_tree",
      JSON.stringify({ people, relationships })
    );
  }, [people, relationships]);

  // --- ACTIONS: EXPORT / IMPORT ---

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ people, relationships }));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "family_tree.json");
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
        if (data.people && data.relationships) {
          setPeople(data.people);
          setRelationships(data.relationships);
          setTimeout(() => handleCenterView(data.people), 100);
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
    // Logic xuất ảnh SVG từ HTML (tương tự module ERD)
    if (!canvasRef.current) return;

    // Tính vùng bao (Bounding Box)
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    if (people.length === 0) {
      minX = 0;
      minY = 0;
      maxX = 1000;
      maxY = 1000;
    } else {
      people.forEach((p) => {
        if (p.position.x < minX) minX = p.position.x;
        if (p.position.y < minY) minY = p.position.y;
        if (p.position.x + 200 > maxX) maxX = p.position.x + 200; // 200 = width card
        if (p.position.y + 80 > maxY) maxY = p.position.y + 80; // 80 = height card
      });
    }

    const padding = 100;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

    // Clone SVG gốc (chứa dây nối)
    const svgOriginal = canvasRef.current.querySelector("svg");
    const svgString = svgOriginal
      ? new XMLSerializer().serializeToString(svgOriginal)
      : "";

    // Tạo nội dung HTML cho các thẻ người
    let htmlContent = "";
    people.forEach((p) => {
      // Inline style cực kỳ quan trọng cho foreignObject
      htmlContent += `
            <div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute; left:${
              p.position.x
            }px; top:${
        p.position.y
      }px; width:200px; height:80px; background-color:#1e1e1e; border:2px solid ${
        p.gender === "male" ? "rgba(59,130,246,0.5)" : "rgba(236,72,153,0.5)"
      }; border-radius:12px; overflow:hidden; font-family:sans-serif; box-sizing:border-box;">
                <div style="height:6px; width:100%; background: linear-gradient(to right, ${
                  p.gender === "male" ? "#3b82f6, #06b6d4" : "#ec4899, #f43f5e"
                });"></div>
                <div style="display:flex; padding:12px; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:50%; background: linear-gradient(to bottom right, ${
                      p.gender === "male"
                        ? "#2563eb, #06b6d4"
                        : "#db2777, #e11d48"
                    }); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:18px;">${p.name
        .charAt(0)
        .toUpperCase()}</div>
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:bold; color:white; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${
                          p.name
                        }</div>
                        <div style="font-size:10px; color:#94a3b8; margin-top:2px;">${
                          p.birthYear || "?"
                        } — ${p.deathYear || "?"}</div>
                    </div>
                </div>
            </div>
          `;
    });

    // Ghép thành file SVG hoàn chỉnh
    const finalSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
            <style>.animate-pulse { animation: none; }</style>
            ${svgString.replace(/<svg[^>]*>|<\/svg>/g, "")}
            <foreignObject x="${minX - padding}" y="${
      minY - padding
    }" width="${width}" height="${height}">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; position:relative;">
                    ${htmlContent}
                </div>
            </foreignObject>
        </svg>
      `;

    const imgData =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(finalSvg);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", imgData);
    downloadAnchorNode.setAttribute("download", `family_tree.svg`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowIOMenu(false);
  };

  // --- SMART LAYOUT ---
  const handleCenterView = (targetPeople = people) => {
    if (targetPeople.length === 0) return;
    const xs = targetPeople.map((p) => p.position.x);
    const ys = targetPeople.map((p) => p.position.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);

    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      const cx = minX + (maxX - minX) / 2 + 100;
      const cy = minY + (maxY - minY) / 2 + 40;
      setOffset({ x: width / 2 - cx * scale, y: height / 2 - cy * scale });
    }
  };

  //   const handleOrganizeTree = () => {
  //     // (Simple Auto Layout Logic - Placeholder for future expansion)
  //     handleCenterView();
  //   };

  // --- ACTIONS: PERSON & RELATION ---
  const handleSavePerson = () => {
    if (!formData.name.trim()) return;
    let newPersonId = editingPerson?.id || Date.now().toString();

    if (editingPerson) {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === editingPerson.id
            ? {
                ...p,
                name: formData.name,
                gender: formData.gender,
                birthYear: formData.birth,
                deathYear: formData.death,
              }
            : p
        )
      );
    } else {
      const newPerson: Person = {
        id: newPersonId,
        name: formData.name,
        gender: formData.gender,
        birthYear: formData.birth,
        deathYear: formData.death,
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

      // Smart positioning
      if (pendingRelation) {
        const source = people.find((p) => p.id === pendingRelation.sourceId);
        if (source) {
          if (pendingRelation.type === "spouse") {
            newPerson.position = {
              x: source.position.x + 250,
              y: source.position.y,
            };
          } else {
            newPerson.position = {
              x: source.position.x,
              y: source.position.y + 200,
            };
          }
        }
      }
      setPeople((prev) => [...prev, newPerson]);

      if (pendingRelation) {
        const newRel: Relationship = {
          id: Date.now().toString(),
          sourceId: pendingRelation.sourceId,
          targetId: newPersonId,
          type: pendingRelation.type,
        };
        setRelationships((prev) => [...prev, newRel]);
      }
    }
    setShowPersonModal(false);
    setPendingRelation(null);
  };

  const handleDeletePerson = (id: string) => {
    if (!confirm("Delete this person?")) return;
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setRelationships((prev) =>
      prev.filter((r) => r.sourceId !== id && r.targetId !== id)
    );
    setContextMenu(null);
  };

  const handleOpenModal = (
    person?: Person,
    relationSource?: { id: string; type: RelationType }
  ) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        name: person.name,
        gender: person.gender,
        birth: person.birthYear || "",
        death: person.deathYear || "",
      });
    } else {
      setEditingPerson(null);
      let defaultGender: Gender = "male";
      if (relationSource) {
        const source = people.find((p) => p.id === relationSource.id);
        if (source && relationSource.type === "spouse") {
          defaultGender = source.gender === "male" ? "female" : "male";
        }
      }
      setFormData({ name: "", gender: defaultGender, birth: "", death: "" });
      if (relationSource)
        setPendingRelation({
          sourceId: relationSource.id,
          type: relationSource.type,
        });
    }
    setShowPersonModal(true);
    setContextMenu(null);
  };

  // --- MOUSE & WHEEL HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent, personId?: string) => {
    if (e.button === 2) return;
    if (personId) {
      e.stopPropagation();
      setDraggingPersonId(personId);
    } else {
      setIsDraggingCanvas(true);
      setConnectingSourceId(null);
      setContextMenu(null);
      setShowIOMenu(false);
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleContextMenu = (e: React.MouseEvent, personId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, personId });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale,
      });
    }
    if (draggingPersonId) {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;
      setPeople((prev) =>
        prev.map((p) =>
          p.id === draggingPersonId
            ? { ...p, position: { x: p.position.x + dx, y: p.position.y + dy } }
            : p
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
      const type = confirm("Create SPOUSE connection? (Cancel for CHILD)")
        ? "spouse"
        : "child";
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
    setDraggingPersonId(null);
    setIsDraggingCanvas(false);
  };

  // ZOOM WHEEL
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    // Zoom logic
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    setScale((prev) =>
      parseFloat(Math.min(Math.max(prev + delta, 0.2), 3).toFixed(2))
    );
  };

  // --- RENDER PATHS ---
  const getPath = (r: Relationship) => {
    const source = people.find((p) => p.id === r.sourceId);
    const target = people.find((p) => p.id === r.targetId);
    if (!source || !target) return "";

    const sx = source.position.x + 100;
    const sy = source.position.y + 40;
    const tx = target.position.x + 100;
    const ty = target.position.y + 40;

    if (r.type === "spouse") {
      return `M ${sx} ${sy} C ${sx + 50} ${sy} ${tx - 50} ${ty} ${tx} ${ty}`;
    } else {
      // Logic tìm điểm giữa cha mẹ để vẽ dây con
      let startX = sx;
      let startY = source.position.y + 80;

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
        const spouse = people.find((p) => p.id === spouseId);
        if (spouse) {
          startX = (source.position.x + spouse.position.x) / 2 + 100;
          startY = (source.position.y + spouse.position.y) / 2 + 40;
        }
      }
      return `M ${startX} ${startY} L ${startX} ${startY + 30} C ${startX} ${
        startY + 80
      } ${tx} ${target.position.y - 50} ${tx} ${target.position.y}`;
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
          <div className="font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-pink-500" />{" "}
            <span className="hidden sm:inline">Genealogy</span>
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
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-lg pl-8 pr-2 py-1 text-xs text-white focus:border-pink-500 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow sm:flex"
          >
            <Plus size={14} /> Add
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

          {/* IO MENU */}
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
        onWheel={handleWheel} // ADDED ZOOM WHEEL
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
              const color = isSpouse ? "#ec4899" : "#3b82f6";
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
                    strokeWidth="2"
                    strokeDasharray={isSpouse ? "0" : "0"}
                    className="opacity-80 group-hover:opacity-100 group-hover:stroke-width-3 transition-all"
                  />
                  {isSpouse && (
                    <foreignObject
                      x={
                        (people.find((p) => p.id === rel.sourceId)!.position.x +
                          people.find((p) => p.id === rel.targetId)!.position
                            .x) /
                          2 +
                        100 -
                        10
                      }
                      y={
                        (people.find((p) => p.id === rel.sourceId)!.position.y +
                          people.find((p) => p.id === rel.targetId)!.position
                            .y) /
                          2 +
                        40 -
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
                  people.find((p) => p.id === connectingSourceId)!.position.x +
                  100
                }
                y1={
                  people.find((p) => p.id === connectingSourceId)!.position.y +
                  40
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

          {/* 2. PEOPLE CARDS */}
          {people.map((person) => {
            const isMatch =
              searchQuery &&
              person.name.toLowerCase().includes(searchQuery.toLowerCase());
            return (
              <div
                key={person.id}
                onMouseDown={(e) => handleMouseDown(e, person.id)}
                onMouseUp={(e) => handleMouseUp(person.id, e)}
                onContextMenu={(e) => handleContextMenu(e, person.id)}
                className={`
                            absolute w-[200px] h-[80px] bg-[#1e1e1e] rounded-xl shadow-lg flex flex-col z-10 border-2 select-none group transition-all overflow-hidden
                            ${getGenderBorder(person.gender)}
                            ${
                              draggingPersonId === person.id
                                ? "cursor-grabbing scale-105 shadow-2xl z-50"
                                : "cursor-grab"
                            }
                            ${
                              isMatch
                                ? "ring-4 ring-yellow-500 scale-110 z-50"
                                : ""
                            }
                        `}
                style={{ left: person.position.x, top: person.position.y }}
              >
                <div
                  className={`h-1 w-full bg-gradient-to-r ${getGenderColor(
                    person.gender
                  )}`}
                ></div>
                <div className="flex-1 p-3 flex items-center gap-3 relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getGenderColor(
                      person.gender
                    )} shadow-inner`}
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {person.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                      <Calendar size={10} /> {person.birthYear || "?"} —{" "}
                      {person.deathYear || "?"}
                    </div>
                  </div>
                  <button
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setConnectingSourceId(person.id);
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
          className="fixed z-50 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl w-40 overflow-hidden py-1 animate-in fade-in zoom-in-95"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() =>
              handleOpenModal(undefined, {
                id: contextMenu.personId,
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
                id: contextMenu.personId,
                type: "child",
              })
            }
            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-2"
          >
            <GitFork size={14} className="text-blue-500" /> Add Child
          </button>
          <div className="h-px bg-[#3e3e42] my-1 mx-2"></div>
          <button
            onClick={() => {
              handleOpenModal(
                people.find((p) => p.id === contextMenu.personId)
              );
            }}
            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#3e3e42] flex items-center gap-2"
          >
            <Edit2 size={14} /> Edit Info
          </button>
          <button
            onClick={() => handleDeletePerson(contextMenu.personId)}
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
      {showPersonModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#252526] border border-[#3e3e42] rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" />
              {editingPerson
                ? "Edit Profile"
                : pendingRelation
                ? pendingRelation.type === "spouse"
                  ? "Add Spouse"
                  : "Add Child"
                : "Add Person"}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Full Name
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  autoFocus
                  placeholder="e.g. Nguyen Van A"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Gender
                </label>
                <div className="flex bg-[#1e1e1e] rounded-xl p-1 border border-[#3e3e42]">
                  <button
                    onClick={() => setFormData({ ...formData, gender: "male" })}
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
                    Birth Year
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
                    Death Year
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
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowPersonModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#3e3e42] text-white text-xs font-bold hover:bg-[#4e4e52] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePerson}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
