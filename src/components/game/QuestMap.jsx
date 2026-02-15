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
import { Navigation, Video } from "lucide-react";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

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
      width:24px;height:24px;border-radius:50%;
      background:${bg};border:2px solid white;
      box-shadow:0 2px 4px rgba(0,0,0,0.2);
      display:flex;align-items:center;justify-content:center;
      position:relative;color:white;
    ">${svg}${check}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};
const FOOTPRINT_ICON = L.divIcon({
  html: `<div style="width:8px;height:8px;background:#6366f1;border-radius:50%;opacity:0.6;box-shadow:0 0 4px #6366f1;"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const USER_ICON = L.divIcon({
  html: `<div style="width:16px;height:16px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(239, 68, 68, 0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const FitBounds = ({ points, distance }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      // Filter out invalid points
      const validPoints = points.filter(p => p && p[0] != null && p[1] != null);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        // If we are very close to the quest, zoom in much more
        const padding = distance < 20 ? [100, 100] : [50, 50];
        const maxZoom = distance < 10 ? 20 : (distance < 30 ? 19 : 18);
        map.fitBounds(bounds, { padding, maxZoom });
      }
    }
  }, [points, map, distance]);
  return null;
};

const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, map, zoom]);
  return null;
};

const QuestMap = () => {
  const { currentLocation, pathHistory, updateLocation, quests, selectedQuestId, setSelectedQuest, viewingQuestId, setViewingQuestId, setEngagedQuest, isAITracking, skipQuest } = useGameStore();
  const [error, setError] = useState(null);
  const [shouldFollow, setShouldFollow] = useState(true);

  const selectedQuest = quests.find(q => q.id === selectedQuestId);
  const distToQuest = (currentLocation && selectedQuest)
    ? L.latLng(currentLocation.lat, currentLocation.lng).distanceTo(L.latLng(selectedQuest.lat, selectedQuest.lng))
    : 1000;

  // Helper to check if user is near a quest
  const isNear = (q) => {
    if (!currentLocation || !q.lat || !q.lng) return false;
    const R = 6371000;
    const dLat = ((q.lat - currentLocation.lat) * Math.PI) / 180;
    const dLng = ((q.lng - currentLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((currentLocation.lat * Math.PI) / 180) *
      Math.cos((q.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c <= (q.radiusMeters || 0.005);
  };

  const currentAvailableQuest = quests.find(q => q.type === "place" && !q.completed && isNear(q));

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

  const defaultCenter = currentLocation ? [currentLocation.lat, currentLocation.lng] : [27.7172, 85.324];
  const center = currentLocation ? [currentLocation.lat, currentLocation.lng] : defaultCenter;

  return (
    <div className="h-full w-full relative bg-gray-50">
      <MapContainer
        center={defaultCenter}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={false}>
        <TileLayer
          attribution="&copy; OSM"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {shouldFollow && currentLocation && !selectedQuest && <RecenterMap center={center} />}

        {/* Dynamic Bounds: Show Both User and Quest with proximity-based zoom */}
        {currentLocation && selectedQuest && (
          <FitBounds
            points={[
              [currentLocation.lat, currentLocation.lng],
              [selectedQuest.lat, selectedQuest.lng]
            ]}
            distance={distToQuest}
          />
        )}

        {/* Footprint Trail (Path History) */}
        {pathHistory.length > 0 && pathHistory.map((pt, i) => (
          (pt && pt[0] != null && pt[1] != null) && (
            <Marker
              key={`fp-${i}`}
              position={[pt[0], pt[1]]}
              icon={FOOTPRINT_ICON}
              interactive={false}
            />
          )
        ))}

        {/* Selected Quest Target Path */}
        {selectedQuest?.type === "walk" && selectedQuest.targetPath && (
          <Polyline
            positions={selectedQuest.targetPath}
            color="#0ea5e9"
            weight={6}
            opacity={0.4}
            lineCap="round"
          />
        )}

        {/* Quest Marker (Only show the selected one) */}
        {quests.map((q) => (
          (q.lat && q.lng && q.id === selectedQuestId) && (
            <Marker
              key={q.id}
              position={[q.lat, q.lng]}
              eventHandlers={{
                click: () => {
                  setViewingQuestId(q.id);
                  setSelectedQuest(q.id);
                }
              }}
              icon={getQuestIcon(q.icon || (q.type === 'walk' ? 'pin' : 'pin'), q.completed)}>
              <Popup>
                <div className="text-center p-1 min-w-[140px]">
                  <p className="font-black text-xs text-gray-900 leading-tight mb-1 uppercase">{q.title}</p>
                  <p className="text-[10px] text-gray-500 mb-2 font-medium">{q.description}</p>

                  {q.completed ? (
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">Goal Reached</span>
                  ) : (
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-tighter">+{q.points} P</span>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* User Marker */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={USER_ICON}>
            <Popup>
              <div className="text-center p-2 min-w-[120px]">
                <p className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2">My Position</p>
                {currentAvailableQuest && (
                  <p className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase mb-1">
                    Arrived At Objective
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Primary Navigation Path: "The Way" */}
        {currentLocation && selectedQuest && !selectedQuest.completed && selectedQuest.lat != null && (
          <>
            {/* Thicker Outer Glow Line */}
            <Polyline
              positions={[
                [currentLocation.lat, currentLocation.lng],
                [selectedQuest.lat, selectedQuest.lng]
              ]}
              color="#6366f1"
              weight={8}
              opacity={0.15}
            />
            {/* Dashed Active Line */}
            <Polyline
              positions={[
                [currentLocation.lat, currentLocation.lng],
                [selectedQuest.lat, selectedQuest.lng]
              ]}
              color="#6366f1"
              weight={4}
              dashArray="1, 10"
              lineCap="round"
              opacity={0.8}
            />
          </>
        )}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[20] flex flex-col gap-2">
        <button
          onClick={() => setShouldFollow(!shouldFollow)}
          className={`p-3 rounded-2xl shadow-xl transition-all ${shouldFollow
            ? "bg-indigo-600 text-white shadow-indigo-200"
            : "bg-white text-gray-600 shadow-sm"
            }`}>
          <Navigation className={`w-5 h-5 ${shouldFollow ? "animate-pulse" : ""}`} />
        </button>
      </div>

      <div className="absolute bottom-6 left-6 right-6 lg:right-auto z-[20] flex flex-wrap items-center gap-x-4 gap-y-2 bg-white/95 px-4 py-3 rounded-2xl border border-gray-100 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-600 shadow-sm flex items-center justify-center text-white" dangerouslySetInnerHTML={{ __html: QUEST_ICONS.pin }} />
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-tight">Objective</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white" />
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-tight">Me</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 opacity-60" />
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-tight">Trail</span>
        </div>
      </div>
    </div>
  );
};

export default QuestMap;
