import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

export const AppInfo = () => {
  const [appVersion, setAppVersion] = useState("");
  useEffect(() => {
    // Lấy version từ tauri.conf.json
    getVersion().then((v) => setAppVersion(v));
  }, []);
  return (
    <div className="text-xs text-slate-500">
      v{appVersion} <span className="text-slate-400">• Pro</span>
    </div>
  );
};
