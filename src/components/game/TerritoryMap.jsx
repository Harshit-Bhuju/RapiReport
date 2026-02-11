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
import {
  useGameStore,
  generateHexesForBounds,
  getHexVertices,
} from "../../store/gameStore";
import L from "leaflet";
import { Navigation, LocateFixed, ShieldAlert } from "lucide-react";

// Fix marker icon
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ─── Recenter ──────────────────────────────────────────────────────────
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// ─── Hex Grid Renderer ─────────────────────────────────────────────────
const HexGrid = () => {
  const map = useMap();
  const capturedHexes = useGameStore((s) => s.capturedHexes);
  const [visibleHexes, setVisibleHexes] = useState([]);

  const updateHexes = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom < 13) {
      setVisibleHexes([]);
      return;
    }

    const b = map.getBounds();
    const hexes = generateHexesForBounds(
      b.getNorth(),
      b.getSouth(),
      b.getEast(),
      b.getWest(),
    );
    setVisibleHexes(hexes);
  }, [map]);

  useMapEvents({ moveend: updateHexes, zoomend: updateHexes });

  useEffect(() => {
    const t = setTimeout(updateHexes, 300);
    return () => clearTimeout(t);
  }, [updateHexes]);

  return (
    <>
      {visibleHexes.map((hex) => {
        const captured = capturedHexes[hex.id];
        const isMine = captured?.owner === "You";
        const isEnemy = captured && !isMine;
        const vertices = getHexVertices(hex.centerLat, hex.centerLng);

        // INTVL Style: ALL hexes are filled with color
        // Mine = bright cyan, Enemy = their color, Unclaimed = hex's base color
        let fillColor, strokeColor, fillOpacity, strokeWeight, strokeOpacity;

        if (isMine) {
          fillColor = "#3b82f6"; // Bright blue (like the large blue areas in INTVL)
          strokeColor = "#60a5fa";
          fillOpacity = 0.65;
          strokeWeight = 1.5;
          strokeOpacity = 0.9;
        } else if (isEnemy) {
          fillColor = "#f43f5e";
          strokeColor = "#fb7185";
          fillOpacity = 0.55;
          strokeWeight = 1;
          strokeOpacity = 0.8;
        } else {
          // Unclaimed = vibrant colorful fill (like INTVL screenshot)
          fillColor = hex.color;
          strokeColor = hex.color;
          fillOpacity = 0.45;
          strokeWeight = 0.5;
          strokeOpacity = 0.6;
        }

        return (
          <Polygon
            key={hex.id}
            positions={vertices}
            pathOptions={{
              color: strokeColor,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
              weight: strokeWeight,
              opacity: strokeOpacity,
            }}
          />
        );
      })}
    </>
  );
};

// ─── Main Map ──────────────────────────────────────────────────────────
const TerritoryMap = () => {
  const { currentLocation, pathHistory, updateLocation } = useGameStore();
  const [error, setError] = useState(null);
  const [isFirstFix, setIsFirstFix] = useState(true);
  const [shouldFollow, setShouldFollow] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        setError(null);
        if (isFirstFix) setIsFirstFix(false);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation, isFirstFix]);

  const center = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [27.7172, 85.324];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={false}>
        {/* Dark Map Base (like INTVL) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {shouldFollow && currentLocation && <RecenterMap center={center} />}

        {/* Colorful Hex Grid */}
        <HexGrid />

        {/* Movement Trail - Neon Line */}
        {pathHistory.length > 1 && (
          <>
            <Polyline
              positions={pathHistory}
              color="#ffffff"
              weight={14}
              opacity={0.15}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              positions={pathHistory}
              color="#ffffff"
              weight={4}
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {/* User Marker */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-black text-sm">YOUR POSITION</p>
                <p className="text-[10px] text-blue-600 font-bold">
                  CAPTURING TERRITORY...
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-20 right-4 z-[1001] flex flex-col gap-2">
        <button
          onClick={() => setShouldFollow(!shouldFollow)}
          className={`p-3 rounded-2xl shadow-2xl border transition-all ${
            shouldFollow
              ? "bg-blue-500 text-white border-blue-400"
              : "bg-gray-900/80 text-gray-300 border-gray-700 backdrop-blur-sm"
          }`}>
          <Navigation
            className={`w-5 h-5 ${shouldFollow ? "fill-current" : ""}`}
          />
        </button>
        <button
          onClick={() => setShouldFollow(true)}
          className="p-3 bg-gray-900/80 text-gray-300 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute top-4 left-4 right-16 z-[1001]">
          <div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl backdrop-blur-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        </div>
      )}

      {/* GPS */}
      {!error && (
        <div className="absolute bottom-4 left-4 z-[1001]">
          <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-700 shadow-xl flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${currentLocation ? "bg-green-400" : "bg-yellow-400"}`}
            />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
              {currentLocation ? "LIVE" : "SEARCHING..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerritoryMap;
