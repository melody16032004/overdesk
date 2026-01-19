export interface ConfigModuleProps {
  allApps: any[];
  hiddenAppIds: string[];
  onToggleApp: (id: string) => void;
  onBulkUpdate: (hiddenIds: string[]) => void;
}

export interface CustomPreset {
  id: string;
  label: string;
  hiddenIds: string[];
}
