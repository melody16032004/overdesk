import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import { Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useToastStore } from "../../../../../stores/useToastStore";
import { saveToDisk } from "../../../../../utils/storage";
import { RouteInfo, SavedLocation } from "./types/map_type";
import { currentIcon, destIcon } from "./helper/map_helper";
import { MapUpdater } from "./components/MapUpdater";
import { ToolBar } from "./components/ToolBar";
import { RoadDetail } from "./components/RoadDetail";

export const MapModule = () => {
  const { showToast } = useToastStore();
  // States cơ bản
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [destPos, setDestPos] = useState<[number, number] | null>(null);
  const [center, setCenter] = useState<[number, number]>([10.7769, 106.7009]);

  // States tìm kiếm & routing
  const [query, setQuery] = useState("");
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
    const saved = localStorage.getItem("map_saved_locs");
    if (saved) setSavedLocs(JSON.parse(saved));
    handleGetLocation();
  }, []);

  // --- 2. LOGIC ĐỊNH VỊ ---
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMyPos([latitude, longitude]);
          setCenter([latitude, longitude]);
        },
        (err) => console.error(err),
      );
    }
  };

  // --- 3. LOGIC TÌM KIẾM ---
  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (lat: string, lon: string, display_name: string) => {
    const newDest: [number, number] = [parseFloat(lat), parseFloat(lon)];
    setDestPos(newDest);
    setQuery(display_name.split(",")[0]);
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
        const processedRoutes: RouteInfo[] = data.routes.map(
          (r: any, index: number) => {
            // LOGIC TÌM TÊN ĐƯỜNG:
            let routeName = r.legs[0]?.summary;

            // Nếu API không trả về summary, ta tự tìm đoạn đường dài nhất trong các bước (steps)
            if (!routeName && r.legs[0]?.steps?.length > 0) {
              // Sắp xếp các đoạn đường theo độ dài giảm dần
              const sortedSteps = [...r.legs[0].steps].sort(
                (a: any, b: any) => b.distance - a.distance,
              );
              // Lấy tên của đoạn dài nhất (bỏ qua nếu không có tên hoặc tên là empty)
              const mainStep = sortedSteps.find(
                (step: any) => step.name && step.name.trim() !== "",
              );

              routeName = mainStep ? mainStep.name : "Unnamed Road";
            }

            // Nếu vẫn không có tên, hiển thị Route + số
            if (!routeName) routeName = `Route ${index + 1}`;

            return {
              geometry: r.geometry.coordinates.map((coord: number[]) => [
                coord[1],
                coord[0],
              ]),
              distance: r.distance,
              duration: r.duration,
              summary: routeName, // Gán tên đường đã xử lý
              isAlternative: index > 0,
            };
          },
        );
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
      lon: destPos[1],
    };
    const updated = [newLoc, ...savedLocs];
    setSavedLocs(updated);
    localStorage.setItem("map_saved_locs", JSON.stringify(updated));
    saveToDisk("map_saved_locs", updated);
    showToast("Location saved!", "success");
  };

  const deleteLocation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLocs.filter((l) => l.id !== id);
    setSavedLocs(updated);
    localStorage.setItem("map_saved_locs", JSON.stringify(updated));
    saveToDisk("map_saved_locs", updated);
  };

  const routeBounds: L.LatLngBoundsExpression | undefined =
    routes.length > 0 && myPos && destPos
      ? L.latLngBounds([myPos, destPos])
      : undefined;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-white/5 relative overflow-hidden rounded-xl">
      {/* 1. THANH CÔNG CỤ */}
      <ToolBar
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        setDestPos={setDestPos}
        setRoutes={setRoutes}
        isSearching={isSearching}
        handleGetLocation={handleGetLocation}
        setShowSaved={setShowSaved}
        showSaved={showSaved}
        showResults={showResults}
        results={results}
        selectLocation={selectLocation}
        savedLocs={savedLocs}
        deleteLocation={deleteLocation}
      />

      {/* 2. THÔNG TIN TUYẾN ĐƯỜNG (CẬP NHẬT UI: HIỂN THỊ TÊN ĐƯỜNG) */}
      {routes.length > 0 && (
        <RoadDetail
          routes={routes}
          savedLocs={savedLocs}
          destPos={destPos}
          saveCurrentLocation={saveCurrentLocation}
        />
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
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {myPos && (
          <>
            <Marker position={myPos} icon={currentIcon}>
              <Popup className="text-xs font-bold">You are here</Popup>
            </Marker>
            <CircleMarker
              center={myPos}
              radius={20}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                stroke: false,
              }}
            />
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
              color: idx === 0 ? "#6366f1" : "#94a3b8",
              weight: idx === 0 ? 5 : 3,
              opacity: idx === 0 ? 0.8 : 0.5,
              dashArray: idx === 0 ? undefined : "5, 10",
            }}
          />
        ))}

        <MapUpdater center={center} bounds={routeBounds} />
      </MapContainer>
    </div>
  );
};
