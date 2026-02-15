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
  const { currentLocation, pathHistory, updateLocation, quests, engagedQuest, selectedQuestId, setSelectedQuest, viewingQuestId, setViewingQuestId, setEngagedQuest, isAITracking, skipQuest } = useGameStore();
  const [error, setError] = useState(null);
  const [shouldFollow, setShouldFollow] = useState(true);

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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
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

        {/* Footprint Trail (Path History) - HIDDEN for cleaner UI */}
        {/*
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
        */}

        {/* Navigation Lines REMOVED as per request */}

        {/* Quest Marker (Only show the engaged one for cleaner navigation) */}
        {quests.map((q) => {
          // FILTER: If we are engaged in a quest, ONLY show that quest.
          // If NOT engaged, show all available (or logic as desired).
          // User said: "show one quest at a time that is started... dont show others"
          if (engagedQuest && engagedQuest.id !== q.id) return null;

          return (q.lat && q.lng) && (
            <Marker
              key={q.id}
              position={[q.lat, q.lng]}
              zIndexOffset={1000}
              eventHandlers={{
                click: () => {
                  // DISABLE INTERACTION IF COMPLETED OR SKIPPED
                  if (!q.completed && !q.skipped) {
                    if (engagedQuest?.id === q.id) {
                      setViewingQuestId(q.id);
                    } else {
                      setViewingQuestId(q.id);
                      setSelectedQuest(q.id);
                      setEngagedQuest(q);
                    }
                  }
                }
              }}
              // Opacity reduced for completed/skipped to show they are inactive
              opacity={q.completed || q.skipped ? 0.6 : 1}
              icon={getQuestIcon(q.icon || (q.type === 'walk' ? 'pin' : 'pin'), q.completed, q.skipped)}>
              {/* Only show popup if active */}
              {!q.completed && !q.skipped && (
                <Popup>
                  <div className="text-center p-1 min-w-[140px]">
                    <p className="font-black text-xs text-gray-900 leading-tight mb-1 uppercase">{q.title}</p>
                    <p className="text-[10px] text-gray-500 mb-2 font-medium">{q.description}</p>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
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

      <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-4 lg:right-auto z-[20] flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-white/95 px-3 py-2 rounded-xl border border-gray-100 shadow-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-sm flex items-center justify-center text-white" dangerouslySetInnerHTML={{ __html: QUEST_ICONS.pin }} />
          <span className="text-[8px] font-black text-gray-700 uppercase tracking-tight">Quest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
          <span className="text-[8px] font-black text-gray-700 uppercase tracking-tight">Me</span>
        </div>
        <div className="flex items-center gap-1.5" title="Trail: your walking path (footprints as you move)">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-60" />
          <span className="text-[8px] font-black text-gray-700 uppercase tracking-tight">Trail</span>
        </div>
      </div>
    </div>
  );
};

export default QuestMap;
