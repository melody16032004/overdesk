import { useEffect } from "react";
import { useMap } from "react-leaflet";

export const MapUpdater = ({
  center,
  bounds,
}: {
  center: [number, number];
  bounds?: L.LatLngBoundsExpression;
}) => {
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
