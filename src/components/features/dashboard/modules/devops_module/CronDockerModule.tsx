import { useState, useEffect } from "react";
import {
  Clock,
  Container,
  Copy,
  Check,
  Plus,
  Trash2,
  FileCode,
  Settings,
  Server,
  Box,
  X,
  Menu,
  Code2,
} from "lucide-react";
import { PRESETS_CRON } from "./constants/devops_const";
import { explainCron, generateYamlBlock } from "./helper/devops_helper";
import { DockerService } from "./types/devops_type";

// --- COMPONENT ---
export const CronDockerModule = () => {
  // --- 1. STATE INITIALIZATION ---

  // UI State
  const [activeTab, setActiveTab] = useState<"cron" | "docker">(
    () =>
      (localStorage.getItem("devops_active_tab") as "cron" | "docker") ||
      "cron",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cron State
  const [cronExp, setCronExp] = useState(
    () => localStorage.getItem("devops_cron_exp") || "* * * * *",
  );
  const [cronInfo, setCronInfo] = useState({
    text: "Runs every minute",
    error: false,
  });

  // Docker State
  const [services, setServices] = useState<DockerService[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_docker_services");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [dockerViewMode, setDockerViewMode] = useState<"edit" | "preview">(
    "edit",
  );

  // Docker Form State
  const [formService, setFormService] = useState<DockerService>({
    id: "",
    name: "",
    image: "",
    ports: [],
    volumes: [],
    environment: [],
    restart: "unless-stopped",
  });

  // --- 2. PERSISTENCE & SIDE EFFECTS ---

  // Save Tab Preference
  useEffect(() => {
    localStorage.setItem("devops_active_tab", activeTab);
  }, [activeTab]);

  // Cron Logic & Persistence
  useEffect(() => {
    localStorage.setItem("devops_cron_exp", cronExp);
    setCronInfo(explainCron(cronExp));
  }, [cronExp]);

  // Docker Logic & Persistence
  useEffect(() => {
    localStorage.setItem("dashboard_docker_services", JSON.stringify(services));
  }, [services]);

  // --- 3. SHARED HANDLERS ---

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- 4. DOCKER SPECIFIC HANDLERS ---

  const handleAddService = () => {
    const newId = Date.now().toString();
    const newService: DockerService = {
      id: newId,
      name: "app-" + (services.length + 1),
      image: "nginx:latest",
      ports: [],
      volumes: [],
      environment: [],
      restart: "unless-stopped",
    };

    setServices([...services, newService]);
    setActiveServiceId(newId);
    setFormService(newService);
    setDockerViewMode("edit");
    setIsMobileMenuOpen(false);
  };

  const handleSaveService = () => {
    setServices((prev) =>
      prev.map((s) => (s.id === formService.id ? formService : s)),
    );

    // UX Feedback (Optional: Consider using a toast instead of direct DOM manipulation)
    const btn = document.getElementById("save-btn");
    if (btn) {
      const originalText = btn.innerText;
      btn.innerText = "Saved!";
      btn.classList.add("bg-green-600");
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove("bg-green-600");
      }, 1000);
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Delete this service?")) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (activeServiceId === id) setActiveServiceId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-bold text-white flex items-center gap-2">
            <Server size={20} className="text-purple-500" />
            <span className="hidden sm:inline">DevOps Tool</span>
          </div>
          <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#3e3e42]">
            <button
              onClick={() => setActiveTab("cron")}
              className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "cron"
                  ? "bg-purple-600 text-white"
                  : "hover:text-white"
              }`}
            >
              <Clock size={14} /> Cron
            </button>
            <button
              onClick={() => setActiveTab("docker")}
              className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "docker"
                  ? "bg-blue-600 text-white"
                  : "hover:text-white"
              }`}
            >
              <Container size={14} /> Docker
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-hidden relative">
        {/* === TAB 1: CRON GENERATOR === */}
        {activeTab === "cron" && (
          <div className="h-full p-4 md:p-8 overflow-y-auto">
            {/* ... (Giữ nguyên phần Cron cũ của bạn, không thay đổi logic này) ... */}
            <div className="max-w-2xl mx-auto space-y-6">
              <div
                className={`bg-[#252526] border-2 rounded-2xl p-6 shadow-2xl text-center transition-colors ${
                  cronInfo.error ? "border-red-500/50" : "border-[#3e3e42]"
                }`}
              >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Cron Expression
                </label>
                <div className="relative group max-w-md mx-auto">
                  <input
                    value={cronExp}
                    onChange={(e) => setCronExp(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl py-3 text-center text-2xl md:text-3xl font-mono text-green-400 focus:border-purple-500 outline-none transition-all"
                  />
                  <button
                    onClick={() => handleCopy(cronExp)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[#3e3e42] rounded-lg text-slate-400 hover:text-white transition-all"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <div
                  className={`mt-4 inline-flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-full border ${
                    cronInfo.error
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                  }`}
                >
                  {cronInfo.error ? <X size={14} /> : <Clock size={14} />}{" "}
                  {cronInfo.text}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESETS_CRON.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setCronExp(preset.value)}
                    className="p-3 bg-[#252526] border border-[#3e3e42] rounded-xl hover:border-purple-500 hover:bg-[#2d2d2d] text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white mb-1 group-hover:text-purple-400">
                      {preset.label}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {preset.value}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === TAB 2: DOCKER BUILDER (IMPROVED RESPONSIVE) === */}
        {activeTab === "docker" && (
          <div className="h-full flex flex-col md:flex-row relative">
            {/* 1. MOBILE BACKDROP */}
            {isMobileMenuOpen && (
              <div
                className="absolute inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>
            )}

            {/* 2. SIDEBAR (Service List) */}
            <div
              className={`
                    absolute md:relative inset-y-0 left-0 z-30 w-64 bg-[#252526] border-r border-[#3e3e42] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
                    ${
                      isMobileMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-full md:translate-x-0"
                    }
                `}
            >
              <div className="p-3 border-b border-[#3e3e42] flex justify-between items-center bg-[#252526]">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Services List
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddService}
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded shadow"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden p-1.5 hover:bg-[#3e3e42] rounded text-slate-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => {
                      setActiveServiceId(svc.id);
                      setFormService(svc);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs font-bold transition-all ${
                      activeServiceId === svc.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-400 hover:bg-[#3e3e42] border border-transparent hover:border-[#454545]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Box size={14} /> {svc.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteService(svc.id);
                      }}
                      className="hover:text-red-300 opacity-50 hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {services.length === 0 && (
                  <div className="text-center text-slate-600 text-xs py-10">
                    No services.
                    <br />
                    Tap + to add.
                  </div>
                )}
              </div>
            </div>

            {/* 3. MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] h-full">
              {/* Mobile Header (Service Select & View Switch) */}
              <div className="md:hidden flex-none p-2 border-b border-[#3e3e42] flex items-center justify-between bg-[#252526]">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold text-white px-2 py-1 rounded hover:bg-[#3e3e42]"
                >
                  <Menu size={18} />
                  <span className="truncate max-w-[150px]">
                    {activeServiceId
                      ? services.find((s) => s.id === activeServiceId)?.name
                      : "Select Service"}
                  </span>
                </button>
                <div className="flex bg-[#1e1e1e] rounded-lg p-0.5 border border-[#3e3e42]">
                  <button
                    onClick={() => setDockerViewMode("edit")}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 ${
                      dockerViewMode === "edit"
                        ? "bg-[#3e3e42] text-white"
                        : "text-slate-500"
                    }`}
                  >
                    <Settings size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDockerViewMode("preview")}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 ${
                      dockerViewMode === "preview"
                        ? "bg-[#3e3e42] text-white"
                        : "text-slate-500"
                    }`}
                  >
                    <Code2 size={12} /> YAML
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* FORM VIEW */}
                <div
                  className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#1e1e1e] ${
                    dockerViewMode === "preview" ? "hidden md:block" : "block"
                  }`}
                >
                  {activeServiceId ? (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                            Service Name
                          </label>
                          <input
                            value={formService.name}
                            onChange={(e) =>
                              setFormService({
                                ...formService,
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-[#252526] border border-[#3e3e42] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                            Image
                          </label>
                          <input
                            value={formService.image}
                            onChange={(e) =>
                              setFormService({
                                ...formService,
                                image: e.target.value,
                              })
                            }
                            className="w-full bg-[#252526] border border-[#3e3e42] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                          Restart Policy
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {["no", "always", "unless-stopped", "on-failure"].map(
                            (opt) => (
                              <button
                                key={opt}
                                onClick={() =>
                                  setFormService({
                                    ...formService,
                                    restart: opt as any,
                                  })
                                }
                                className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                                  formService.restart === opt
                                    ? "bg-blue-600/10 border-blue-600 text-blue-400"
                                    : "bg-[#252526] border-[#3e3e42] text-slate-400 hover:border-slate-500"
                                }`}
                              >
                                {opt}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      {/* Ports */}
                      <div className="bg-[#252526]/50 rounded-xl p-4 border border-[#3e3e42]">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold text-slate-400">
                            Ports (Host:Container)
                          </label>
                          <button
                            onClick={() =>
                              setFormService({
                                ...formService,
                                ports: [
                                  ...formService.ports,
                                  { host: "", container: "" },
                                ],
                              })
                            }
                            className="text-blue-400 text-xs font-bold hover:underline"
                          >
                            + Add Port
                          </button>
                        </div>
                        <div className="space-y-2">
                          {formService.ports.map((p, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                placeholder="8080"
                                value={p.host}
                                onChange={(e) => {
                                  const newPorts = [...formService.ports];
                                  newPorts[idx].host = e.target.value;
                                  setFormService({
                                    ...formService,
                                    ports: newPorts,
                                  });
                                }}
                                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1.5 text-xs text-white text-center"
                              />
                              <span className="text-slate-500 font-mono">
                                :
                              </span>
                              <input
                                placeholder="80"
                                value={p.container}
                                onChange={(e) => {
                                  const newPorts = [...formService.ports];
                                  newPorts[idx].container = e.target.value;
                                  setFormService({
                                    ...formService,
                                    ports: newPorts,
                                  });
                                }}
                                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1.5 text-xs text-white text-center"
                              />
                              <button
                                onClick={() =>
                                  setFormService({
                                    ...formService,
                                    ports: formService.ports.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  })
                                }
                                className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Env */}
                      <div className="bg-[#252526]/50 rounded-xl p-4 border border-[#3e3e42]">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold text-slate-400">
                            Environment Variables
                          </label>
                          <button
                            onClick={() =>
                              setFormService({
                                ...formService,
                                environment: [
                                  ...formService.environment,
                                  { key: "", value: "" },
                                ],
                              })
                            }
                            className="text-blue-400 text-xs font-bold hover:underline"
                          >
                            + Add Env
                          </button>
                        </div>
                        <div className="space-y-2">
                          {formService.environment.map((env, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                placeholder="KEY"
                                value={env.key}
                                onChange={(e) => {
                                  const newEnv = [...formService.environment];
                                  newEnv[idx].key = e.target.value;
                                  setFormService({
                                    ...formService,
                                    environment: newEnv,
                                  });
                                }}
                                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1.5 text-xs text-white"
                              />
                              <span className="text-slate-500">=</span>
                              <input
                                placeholder="Value"
                                value={env.value}
                                onChange={(e) => {
                                  const newEnv = [...formService.environment];
                                  newEnv[idx].value = e.target.value;
                                  setFormService({
                                    ...formService,
                                    environment: newEnv,
                                  });
                                }}
                                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1.5 text-xs text-white"
                              />
                              <button
                                onClick={() =>
                                  setFormService({
                                    ...formService,
                                    environment: formService.environment.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  })
                                }
                                className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Volumes */}
                      <div className="bg-[#252526]/50 rounded-xl p-4 border border-[#3e3e42]">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold text-slate-400">
                            Volumes
                          </label>
                          <button
                            onClick={() =>
                              setFormService({
                                ...formService,
                                volumes: [
                                  ...formService.volumes,
                                  { host: "", container: "" },
                                ],
                              })
                            }
                            className="text-blue-400 text-xs font-bold hover:underline"
                          >
                            + Add Volume
                          </button>
                        </div>
                        <div className="space-y-2">
                          {formService.volumes.map((v, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                placeholder="./data"
                                value={v.host}
                                onChange={(e) => {
                                  const newVols = [...formService.volumes];
                                  newVols[idx].host = e.target.value;
                                  setFormService({
                                    ...formService,
                                    volumes: newVols,
                                  });
                                }}
                                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1.5 text-xs text-white"
                              />
                              <span className="text-slate-500 font-mono">
                                :
                              </span>
                              <input
                                placeholder="/app/data"
                                value={v.container}
                                onChange={(e) => {
                                  const newVols = [...formService.volumes];
                                  newVols[idx].container = e.target.value;
                                  setFormService({
                                    ...formService,
                                    volumes: newVols,
                                  });
                                }}
                                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1.5 text-xs text-white"
                              />
                              <button
                                onClick={() =>
                                  setFormService({
                                    ...formService,
                                    volumes: formService.volumes.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  })
                                }
                                className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        id="save-btn"
                        onClick={handleSaveService}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg transition-all transform active:scale-95"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                      <Settings size={64} className="mb-4 opacity-10" />
                      <p className="text-sm mb-4">
                        Select a service from the menu to edit
                      </p>
                      <button
                        onClick={handleAddService}
                        className="px-4 py-2 bg-[#252526] hover:bg-[#3e3e42] text-slate-300 rounded-lg text-xs font-bold transition-all border border-[#3e3e42]"
                      >
                        Create New Service
                      </button>
                    </div>
                  )}
                </div>

                {/* PREVIEW VIEW */}
                <div
                  className={`w-full md:w-80 lg:w-96 bg-[#151516] border-l border-[#3e3e42] flex flex-col ${
                    dockerViewMode === "edit" ? "hidden md:flex" : "flex"
                  }`}
                >
                  <div className="p-3 border-b border-[#3e3e42] flex justify-between items-center bg-[#1e1e1e]">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                      <FileCode size={14} /> docker-compose.yml
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          services.length > 0
                            ? "version: '3.8'\n\nservices:\n" +
                                services
                                  .map((s) => generateYamlBlock(s))
                                  .join("\n")
                            : "",
                        )
                      }
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 custom-scrollbar font-mono text-xs leading-relaxed">
                    {services.length > 0 ? (
                      <>
                        <span className="text-purple-400">version:</span>{" "}
                        <span className="text-green-400">'3.8'</span>
                        <br />
                        <br />
                        <span className="text-purple-400">services:</span>
                        <br />
                        {services.map((svc) => (
                          <div
                            key={svc.id}
                            className="group hover:bg-[#1e1e1e] rounded transition-colors -mx-2 px-2 py-1"
                          >
                            <div className="text-slate-500 text-[10px] mt-1 select-none">
                              # Service: {svc.name}
                            </div>
                            <pre className="text-blue-300 whitespace-pre">
                              {generateYamlBlock(svc)}
                            </pre>
                          </div>
                        ))}
                      </>
                    ) : (
                      <span className="text-slate-600 italic">
                        # No services configured.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
