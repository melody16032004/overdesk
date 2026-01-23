import { useState } from "react";
import { DEFAULT_PROPS } from "./constants/icon_picker_const";
import { IconName } from "./types/icon_picker_type";
import { DetailContent } from "./components/DetailContent";
import { PickerHeader } from "./components/PickerHeader";
import { IconGrid } from "./components/IconGrid";
import { useIconPickerLogic } from "./hooks/useIconPickerLogic";

// ============================================================================
// MAIN MODULE
// ============================================================================
export const IconPickerModule = () => {
  // Logic from Hook
  const { state, actions } = useIconPickerLogic();

  // UI State (Local)
  const [selectedIcon, setSelectedIcon] = useState<IconName | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [customProps, setCustomProps] = useState(DEFAULT_PROPS);

  // Handlers
  const handleSelectIcon = (name: IconName) => {
    setSelectedIcon(name);
    setIsMobileOpen(true);
    actions.addToHistory(name);
  };

  const handleCloseDetail = () => {
    setIsMobileOpen(false);
    setSelectedIcon(null);
  };

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* === LEFT: LIST === */}
      <div
        className={`flex-1 flex flex-col min-w-0 border-r border-[#3e3e42] transition-all duration-300 ease-in-out ${
          selectedIcon ? "lg:pr-80" : ""
        }`}
      >
        <PickerHeader
          query={state.query}
          setQuery={actions.setQuery}
          activeTab={state.activeTab}
          setActiveTab={actions.setActiveTab}
          counts={{
            all: state.allIconNames.length,
            favorites: state.favorites.length,
          }}
        />

        <IconGrid
          listRef={state.listRef}
          onScroll={actions.handleScroll}
          icons={state.visibleIcons}
          selectedIcon={selectedIcon}
          favorites={state.favorites}
          onSelect={handleSelectIcon}
          onToggleFav={actions.toggleFavorite}
        />
      </div>

      {/* === MOBILE OVERLAY === */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* === RIGHT: DETAILS PANEL === */}
      <div
        className={`bg-[#1e1e1e] shadow-2xl border-[#3e3e42] flex flex-col z-50 transition-transform duration-300 ease-in-out fixed bottom-0 left-0 w-full h-[85vh] rounded-t-2xl border-t 
        ${isMobileOpen ? "translate-y-0" : "translate-y-full"} 
        lg:absolute lg:top-0 lg:right-0 lg:left-auto lg:h-full lg:w-80 lg:rounded-none lg:border-t-0 lg:border-l lg:translate-y-0 
        ${selectedIcon ? "lg:translate-x-0" : "lg:translate-x-full"}`}
      >
        {selectedIcon && (
          <DetailContent
            iconName={selectedIcon}
            customProps={customProps}
            setCustomProps={setCustomProps}
            isFavorite={state.favorites.includes(selectedIcon)}
            onToggleFavorite={() => actions.toggleFavorite(selectedIcon)}
            onClose={handleCloseDetail}
            onReset={() => setCustomProps(DEFAULT_PROPS)}
          />
        )}
      </div>
    </div>
  );
};
