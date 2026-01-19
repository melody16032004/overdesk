import { useState, useEffect, useRef } from "react";
import {
  Search,
  ToggleLeft,
  Zap,
  CheckCircle2,
  Eye,
  Save,
  Trash2,
  Edit3,
  UserCog,
  X,
  AlertTriangle,
} from "lucide-react";
import { AppCard } from "./components/AppCard";
import { ConfigModuleProps, CustomPreset } from "./types/config";
import { MANDATORY_APPS, SYSTEM_PRESETS } from "./constants/config_const";

export const ConfigModule = ({
  allApps,
  hiddenAppIds,
  onToggleApp,
  onBulkUpdate,
}: ConfigModuleProps) => {
  // --- 1. HELPERS (OUTSIDE) ---
  const loadInitialPresets = (): CustomPreset[] => {
    try {
      return JSON.parse(localStorage.getItem("config_custom_presets") || "[]");
    } catch {
      return [];
    }
  };

  // --- 2. STATE & REFS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customPresets, setCustomPresets] =
    useState<CustomPreset[]>(loadInitialPresets);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "save" | "rename" | "delete" | "confirm" | null;
    title: string;
    message?: string;
    inputValue?: string;
    targetId?: string;
    payload?: any;
  }>({ isOpen: false, type: null, title: "", message: "", inputValue: "" });

  const inputRef = useRef<HTMLInputElement>(null);

  // --- 3. EFFECTS (AUTO-SAVE & FOCUS) ---

  // Auto-focus input khi mở modal save/rename
  useEffect(() => {
    if (modal.isOpen && ["save", "rename"].includes(modal.type || "")) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [modal.isOpen, modal.type]);

  // Auto-update Active Preset khi người dùng toggle app bên ngoài
  useEffect(() => {
    if (!activePresetId) return;
    setCustomPresets((prev) => {
      const updated = prev.map((p) =>
        p.id === activePresetId ? { ...p, hiddenIds: hiddenAppIds } : p,
      );
      localStorage.setItem("config_custom_presets", JSON.stringify(updated));
      return updated;
    });
  }, [hiddenAppIds, activePresetId]);

  // Persist Presets to LocalStorage
  useEffect(() => {
    localStorage.setItem(
      "config_custom_presets",
      JSON.stringify(customPresets),
    );
  }, [customPresets]);

  // --- 4. ACTIONS (TRIGGER MODALS) ---

  const triggerSavePreset = () => {
    setModal({
      isOpen: true,
      type: "save",
      title: "Save new configuration",
      message: "Create a snapshot of the current state.",
      inputValue: `My Setup ${customPresets.length + 1}`,
    });
  };

  const triggerRenamePreset = (
    id: string,
    currentName: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      type: "rename",
      title: "Rename configuration",
      inputValue: currentName,
      targetId: id,
    });
  };

  const triggerDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      type: "delete",
      title: "Delete configuration?",
      message: "This action cannot be undone.",
      targetId: id,
    });
  };

  const triggerApplySystem = (keepIds: string[]) => {
    setActivePresetId(null); // Exit custom mode
    const newHidden = allApps
      .map((app) => app.id)
      .filter((id) => !keepIds.includes(id) && !MANDATORY_APPS.includes(id));

    setModal({
      isOpen: true,
      type: "confirm",
      title: "Apply system preset?",
      message: "This will overwrite your current customizations.",
      payload: newHidden,
    });
  };

  const triggerApplyCustom = (preset: CustomPreset) => {
    setModal({
      isOpen: true,
      type: "confirm",
      title: `Apply "${preset.label}"?`,
      message: "The interface will switch to this configuration.",
      payload: { hiddenIds: preset.hiddenIds, presetId: preset.id },
    });
  };

  const triggerShowAll = () => {
    setModal({
      isOpen: true,
      type: "confirm",
      title: "Show all apps?",
      message: "All hidden apps will be shown again.",
      payload: [],
    });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  // --- 5. HANDLERS (LOGIC SUBMIT) ---

  const handleModalSubmit = () => {
    const { type, inputValue, targetId, payload } = modal;
    const name = inputValue?.trim() || "Untitled";

    switch (type) {
      case "save": {
        const newId = Date.now().toString();
        const newPreset: CustomPreset = {
          id: newId,
          label: name,
          hiddenIds: [...hiddenAppIds],
        };
        setCustomPresets((prev) => [...prev, newPreset]);
        setActivePresetId(newId);
        break;
      }
      case "rename": {
        if (targetId) {
          setCustomPresets((prev) =>
            prev.map((p) => (p.id === targetId ? { ...p, label: name } : p)),
          );
        }
        break;
      }
      case "delete": {
        if (targetId) {
          setCustomPresets((prev) => prev.filter((p) => p.id !== targetId));
          if (activePresetId === targetId) setActivePresetId(null);
        }
        break;
      }
      case "confirm": {
        if (payload !== undefined) {
          if (Array.isArray(payload)) {
            onBulkUpdate(payload); // System Preset / Show All
          } else {
            onBulkUpdate(payload.hiddenIds); // Custom Preset
            setActivePresetId(payload.presetId);
          }
        }
        break;
      }
    }
    closeModal();
  };

  // --- 6. RENDER COMPUTATIONS ---

  const filteredApps = allApps.filter(
    (app) =>
      app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.desc?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeApps = filteredApps.filter(
    (app) => !hiddenAppIds.includes(app.id),
  );
  const hiddenAppsList = filteredApps.filter((app) =>
    hiddenAppIds.includes(app.id),
  );

  const total = allApps.length;
  const current = total - hiddenAppIds.length;
  const percent = Math.round((current / total) * 100);

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-800 bg-[#1e293b]/90 backdrop-blur-md z-20 space-y-4">
        {/* Search & Save */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm kiếm...`}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={triggerSavePreset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <Save size={16} />{" "}
            <span className="hidden sm:inline">Lưu Cấu Hình</span>
          </button>
        </div>

        {/* PRESETS BAR */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Zap size={12} /> Available templates
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {percent}% Active
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={triggerShowAll}
              className="flex flex-col items-center justify-center p-2 min-w-[70px] bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all group shrink-0"
            >
              <CheckCircle2
                size={18}
                className="text-slate-400 group-hover:text-emerald-400 mb-1 transition-colors"
              />
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-white">
                Show All
              </span>
            </button>

            <div className="w-px bg-slate-700 mx-1 shrink-0"></div>

            {SYSTEM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => triggerApplySystem(preset.keep)}
                className="flex flex-col items-center justify-center p-2 min-w-[70px] bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all group relative overflow-hidden shrink-0"
              >
                <div
                  className={`absolute top-0 left-0 w-full h-0.5 ${preset.color}`}
                ></div>
                <preset.icon
                  size={18}
                  className="text-slate-400 group-hover:text-white mb-1"
                />
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-white">
                  {preset.label}
                </span>
              </button>
            ))}

            {customPresets.length > 0 && (
              <div className="w-px bg-slate-700 mx-1 shrink-0"></div>
            )}

            {customPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => triggerApplyCustom(preset)}
                className={`group relative flex flex-col items-center justify-center p-2 min-w-[80px] rounded-lg border transition-all shrink-0 cursor-pointer
                  ${
                    activePresetId === preset.id
                      ? "bg-indigo-600 border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg scale-105" // Active style
                      : "bg-indigo-900/20 hover:bg-indigo-900/40 border-indigo-500/30 hover:border-indigo-500/50"
                  }
                `}
              >
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) =>
                      triggerRenamePreset(preset.id, preset.label, e)
                    }
                    className="p-0.5 bg-slate-900 rounded text-slate-400 hover:text-white"
                  >
                    <Edit3 size={8} />
                  </button>
                  <button
                    onClick={(e) => triggerDeletePreset(preset.id, e)}
                    className="p-0.5 bg-slate-900 rounded text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 size={8} />
                  </button>
                </div>
                <UserCog size={18} className="text-indigo-400 mb-1" />
                <span className="text-[9px] font-bold text-indigo-300 truncate max-w-[70px]">
                  {preset.label}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeApps.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2 sticky top-0 bg-[#0f172a]/95 py-2 z-10 backdrop-blur">
              <Eye size={14} /> Displayed ({activeApps.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isHidden={false}
                  onToggle={() =>
                    !MANDATORY_APPS.includes(app.id) && onToggleApp(app.id)
                  }
                  isMandatory={MANDATORY_APPS.includes(app.id)}
                />
              ))}
            </div>
          </div>
        )}

        {hiddenAppsList.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2 sticky top-0 bg-[#0f172a]/95 py-2 z-10 backdrop-blur">
              <ToggleLeft size={14} /> Hidden ({hiddenAppsList.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hiddenAppsList.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isHidden={true}
                  onToggle={() =>
                    !MANDATORY_APPS.includes(app.id) && onToggleApp(app.id)
                  }
                  isMandatory={MANDATORY_APPS.includes(app.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                {modal.type === "delete" && (
                  <AlertTriangle size={16} className="text-rose-500" />
                )}
                {modal.type === "save" && (
                  <Save size={16} className="text-indigo-500" />
                )}
                {modal.type === "rename" && (
                  <Edit3 size={16} className="text-blue-500" />
                )}
                {modal.type === "confirm" && (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                )}
                {modal.title}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {modal.message && (
                <p className="text-sm text-slate-400 mb-4">{modal.message}</p>
              )}
              {(modal.type === "save" || modal.type === "rename") && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">
                    Config name
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={modal.inputValue}
                    onChange={(e) =>
                      setModal({ ...modal, inputValue: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all active:scale-95 ${
                  modal.type === "delete"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {modal.type === "delete" ? "Delete" : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
