import { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  FileSpreadsheet,
  Copy,
  Search,
  PlayCircle,
  LayoutList,
  PanelLeft,
  X,
  AlertTriangle,
  Folder,
  FolderPlus,
  Hash,
  Layers,
  Edit2,
  FileText,
  Briefcase,
  ArrowRightLeft,
  TestTube,
} from "lucide-react";

// --- TYPES ---
type TestStatus = "draft" | "passed" | "failed" | "blocked";
type Priority = "low" | "medium" | "high";

interface Project {
  id: string;
  name: string;
}

interface TestCase {
  id: string;
  code: string;
  projectId: string;
  title: string;
  precondition: string;
  steps: string;
  expected: string;
  actual: string;
  status: TestStatus;
  priority: Priority;
}

// --- CONFIG ---
const STATUS_CONFIG: Record<
  TestStatus,
  { label: string; color: string; icon: any }
> = {
  draft: {
    label: "Draft",
    color: "text-slate-400 bg-slate-800",
    icon: MinusCircle,
  },
  passed: {
    label: "Passed",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    icon: XCircle,
  },
  blocked: {
    label: "Blocked",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: AlertCircle,
  },
};

const PRIORITY_COLORS = {
  low: "text-slate-400",
  medium: "text-blue-400",
  high: "text-rose-500 font-bold",
};

export const TestScriptModule = ({
  onSwitchApp,
}: {
  onSwitchApp?: (appId: string) => void;
}) => {
  // --- STATE INITIALIZATION ---

  // 1. Load Last Session Config (Lấy trạng thái cũ trước)
  const lastSession = (() => {
    try {
      return JSON.parse(localStorage.getItem("test_last_session") || "{}");
    } catch {
      return {};
    }
  })();

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("test_projects") ||
          '[{"id":"main","name":"Main App"}]'
      );
    } catch {
      return [{ id: "main", name: "Main App" }];
    }
  });

  // 2. Init Active Project (Khôi phục project đang chọn)
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const saved = lastSession.projectId;
    if (saved === "all") return "all";
    // Kiểm tra xem project cũ còn tồn tại không, nếu không thì về 'all'
    return projects.some((p) => p.id === saved) ? saved : "all";
  });

  const [cases, setCases] = useState<TestCase[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("test_cases") || "[]");
    } catch {
      return [];
    }
  });

  // 3. Init Selected Case (Khôi phục testcase đang làm dở)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const saved = lastSession.caseId;
    // Kiểm tra xem case cũ còn tồn tại không
    return cases.some((c) => c.id === saved) ? saved : null;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TestStatus | "all">("all");
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type:
      | "delete_case"
      | "add_project"
      | "delete_project"
      | "rename_project"
      | "move_copy"
      | null;
    targetId: string | null;
    inputValue?: string;
    actionType?: "move" | "copy";
  }>({ isOpen: false, type: null, targetId: null });

  const [targetProjectId, setTargetProjectId] = useState<string>("");

  // --- PERSISTENCE & EFFECTS ---
  useEffect(() => {
    localStorage.setItem("test_cases", JSON.stringify(cases));
  }, [cases]);
  useEffect(() => {
    localStorage.setItem("test_projects", JSON.stringify(projects));
  }, [projects]);

  // 4. Save Session Effect (Lưu trạng thái mỗi khi thay đổi)
  useEffect(() => {
    localStorage.setItem(
      "test_last_session",
      JSON.stringify({ projectId: activeProjectId, caseId: selectedId })
    );
  }, [activeProjectId, selectedId]);

  // Auto-select first case ONLY if nothing is selected (Fallback)
  useEffect(() => {
    if (cases.length > 0 && !selectedId) {
      // Chỉ auto-select nếu đang ở project view cụ thể, tránh nhảy loạn khi ở 'all'
      if (activeProjectId !== "all") {
        const firstInProject = cases.find(
          (c) => c.projectId === activeProjectId
        );
        if (firstInProject) setSelectedId(firstInProject.id);
      }
    }
  }, [activeProjectId]); // Bỏ dependency `cases` để tránh auto-jump khi đang gõ

  // Logic lọc
  const filteredCases = cases.filter(
    (c) =>
      (activeProjectId === "all" || c.projectId === activeProjectId) &&
      (c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === "all" || c.status === filterStatus)
  );

  const currentCase = cases.find((c) => c.id === selectedId);

  // --- ACTIONS: CASES ---
  const addNewCase = () => {
    const targetProject =
      activeProjectId === "all" ? projects[0].id : activeProjectId;
    const projectCases = cases.filter((c) => c.projectId === targetProject);
    const nextNum = projectCases.length + 1;

    const newCase: TestCase = {
      id: Date.now().toString(),
      code: `TC-${String(nextNum).padStart(3, "0")}`,
      projectId: targetProject,
      title: "Test Case mới",
      precondition: "",
      steps: "",
      expected: "",
      actual: "",
      status: "draft",
      priority: "medium",
    };
    setCases([newCase, ...cases]);
    setSelectedId(newCase.id);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const updateCase = (field: keyof TestCase, value: any) => {
    if (!selectedId) return;
    setCases((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, [field]: value } : c))
    );
  };

  const cloneCase = () => {
    if (!currentCase) return;
    const cloned: TestCase = {
      ...currentCase,
      id: Date.now().toString(),
      code: `${currentCase.code}-CP`,
      title: `${currentCase.title} (Copy)`,
      status: "draft",
    };
    setCases([cloned, ...cases]);
    setSelectedId(cloned.id);
  };

  // --- MOVE & COPY ---
  const openMoveCopyModal = () => {
    if (!currentCase) return;
    const otherProject = projects.find((p) => p.id !== currentCase.projectId);
    setTargetProjectId(otherProject ? otherProject.id : projects[0].id);
    setModal({
      isOpen: true,
      type: "move_copy",
      targetId: currentCase.id,
      actionType: "copy",
    });
  };

  const handleMoveCopyExecute = () => {
    if (!modal.targetId || !targetProjectId) return;
    const sourceCase = cases.find((c) => c.id === modal.targetId);
    if (!sourceCase) return;

    const targetProjectCases = cases.filter(
      (c) => c.projectId === targetProjectId
    );
    const nextNum = targetProjectCases.length + 1;
    const newCode = `TC-${String(nextNum).padStart(3, "0")}`;

    if (modal.actionType === "copy") {
      const newCase: TestCase = {
        ...sourceCase,
        id: Date.now().toString(),
        projectId: targetProjectId,
        code: newCode,
        title: sourceCase.title,
        status: "draft",
      };
      setCases([newCase, ...cases]);
      setActiveProjectId(targetProjectId);
      setSelectedId(newCase.id);
    } else {
      setCases((prev) =>
        prev.map((c) =>
          c.id === modal.targetId
            ? { ...c, projectId: targetProjectId, code: newCode }
            : c
        )
      );
      setActiveProjectId(targetProjectId);
    }
    setModal({ isOpen: false, type: null, targetId: null });
  };

  // --- PROJECT ACTIONS ---
  const handleProjectAction = () => {
    const { type, inputValue, targetId } = modal;
    if (type === "add_project" && inputValue) {
      const newProj: Project = { id: Date.now().toString(), name: inputValue };
      setProjects([...projects, newProj]);
      setActiveProjectId(newProj.id);
    } else if (type === "rename_project" && targetId && inputValue) {
      setProjects((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, name: inputValue } : p))
      );
    } else if (type === "delete_project" && targetId) {
      if (projects.length <= 1) {
        alert("Phải giữ lại ít nhất 1 dự án!");
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== targetId));
        setCases((prev) => prev.filter((c) => c.projectId !== targetId));
        setActiveProjectId("all");
      }
    } else if (type === "delete_case" && targetId) {
      setCases((prev) => prev.filter((c) => c.id !== targetId));
      if (selectedId === targetId) setSelectedId(null);
    }
    setModal({ isOpen: false, type: null, targetId: null, inputValue: "" });
  };

  // --- EXPORT & HELPER ---
  const exportCSV = () => {
    const header =
      "\uFEFFID,Code,Project,Title,Priority,Status,Precondition,Steps,Expected,Actual\n";
    const rows = filteredCases
      .map((c) => {
        const pName =
          projects.find((p) => p.id === c.projectId)?.name || "Unknown";
        return `"${c.id}","${c.code}","${pName}","${c.title}","${
          c.priority
        }","${c.status}","${c.precondition.replace(
          /\n/g,
          " "
        )}","${c.steps.replace(/\n/g, " ")}","${c.expected.replace(
          /\n/g,
          " "
        )}","${c.actual.replace(/\n/g, " ")}"`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cases_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportExcel = () => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr style="background-color: #f0f0f0;"><th>Code</th><th>Project</th><th>Title</th><th>Priority</th><th>Status</th><th>Pre-condition</th><th>Steps</th><th>Expected</th><th>Actual</th></tr></thead><tbody>`;
    filteredCases.forEach((c) => {
      const pName =
        projects.find((p) => p.id === c.projectId)?.name || "Unknown";
      const statusColor =
        c.status === "passed"
          ? "#d1fae5"
          : c.status === "failed"
          ? "#ffe4e6"
          : "#ffffff";
      const steps = c.steps.replace(
        /\n/g,
        '<br style="mso-data-placement:same-cell;" />'
      );
      const expected = c.expected.replace(
        /\n/g,
        '<br style="mso-data-placement:same-cell;" />'
      );
      html += `<tr><td>${c.code}</td><td>${pName}</td><td>${c.title}</td><td>${c.priority}</td><td style="background-color:${statusColor}">${c.status}</td><td>${c.precondition}</td><td>${steps}</td><td>${expected}</td><td>${c.actual}</td></tr>`;
    });
    html += `</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report.xls`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-4 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            <PanelLeft size={18} />
          </button>
          <div className="p-2 bg-teal-600 rounded-lg text-white shadow-lg hidden sm:block">
            <ClipboardList size={20} />
          </div>
          <div>
            <div className="flex items-end gap-1">
              <h3 className="font-bold text-white text-sm">TestCase Studio</h3>
              <p className="text-[10px] text-slate-400">v0.0</p>
            </div>
            <div className="flex gap-2 text-[10px] text-slate-400">
              <span className="text-teal-400 font-bold">
                {activeProjectId === "all"
                  ? "Tất cả dự án"
                  : projects.find((p) => p.id === activeProjectId)?.name}
              </span>
              <span>• {filteredCases.length} Cases</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSwitchApp && onSwitchApp("tester")}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg transition-all border border-slate-700 sm:flex"
            title="Test Studio"
          >
            <TestTube size={18} />
          </button>
          <button
            onClick={exportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700 sm:flex"
            title="Xuất CSV"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={exportExcel}
            className="p-2 bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-400 rounded-lg transition-all border border-emerald-700/50 sm:flex"
            title="Xuất Excel"
          >
            <FileSpreadsheet size={18} />
          </button>
          <button
            onClick={addNewCase}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={16} />{" "}
            <span className="hidden sm:inline">Thêm Case</span>
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {showSidebar && (
          <div
            className="absolute inset-0 bg-black/60 z-30 backdrop-blur-sm md:hidden"
            onClick={() => setShowSidebar(false)}
          ></div>
        )}

        {/* LEFT: SIDEBAR */}
        <div
          className={`absolute md:static inset-y-0 left-0 z-40 w-80 bg-[#1e293b] border-r border-slate-800 flex flex-col transition-transform duration-300 ${
            showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          {/* PROJECT TABS */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Folder size={12} /> Projects
              </span>
              <button
                onClick={() =>
                  setModal({
                    isOpen: true,
                    type: "add_project",
                    targetId: null,
                    inputValue: "",
                  })
                }
                className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
              <button
                onClick={() => setActiveProjectId("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${
                  activeProjectId === "all"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                    : "bg-slate-800 border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers size={10} /> Tất cả
              </button>
              {projects.map((p) => (
                <div key={p.id} className="relative group shrink-0">
                  <button
                    onClick={() => setActiveProjectId(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      activeProjectId === p.id
                        ? "bg-teal-600/20 border-teal-500 text-teal-400"
                        : "bg-slate-800 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p.name}
                  </button>
                  <div className="absolute -top-2 -right-1 hidden group-hover:flex gap-0.5 bg-black/50 rounded-full backdrop-blur-md p-0.5 border border-slate-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({
                          isOpen: true,
                          type: "rename_project",
                          targetId: p.id,
                          inputValue: p.name,
                        });
                      }}
                      className="p-1 text-indigo-400 hover:bg-indigo-900 rounded-full"
                    >
                      <Edit2 size={8} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({
                          isOpen: true,
                          type: "delete_project",
                          targetId: p.id,
                        });
                      }}
                      className="p-1 text-rose-400 hover:bg-rose-900 rounded-full"
                    >
                      <X size={8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIST */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-2.5 text-slate-500"
              />
              <input
                type="text"
                placeholder="Tìm ID hoặc Tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
              {(["all", "draft", "passed", "failed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-1 rounded text-[10px] uppercase font-bold whitespace-nowrap transition-all ${
                    filterStatus === st
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`group p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-800 relative ${
                  selectedId === c.id
                    ? "bg-slate-800 border-indigo-500/50 shadow-md"
                    : "bg-transparent border-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 rounded">
                      {c.code}
                    </span>
                    {activeProjectId === "all" && (
                      <span className="text-[9px] text-slate-500 bg-slate-900 px-1 rounded flex items-center gap-0.5">
                        <Briefcase size={8} />{" "}
                        {projects
                          .find((p) => p.id === c.projectId)
                          ?.name.slice(0, 5)}
                        ..
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      PRIORITY_COLORS[c.priority]
                    }`}
                  >
                    {c.priority}
                  </span>
                </div>
                <h4
                  className={`text-xs font-medium line-clamp-2 mb-1 ${
                    selectedId === c.id
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {c.title}
                </h4>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    STATUS_CONFIG[c.status].color
                  } border`}
                >
                  {c.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({
                      isOpen: true,
                      type: "delete_case",
                      targetId: c.id,
                    });
                  }}
                  className="absolute right-2 bottom-2 p-1.5 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-slate-900/80 rounded-lg"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {filteredCases.length === 0 && (
              <div className="text-center py-10 text-slate-600 text-xs">
                Chưa có Test Case nào.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: EDITOR */}
        <div className="flex-1 flex flex-col bg-[#0f172a] min-w-0">
          {currentCase ? (
            <>
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-[#1e293b]/30">
                <div className="flex items-center gap-2 flex-1 w-full">
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 shrink-0">
                    <Hash size={14} className="text-slate-500" />
                    <input
                      value={currentCase.code}
                      onChange={(e) => updateCase("code", e.target.value)}
                      className="w-20 bg-transparent text-xs font-mono font-bold text-indigo-400 outline-none uppercase"
                      placeholder="ID"
                    />
                  </div>
                  <input
                    value={currentCase.title}
                    onChange={(e) => updateCase("title", e.target.value)}
                    className="flex-1 bg-transparent text-base md:text-lg font-bold text-white outline-none placeholder:text-slate-600"
                    placeholder="Tiêu đề Case..."
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <select
                    value={currentCase.priority}
                    onChange={(e) => updateCase("priority", e.target.value)}
                    className="flex-1 sm:flex-none bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                    {(["passed", "failed", "blocked"] as const).map((s) => {
                      const Icon = STATUS_CONFIG[s].icon;
                      return (
                        <button
                          key={s}
                          onClick={() =>
                            updateCase(
                              "status",
                              currentCase.status === s ? "draft" : s
                            )
                          }
                          className={`p-1.5 rounded-md transition-all ${
                            currentCase.status === s
                              ? STATUS_CONFIG[s].color.split(" ")[1] +
                                " text-white shadow"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                          title={s}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <LayoutList size={14} /> Điều kiện tiên quyết
                  </label>
                  <input
                    value={currentCase.precondition}
                    onChange={(e) => updateCase("precondition", e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                    placeholder="VD: Đã login..."
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-start items-end">
                      <label className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2">
                        <PlayCircle size={14} /> Các bước thực hiện
                      </label>
                    </div>
                    <textarea
                      value={currentCase.steps}
                      onChange={(e) => updateCase("steps", e.target.value)}
                      className="flex-1 min-h-[200px] bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:border-indigo-500/50 outline-none resize-none custom-scrollbar leading-relaxed font-mono"
                      placeholder={`1. Bước 1...\n2. Bước 2...`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                      <CheckCircle2 size={14} /> Kết quả mong đợi
                    </label>
                    <textarea
                      value={currentCase.expected}
                      onChange={(e) => updateCase("expected", e.target.value)}
                      className="flex-1 min-h-[200px] bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:border-emerald-500/50 outline-none resize-none custom-scrollbar leading-relaxed"
                      placeholder="Hệ thống hiển thị..."
                    />
                  </div>
                </div>
                <div
                  className={`transition-all duration-500 overflow-hidden ${
                    currentCase.status === "failed" ||
                    currentCase.status === "blocked"
                      ? "max-h-64 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <label className="text-xs font-bold text-rose-400 uppercase mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Kết quả thực tế (Lỗi)
                  </label>
                  <textarea
                    value={currentCase.actual}
                    onChange={(e) => updateCase("actual", e.target.value)}
                    className="w-full h-24 bg-rose-900/10 border border-rose-500/30 rounded-xl p-4 text-sm text-rose-200 focus:border-rose-500 outline-none resize-none"
                    placeholder="Mô tả lỗi đã xảy ra..."
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-800 gap-2">
                  <button
                    onClick={openMoveCopyModal}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700"
                  >
                    <ArrowRightLeft size={14} /> Di chuyển / Copy
                  </button>
                  <button
                    onClick={cloneCase}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700"
                  >
                    <Copy size={14} /> Nhân bản
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-60">
              <ClipboardList size={64} className="mb-4 stroke-1" />
              <p className="text-sm font-medium">Chọn dự án & Test Case</p>
            </div>
          )}
        </div>
      </div>

      {/* --- UNIVERSAL MODAL --- */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setModal({ ...modal, isOpen: false })}
        >
          <div
            className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ADD / RENAME PROJECT */}
            {(modal.type === "add_project" ||
              modal.type === "rename_project") && (
              <>
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  {modal.type === "add_project" ? (
                    <FolderPlus size={20} className="text-teal-500" />
                  ) : (
                    <Edit2 size={20} className="text-indigo-500" />
                  )}{" "}
                  {modal.type === "add_project" ? "Dự án mới" : "Đổi tên dự án"}
                </h3>
                <input
                  autoFocus
                  type="text"
                  value={modal.inputValue}
                  onChange={(e) =>
                    setModal({ ...modal, inputValue: e.target.value })
                  }
                  placeholder="Nhập tên dự án..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-teal-500 mb-4"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleProjectAction}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg"
                  >
                    Lưu
                  </button>
                </div>
              </>
            )}

            {/* DELETE */}
            {(modal.type === "delete_case" ||
              modal.type === "delete_project") && (
              <>
                <div className="flex items-center gap-3 mb-4 text-rose-500">
                  <div className="p-2 bg-rose-500/10 rounded-full">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-white">Xác nhận xóa</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  {modal.type === "delete_project"
                    ? "Xóa dự án này sẽ xóa TOÀN BỘ Test Case bên trong."
                    : "Bạn có chắc chắn muốn xóa Test Case này không?"}
                  <br />
                  Hành động này không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleProjectAction}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg"
                  >
                    Xóa bỏ
                  </button>
                </div>
              </>
            )}

            {/* MOVE / COPY */}
            {modal.type === "move_copy" && (
              <>
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <ArrowRightLeft size={20} className="text-indigo-500" /> Di
                  chuyển / Copy
                </h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">
                      Chọn dự án đích
                    </label>
                    <select
                      value={targetProjectId}
                      onChange={(e) => setTargetProjectId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                    >
                      {projects
                        .filter((p) => p.id !== currentCase?.projectId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">
                      Hành động
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setModal({ ...modal, actionType: "copy" })
                        }
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                          modal.actionType === "copy"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        Sao chép (Copy)
                      </button>
                      <button
                        onClick={() =>
                          setModal({ ...modal, actionType: "move" })
                        }
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                          modal.actionType === "move"
                            ? "bg-rose-600 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        Di chuyển (Move)
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleMoveCopyExecute}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-black hover:bg-slate-200"
                  >
                    Thực hiện
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
