import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGameStore } from "../../store/gameStore";
import L from "leaflet";
import { Navigation, MapPin } from "lucide-react";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const questIcon = (completed) =>
  L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${completed ? "#22c55e" : "#6366f1"};
      border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "><span style="font-size:14px">${completed ? "✓" : "?"}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

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
            icon={questIcon(q.completed)}>
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

      <div className="absolute bottom-6 left-6 z-[20] flex items-center gap-3 bg-white/95 px-4 py-2.5 rounded-2xl border border-gray-100 shadow-lg">
        <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow" />
        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
          Quest target
        </span>
        <div className="w-px h-4 bg-gray-200" />
        <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
          Done
        </span>
      </div>
    </div>
  );
};

export default QuestMap;
