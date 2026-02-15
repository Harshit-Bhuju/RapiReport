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

const getQuestIcon = (iconType, completed, skipped) => {
  const svg = QUEST_ICONS[iconType] || QUEST_ICONS.pin;

  if (skipped) {
    return L.divIcon({
      html: `<div style="
        width:24px;height:24px;border-radius:50%;
        background:#ef4444;border:2px solid white;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);
        display:flex;align-items:center;justify-content:center;
        position:relative;color:white;font-weight:bold;font-size:14px;
      ">✕</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  if (completed) {
    return L.divIcon({
      html: `<div style="
        width:24px;height:24px;border-radius:50%;
        background:#22c55e;border:2px solid white;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);
        display:flex;align-items:center;justify-content:center;
        position:relative;color:white;font-weight:bold;font-size:14px;
      ">✓</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  return L.divIcon({
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:#6366f1;border:2px solid white;
      box-shadow:0 2px 4px rgba(0,0,0,0.2);
      display:flex;align-items:center;justify-content:center;
      position:relative;color:white;
    ">${svg}</div>`,
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
      const validPoints = points.filter(p => p && p[0] != null && p[1] != null);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        const padding = [40, 40];
        // Zoom in when close; cap zoom-out so path stays visible at any distance
        const maxZoom = distance < 10 ? 20 : (distance < 50 ? 19 : 18);
        const minZoom = 12;
        map.fitBounds(bounds, { padding, maxZoom, minZoom });
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
  const { user, currentLocation, pathHistory, updateLocation, quests, engagedQuest, selectedQuestId, setSelectedQuest, viewingQuestId, setViewingQuestId, setEngagedQuest, isAITracking, skipQuest } = useGameStore();
  const [gpsStarted, setGpsStarted] = useState(false);
  const [error, setError] = useState(null);
  const [shouldFollow, setShouldFollow] = useState(true);

  // Manual GPS trigger to satisfy "User Gesture" requirement
  const startGps = () => {
    if (!("geolocation" in navigator)) {
      setError("GPS not supported by browser");
      return;
    }
    setGpsStarted(true);
  };

  useEffect(() => {
    if (!gpsStarted) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        setError(null);
      },
      (err) => {
        console.error("GPS Error:", err);
        setError(err.message === "User denied Geolocation" ? "Please enable GPS to play" : err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation, gpsStarted]);

  const selectedQuest = quests.find(q => q.id === selectedQuestId);
  const distToQuest = (currentLocation && selectedQuest)
    ? L.latLng(currentLocation.lat, currentLocation.lng).distanceTo(L.latLng(selectedQuest.lat, selectedQuest.lng))
    : 1000;

  // In zone = within quest radius (10m, 20m, ... 100m). Reached = within 0.5m (handled in popup).
  const isNear = (q) => {
    if (!currentLocation || !q.lat || !q.lng) return false;
    const distM = L.latLng(currentLocation.lat, currentLocation.lng).distanceTo(L.latLng(q.lat, q.lng));
    return distM <= (q.radiusMeters ?? 1);
  };

  const currentAvailableQuest = quests.find(q => q.type === "place" && !q.completed && isNear(q));

  const defaultCenter = currentLocation ? [currentLocation.lat, currentLocation.lng] : [27.7172, 85.324];
  const center = currentLocation ? [currentLocation.lat, currentLocation.lng] : defaultCenter;

  return (
    <div className="h-full w-full relative bg-slate-900 overflow-hidden rounded-3xl group">
      <MapContainer
        center={defaultCenter}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0 grayscale-[0.2] contrast-[1.1]"
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

        {/* User Marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={USER_ICON}
            zIndexOffset={2000}
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

        {/* Quest Marker (Show ONLY one quest at a time - engaged or current next one) */}
        {quests.map((q, idx) => {
          const currentIdx = user.questsToday ?? 0;
          const isEngagedMatch = engagedQuest && engagedQuest.id === q.id;
          const isNextMatch = !engagedQuest && idx === currentIdx;

          if (!isEngagedMatch && !isNextMatch) return null;
          if (q.completed || q.skipped) return null;

          return (q.lat && q.lng) && (
            <Marker
              key={q.id}
              position={[q.lat, q.lng]}
              zIndexOffset={1000}
              eventHandlers={{
                click: () => {
                  if (!q.completed && !q.skipped) {
                    setViewingQuestId(q.id);
                    setSelectedQuest(q.id);
                    setEngagedQuest(q);
                  }
                }
              }}
              opacity={q.completed || q.skipped ? 0.6 : 1}
              icon={getQuestIcon(q.icon || 'pin', q.completed, q.skipped)}>
              {!q.completed && !q.skipped && (
                <Popup className="quest-popup">
                  <div className="text-center p-2 min-w-[160px]">
                    <div className="w-8 h-8 mx-auto mb-2 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600" dangerouslySetInnerHTML={{ __html: QUEST_ICONS[q.icon] || QUEST_ICONS.pin }} />
                    <p className="font-black text-sm text-gray-900 leading-tight mb-1 uppercase tracking-tight">{q.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{q.description}</p>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* GPS START OVERLAY */}
      {!gpsStarted && (
        <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="max-w-xs w-full bg-white rounded-3xl p-8 shadow-2xl border border-white/50 space-y-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Navigation className="w-10 h-10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ready to explore?</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Click handle to start your GPS tracking and find local health quests near you.
              </p>
            </div>
            <button
              onClick={startGps}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all">
              Start Adventure
            </button>
            {error && (
              <p className="text-[10px] font-bold text-red-500 bg-red-50 py-2 rounded-lg border border-red-100 uppercase tracking-tighter">
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ERROR OVERLAY IF GPS FAILS AFTER START */}
      {gpsStarted && error && (
        <div className="absolute top-4 left-4 right-4 z-[50] animate-in slide-in-from-top duration-300">
          <div className="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border-2 border-white/20">
            <X className="w-5 h-5 flex-shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-wider">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-6 right-6 z-[20] flex flex-col gap-3">
        <button
          onClick={() => setShouldFollow(!shouldFollow)}
          className={`p-4 rounded-2xl shadow-2xl transition-all border-2 ${shouldFollow
            ? "bg-indigo-600 text-white border-indigo-400 shadow-indigo-200"
            : "bg-white text-gray-600 border-gray-50 shadow-sm"
            }`}>
          <Navigation className={`w-5 h-5 ${shouldFollow ? "animate-pulse" : ""}`} />
        </button>
      </div>

      <div className="absolute bottom-6 left-6 right-6 lg:right-auto z-[20] flex flex-wrap items-center gap-x-4 gap-y-2 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl border border-gray-100 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white" dangerouslySetInnerHTML={{ __html: QUEST_ICONS.pin }} />
          <span className="text-[9px] font-black text-gray-800 uppercase tracking-tight">Quest</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-md shadow-red-200" />
          <span className="text-[9px] font-black text-gray-800 uppercase tracking-tight">You</span>
        </div>
        <div className="flex items-center gap-2" title="Trail: your walking history">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 opacity-60 shadow-sm" />
          <span className="text-[9px] font-black text-gray-800 uppercase tracking-tight">Traces</span>
        </div>
      </div>
    </div>
  );
};

export default QuestMap;
