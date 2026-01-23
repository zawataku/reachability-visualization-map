import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
import type { Facility } from "../../types";

const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const RecenterMap = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
};

interface MapProps {
    facilities: Facility[];
    selectedFacility: Facility | null;
    onSelectFacility: (f: Facility) => void;
    isochroneData: FeatureCollection | null;
}

const Map = ({
    facilities,
    selectedFacility,
    onSelectFacility,
    isochroneData
}: MapProps) => {
    // 初期位置（珠洲市）
    const initialPosition: [number, number] = [37.43671338485977, 137.2605634716872];

    const geoJsonStyle = {
        fillColor: "#C62828",
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.5
    };

    return (
        <MapContainer center={initialPosition} zoom={11} style={{ height: "100%", width: "100%" }}>
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
                        <strong className="text-3xl">{facility.name}</strong>
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
