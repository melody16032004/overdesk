import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet';
import { Search, MapPin, Loader2, Navigation, Locate, Save, Star, Trash2, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useToastStore } from '../../../../stores/useToastStore';
import { saveToDisk } from '../../../../utils/storage';

// --- TYPES ---
interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface RouteInfo {
  geometry: [number, number][]; // Mảng tọa độ [lat, lng]
  distance: number; // mét
  duration: number; // giây
  summary: string;  // <--- THÊM TRƯỜNG NÀY (Tên tuyến đường)
  isAlternative: boolean;
}

// --- ICONS ---
const createIcon = (color: string) => new L.DivIcon({
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  className: 'custom-marker-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const currentIcon = createIcon('#3b82f6'); // Xanh dương
const destIcon = createIcon('#ef4444');    // Đỏ

// --- COMPONENT UPDATE VIEW ---
const MapUpdater = ({ center, bounds }: { center: [number, number], bounds?: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
    } else {
        map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, bounds, map]);
  return null;
};

export const MapModule = () => {
    const { showToast } = useToastStore();
  // States cơ bản
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [destPos, setDestPos] = useState<[number, number] | null>(null);
  const [center, setCenter] = useState<[number, number]>([10.7769, 106.7009]); 
  
  // States tìm kiếm & routing
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // States lưu trữ
  const [savedLocs, setSavedLocs] = useState<SavedLocation[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // --- 1. LOAD DATA ---
  useEffect(() => {
    const saved = localStorage.getItem('map_saved_locs');
    if (saved) setSavedLocs(JSON.parse(saved));
    handleGetLocation();
  }, []);

  // --- 2. LOGIC ĐỊNH VỊ ---
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setMyPos([latitude, longitude]);
        setCenter([latitude, longitude]);
      }, (err) => console.error(err));
    }
  };

  // --- 3. LOGIC TÌM KIẾM ---
  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (e) { console.error(e); } 
    finally { setIsSearching(false); }
  };

  const selectLocation = (lat: string, lon: string, display_name: string) => {
    const newDest: [number, number] = [parseFloat(lat), parseFloat(lon)];
    setDestPos(newDest);
    setQuery(display_name.split(',')[0]);
    setShowResults(false);
    
    if (myPos) {
        fetchRoute(myPos, newDest);
    } else {
        setCenter(newDest); 
    }
  };

  // --- 4. LOGIC VẼ ĐƯỜNG (ĐÃ FIX TÊN ĐƯỜNG) ---
  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    setIsLoadingRoute(true);
    setRoutes([]);
    try {
      // THÊM &steps=true để lấy chi tiết các đoạn đường
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true&steps=true`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const processedRoutes: RouteInfo[] = data.routes.map((r: any, index: number) => {
            // LOGIC TÌM TÊN ĐƯỜNG:
            let routeName = r.legs[0]?.summary;

            // Nếu API không trả về summary, ta tự tìm đoạn đường dài nhất trong các bước (steps)
            if (!routeName && r.legs[0]?.steps?.length > 0) {
                // Sắp xếp các đoạn đường theo độ dài giảm dần
                const sortedSteps = [...r.legs[0].steps].sort((a: any, b: any) => b.distance - a.distance);
                // Lấy tên của đoạn dài nhất (bỏ qua nếu không có tên hoặc tên là empty)
                const mainStep = sortedSteps.find((step: any) => step.name && step.name.trim() !== "");
                
                routeName = mainStep ? mainStep.name : "Unnamed Road";
            }

            // Nếu vẫn không có tên, hiển thị Route + số
            if (!routeName) routeName = `Route ${index + 1}`;

            return {
                geometry: r.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]),
                distance: r.distance,
                duration: r.duration,
                summary: routeName, // Gán tên đường đã xử lý
                isAlternative: index > 0
            };
        });
        setRoutes(processedRoutes);
      }
    } catch (e) {
      console.error("Routing error:", e);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // --- 5. LOGIC LƯU ĐỊA ĐIỂM ---
  const saveCurrentLocation = () => {
    if (!destPos || !query) return;
    const newLoc: SavedLocation = {
        id: Date.now().toString(),
        name: query,
        lat: destPos[0],
        lon: destPos[1]
    };
    const updated = [newLoc, ...savedLocs];
    setSavedLocs(updated);
    localStorage.setItem('map_saved_locs', JSON.stringify(updated));
    saveToDisk('map_saved_locs', updated);
    showToast('Location saved!', 'success');
  };

  const deleteLocation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLocs.filter(l => l.id !== id);
    setSavedLocs(updated);
    localStorage.setItem('map_saved_locs', JSON.stringify(updated));
    saveToDisk('map_saved_locs', updated);
  }

  const routeBounds: L.LatLngBoundsExpression | undefined = routes.length > 0 && myPos && destPos 
    ? L.latLngBounds([myPos, destPos]) 
    : undefined;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-white/5 relative overflow-hidden rounded-xl">
      
      {/* 1. THANH CÔNG CỤ */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-1">
                <div className="pl-3 text-slate-400"><Search size={16} /></div>
                <input 
                    type="text" 
                    placeholder="Search destination..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm p-2 text-slate-700 dark:text-white placeholder:text-slate-400 min-w-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {query && <button onClick={() => {setQuery(''); setDestPos(null); setRoutes([]);}} className="p-2 text-slate-400 hover:text-red-500"><X size={14}/></button>}
                <button onClick={handleSearch} className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                </button>
            </div>

            <button onClick={handleGetLocation} className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-white/10" title="My Location">
                <Locate size={18} />
            </button>

            <button onClick={() => setShowSaved(!showSaved)} className={`p-3 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 transition-colors ${showSaved ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200'}`} title="Saved Locations">
                <Star size={18} />
            </button>
        </div>

        {showResults && results.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
            {results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => selectLocation(item.lat, item.lon, item.display_name)}
                className="w-full text-left p-3 text-xs border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 flex items-start gap-2 last:border-0"
              >
                <MapPin size={14} className="shrink-0 mt-0.5 text-indigo-500" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {showSaved && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 p-1">
                {savedLocs.length === 0 && <div className="text-xs text-slate-400 p-3 text-center">No saved locations yet.</div>}
                {savedLocs.map((loc) => (
                    <div key={loc.id} onClick={() => selectLocation(loc.lat.toString(), loc.lon.toString(), loc.name)} className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg cursor-pointer group">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Star size={14} className="text-amber-400 fill-amber-400 shrink-0"/>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{loc.name}</span>
                        </div>
                        <button onClick={(e) => deleteLocation(loc.id, e)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* 2. THÔNG TIN TUYẾN ĐƯỜNG (CẬP NHẬT UI: HIỂN THỊ TÊN ĐƯỜNG) */}
      {routes.length > 0 && (
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
                              {routes.slice(1).map((r, idx) => (
                                  <div key={idx} className="text-[10px] text-slate-400 italic">
                                      {/* Hiển thị tên tuyến đường phụ */}
                                      Alt: via {r.summary} ({Math.round(r.duration / 60)} mins)
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  {!savedLocs.find(l => l.lat === destPos?.[0] && l.lon === destPos?.[1]) && (
                      <button onClick={saveCurrentLocation} className="flex flex-col items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors">
                          <Save size={20} />
                          <span className="text-[9px] font-bold">Save</span>
                      </button>
                  )}
              </div>
          </div>
      )}

      {isLoadingRoute && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-black/70 text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 backdrop-blur-md">
              <Loader2 size={14} className="animate-spin" /> Calculating route...
          </div>
      )}

      {/* 3. BẢN ĐỒ */}
      <MapContainer 
        center={center} 
        zoom={13} 
        className="w-full h-full z-0 outline-none" 
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {myPos && (
            <>
                <Marker position={myPos} icon={currentIcon}>
                    <Popup className="text-xs font-bold">You are here</Popup>
                </Marker>
                <CircleMarker center={myPos} radius={20} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, stroke: false }} />
            </>
        )}

        {destPos && (
            <Marker position={destPos} icon={destIcon}>
                <Popup className="text-xs font-bold">Destination</Popup>
            </Marker>
        )}

        {routes.map((route, idx) => (
            <Polyline 
                key={idx}
                positions={route.geometry} 
                pathOptions={{ 
                    color: idx === 0 ? '#6366f1' : '#94a3b8', 
                    weight: idx === 0 ? 5 : 3,
                    opacity: idx === 0 ? 0.8 : 0.5,
                    dashArray: idx === 0 ? undefined : '5, 10'
                }} 
            />
        ))}

        <MapUpdater center={center} bounds={routeBounds} />
      </MapContainer>
    </div>
  );
};