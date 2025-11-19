"use client";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import { useEffect } from "react";

const SearchField = ({ onLocationChange }: { onLocationChange: (loc: { lat: number; lng: number }) => void }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: "bar",
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result: any) => {
      onLocationChange({ lat: result.location.y, lng: result.location.x });
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, onLocationChange]);

  return null;
};

const SearchMap = ({ onLocationChange }: { onLocationChange: (loc: { lat: number; lng: number }) => void }) => {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <SearchField onLocationChange={onLocationChange} />
    </MapContainer>
  );
};

export default SearchMap;
