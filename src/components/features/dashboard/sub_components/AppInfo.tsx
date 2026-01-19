import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import { INITIAL_APPS } from "../constants/INITIAL_APPS";

export const AppInfo = () => {
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    // Lấy version từ tauri.conf.json
    getVersion().then((v) => setAppVersion(v));
  }, []);

  return (
    <div className="text-xs text-slate-500">
      v{appVersion} ({INITIAL_APPS.length} Modules Edition)
    </div>
  );
};
