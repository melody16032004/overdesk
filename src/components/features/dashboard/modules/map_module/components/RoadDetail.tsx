import { Save } from "lucide-react";

export const RoadDetail = ({
  routes,
  savedLocs,
  destPos,
  saveCurrentLocation,
}: any) => (
  <div className="absolute bottom-8 left-3 right-3 z-[1000] bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom-2">
    <div className="flex justify-between items-start">
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase mb-1">
          {/* Hiển thị tên tuyến đường chính */}
          via {routes[0].summary}
        </div>
        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {(routes[0].distance / 1000).toFixed(1)} km
          <span className="text-sm font-normal text-slate-500 ml-2">
            ~{Math.round(routes[0].duration / 60)} mins (no traffic)
          </span>
        </div>
        {routes.length > 1 && (
          <div className="flex flex-col gap-1 mt-1">
            {routes.slice(1).map((r: any, idx: any) => (
              <div key={idx} className="text-[10px] text-slate-400 italic">
                {/* Hiển thị tên tuyến đường phụ */}
                Alt: via {r.summary} ({Math.round(r.duration / 60)} mins)
              </div>
            ))}
          </div>
        )}
      </div>

      {!savedLocs.find(
        (l: any) => l.lat === destPos?.[0] && l.lon === destPos?.[1],
      ) && (
        <button
          onClick={saveCurrentLocation}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors"
        >
          <Save size={20} />
          <span className="text-[9px] font-bold">Save</span>
        </button>
      )}
    </div>
  </div>
);
