import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGameStore, getSquareVertices } from "../../store/gameStore";
import L from "leaflet";
import { Navigation, Target, ShieldCheck } from "lucide-react";

// Fix marker icon
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// ─── Seamless Tiled Renderer ──────────────────────────────────────────
const SeamlessGrid = () => {
  const map = useMap();
  const { capturedSquares, enemySquares } = useGameStore();
  const [squaresToRender, setSquaresToRender] = useState([]);

  const SQUARE_SIZE = 0.0001;

  const updateVisibleGrid = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom < 16) {
      setSquaresToRender([]);
      return;
    }

    const b = map.getBounds();
    const colS = Math.floor(b.getWest() / SQUARE_SIZE);
    const colE = Math.ceil(b.getEast() / SQUARE_SIZE);
    const rowS = Math.floor(b.getSouth() / SQUARE_SIZE);
    const rowE = Math.ceil(b.getNorth() / SQUARE_SIZE);

    const pool = [];
    for (let c = colS; c <= colE; c++) {
      for (let r = rowS; r <= rowE; r++) {
        const id = `${c}_${r}`;
        const owner =
          capturedSquares[id]?.owner || enemySquares[id]?.owner || null;
        pool.push({ id, col: c, row: r, owner });
      }
    }
    setSquaresToRender(pool);
  }, [map, capturedSquares, enemySquares]);

  useMapEvents({ moveend: updateVisibleGrid, zoomend: updateVisibleGrid });

  useEffect(() => {
    const t = setTimeout(updateVisibleGrid, 200);
    return () => clearTimeout(t);
  }, [updateVisibleGrid]);

  return (
    <>
      {squaresToRender.map((sq) => {
        const vertices = getSquareVertices(
          sq.row * SQUARE_SIZE,
          sq.col * SQUARE_SIZE,
        );
        const isMine = sq.owner === "You";
        const isEnemy = sq.owner && sq.owner !== "You";

        return (
          <Polygon
            key={sq.id}
            positions={vertices}
            pathOptions={{
              color: isMine
                ? "#6366f1"
                : isEnemy
                  ? "#f43f5e"
                  : "rgba(0,0,0,0.03)",
              fillColor: isMine
                ? "#6366f1"
                : isEnemy
                  ? "#f43f5e"
                  : "transparent",
              fillOpacity: isMine ? 0.35 : isEnemy ? 0.2 : 0,
              weight: 0.5,
            }}>
            {isEnemy && (
              <Popup>
                <div className="text-center p-1">
                  <p className="font-extrabold text-[10px] uppercase text-rose-600">
                    Enemy Zone
                  </p>
                  <p className="text-[9px] font-bold text-gray-500">
                    Owned by {sq.owner}
                  </p>
                </div>
              </Popup>
            )}
          </Polygon>
        );
      })}
    </>
  );
};

// ─── Main Map Component ────────────────────────────────────────────────
const TerritoryMap = () => {
  const { currentLocation, pathHistory, updateLocation } = useGameStore();
  const [error, setError] = useState(null);
  const [shouldFollow, setShouldFollow] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Waiting for GPS...");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation]);

  const center = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [27.7172, 85.324];

  return (
    <div className="h-full w-full relative bg-gray-50">
      <MapContainer
        center={center}
        zoom={18}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={false}>
        <TileLayer
          attribution="&copy; OSM"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shouldFollow && currentLocation && <RecenterMap center={center} />}

        <SeamlessGrid />

        {/* Trail */}
        {pathHistory.length > 1 && (
          <Polyline
            positions={pathHistory}
            color="#6366f1"
            weight={6}
            opacity={0.4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>
              <div className="text-center p-1 font-black text-[10px] uppercase tracking-tighter">
                Your Position
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Status UI */}
      <div className="absolute top-4 right-4 z-[20] flex flex-col gap-2">
        <button
          onClick={() => setShouldFollow(!shouldFollow)}
          className={`p-3 rounded-2xl shadow-xl transition-all ${shouldFollow ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white text-gray-600"}`}>
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-6 left-6 z-[20]">
        <div className="bg-white/95 p-4 rounded-[2rem] border border-gray-100 shadow-2xl flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-md bg-rose-500 shadow-sm" />
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-none">
              Enemy Block
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-md bg-indigo-500 shadow-sm" />
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-none">
              Your Block
            </span>
          </div>
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-4 h-4 rounded-md border border-gray-300" />
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-none">
              Unclaimed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerritoryMap;
