/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
// @ts-ignore: allow importing CSS without type declarations
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix default icons (only in browser)
if (typeof window !== "undefined") {
  delete (L.Icon.Default as any).prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
}

interface Location {
  lat: number;
  lng: number;
}
interface MapComponentProps {
  initialPosition: Location;
  onLocationChange?: (location: Location) => void;
  draggable?: boolean;
}

function LocationMarker({
  position,
  setPosition,
  onLocationChange,
  draggable,
}: {
  position: Location;
  setPosition: (pos: Location) => void;
  onLocationChange: (pos: Location) => void;
  draggable?: boolean;
}) {
  const map = useMapEvents(
    draggable
      ? {
          click(e) {
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPos);
            onLocationChange(newPos);
          },
        }
      : {}
  );

  useEffect(() => {
    if (position.lat !== 0 && position.lng !== 0) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return position.lat !== 0 && position.lng !== 0 ? (
    <Marker position={position}>
      <Popup>Report Location</Popup>
    </Marker>
  ) : null;
}

export default function MapComponent({
  initialPosition,
  onLocationChange,
  draggable = true,
}: MapComponentProps) {
  const [position, setPosition] = useState<Location>(initialPosition);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  return (
    <MapContainer
      center={initialPosition}
      zoom={13}
      style={{ height: "400px", width: "100%", borderRadius: "12px" }}
      className="rounded-xl overflow-hidden"
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      />
      <LocationMarker
        draggable={draggable}
        position={position}
        setPosition={setPosition}
        onLocationChange={onLocationChange ?? (() => {})}
      />
    </MapContainer>
  );
}
