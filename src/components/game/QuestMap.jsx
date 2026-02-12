import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGameStore } from "../../store/gameStore";
import L from "leaflet";
import { Navigation } from "lucide-react";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Inline SVG icons for map markers (helps users navigate by recognizing the place type)
const QUEST_ICONS = {
  park: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M12 22v-4"/><path d="M12 18a4 4 0 0 0 4-4c0-2-2-4-4-6-2 2-4 4-4 6a4 4 0 0 0 4 4z"/><path d="M8 14l-3 4h14l-3-4"/><path d="M9 10H7"/><path d="M15 10h-2"/><path d="M12 2v2"/></svg>`,
  health: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  community: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M18 8c0 4.97-6 10-6 10s-6-5.03-6-10a6 6 0 0 1 12 0Z"/><circle cx="12" cy="8" r="2"/></svg>`,
};

const getQuestIcon = (iconType, completed) => {
  const svg = QUEST_ICONS[iconType] || QUEST_ICONS.pin;
  const bg = completed ? "#22c55e" : "#6366f1";
  const check = completed ? `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;color:white;text-shadow:0 0 2px rgba(0,0,0,0.5)">✓</span>` : "";
  return L.divIcon({
    html: `<div style="
      width:40px;height:40px;border-radius:50%;
      background:${bg};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
      position:relative;color:white;
    ">${svg}${check}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const QuestMap = () => {
  const { currentLocation, pathHistory, updateLocation, quests } = useGameStore();
  const [error, setError] = useState(null);
  const [shouldFollow, setShouldFollow] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("GPS not available");
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
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={false}>
        <TileLayer
          attribution="&copy; OSM"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shouldFollow && currentLocation && <RecenterMap center={center} />}

        {/* Trail */}
        {pathHistory.length > 1 && (
          <Polyline
            positions={pathHistory}
            color="#6366f1"
            weight={5}
            opacity={0.5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Quest targets */}
        {quests.map((q) => (
          <Marker
            key={q.id}
            position={[q.lat, q.lng]}
            icon={getQuestIcon(q.icon || "pin", q.completed)}>
            <Popup>
              <div className="text-center p-1 min-w-[120px]">
                <p className="font-bold text-sm text-gray-900">{q.title}</p>
                <p className="text-xs text-gray-500">{q.description}</p>
                {q.completed ? (
                  <span className="text-xs font-semibold text-green-600">
                    Completed +{q.points} pts
                  </span>
                ) : (
                  <span className="text-xs text-indigo-600">
                    Go here to earn {q.points} pts
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>
              <div className="text-center p-1 font-bold text-xs uppercase tracking-tight">
                You are here
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[20]">
        <button
          onClick={() => setShouldFollow(!shouldFollow)}
          className={`p-3 rounded-2xl shadow-xl transition-all ${
            shouldFollow
              ? "bg-indigo-600 text-white shadow-indigo-200"
              : "bg-white text-gray-600"
          }`}>
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-[20] bg-amber-100 text-amber-800 text-sm font-medium py-2 px-4 rounded-xl text-center">
          {error}
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-[20] flex flex-wrap items-center gap-x-4 gap-y-2 bg-white/95 px-4 py-3 rounded-2xl border border-gray-100 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white shadow flex items-center justify-center text-white [&_svg]:w-4 [&_svg]:h-4" dangerouslySetInnerHTML={{ __html: QUEST_ICONS.park }} />
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Park</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white shadow flex items-center justify-center text-white [&_svg]:w-4 [&_svg]:h-4" dangerouslySetInnerHTML={{ __html: QUEST_ICONS.health }} />
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Health</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white shadow flex items-center justify-center text-white [&_svg]:w-4 [&_svg]:h-4" dangerouslySetInnerHTML={{ __html: QUEST_ICONS.community }} />
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Community</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center text-white font-bold text-xs">✓</div>
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Done</span>
        </div>
      </div>
    </div>
  );
};

export default QuestMap;
