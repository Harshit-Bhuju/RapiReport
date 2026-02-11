import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGameStore } from "../../store/gameStore";
import L from "leaflet";

// Fix Leaflet marker icon issue in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const TerritoryMap = () => {
  const { currentLocation, pathHistory, updateLocation } = useGameStore();

  useEffect(() => {
    // Simulate movement for demo purposes if no real GPS movement
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
        },
        (error) => console.error("Error getting location:", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [updateLocation]);

  // Fallback location (Kathmandu)
  const center = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [27.7172, 85.324];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentLocation ? (
          <>
            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>
                You are here! <br /> Capturing territory...
              </Popup>
            </Marker>
            <Circle
              center={[currentLocation.lat, currentLocation.lng]}
              pathOptions={{ fillColor: "blue", color: "blue" }}
              radius={50}
            />
          </>
        ) : null}

        {pathHistory.length > 0 && (
          <Polyline positions={pathHistory} color="blue" />
        )}
      </MapContainer>
    </div>
  );
};

export default TerritoryMap;
