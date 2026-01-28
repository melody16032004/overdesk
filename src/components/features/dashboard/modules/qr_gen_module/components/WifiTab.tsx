export const WifiTab = ({ wifiData, setWifiData }: any) => (
  <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
    <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
      {/* Cột 1: SSID */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
          Network Name (SSID)
        </label>
        <input
          type="text"
          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors"
          placeholder="MyWiFi"
          value={wifiData.ssid}
          onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
        />
      </div>

      {/* Cột 2: Password */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
          Password
        </label>
        <input
          type="text"
          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors"
          placeholder="password123"
          value={wifiData.password}
          onChange={(e) =>
            setWifiData({ ...wifiData, password: e.target.value })
          }
        />
      </div>
    </div>

    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase">
        Encryption
      </label>
      <select
        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none"
        value={wifiData.encryption}
        onChange={(e) =>
          setWifiData({ ...wifiData, encryption: e.target.value })
        }
      >
        <option value="WPA">WPA/WPA2</option>
        <option value="WEP">WEP</option>
        <option value="nopass">No Password</option>
      </select>
    </div>
  </div>
);
