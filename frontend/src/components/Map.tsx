import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
import { useEffect } from "react";

// Leafletアイコンの修正（Viteビルド時のパス問題を回避）
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// 施設データの型定義
export interface Facility {
    id: string;
    name: string;
    lat: number;
    lon: number;
    type: 'hospital' | 'supermarket';
}

interface MapProps {
    facilities: Facility[];
    selectedFacility: Facility | null;
    onSelectFacility: (facility: Facility) => void;
    isochroneData: FeatureCollection | null;
}

const RecenterMap = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
};

const Map = ({ facilities, selectedFacility, onSelectFacility, isochroneData }: MapProps) => {
    const initialPosition: [number, number] = [36.791630863926656, 137.0163640018638];

    const geoJsonStyle = {
        fillColor: "#D32F2F",
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.4
    };

    return (
        <MapContainer center={initialPosition} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院 | 淡色地図</a>'
            />

            {facilities.map((facility) => (
                <Marker
                    key={facility.id}
                    position={[facility.lat, facility.lon]}
                    eventHandlers={{
                        click: () => onSelectFacility(facility),
                    }}
                >
                    <Popup>
                        <strong>{facility.name}</strong><br />
                        {facility.type === 'hospital' ? '🏥 病院' : '🛒 スーパー'}
                    </Popup>
                </Marker>
            ))}

            {selectedFacility && (
                <RecenterMap center={[selectedFacility.lat, selectedFacility.lon]} />
            )}

            {isochroneData && (
                <GeoJSON
                    key={JSON.stringify(isochroneData)}
                    data={isochroneData}
                    style={geoJsonStyle}
                />
            )}
        </MapContainer>
    );
};

export default Map;