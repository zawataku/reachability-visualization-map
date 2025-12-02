import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";

const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export interface Facility {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'hospital' | 'supermarket';
}

interface Stats {
  totalPop: number;
  coveredPop: number;
  percentage: number;
}

// ポリゴンのバウンディングボックス中心点を計算
function getPolygonCentroid(geometry: Geometry): [number, number] | null {
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const processRing = (ring: number[][]) => {
    ring.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach(processRing);
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach(poly => poly.forEach(processRing));
  }

  if (minX === Infinity) return null;
  return [(minX + maxX) / 2, (minY + maxY) / 2]; // [lon, lat]
}

// 点がポリゴン内にあるか判定 (Ray Casting Algorithm)
function isPointInPolygon(point: [number, number], polygon: Polygon): boolean {
  const x = point[0], y = point[1];
  let inside = false;

  // 外側のリングのみで判定
  const ring = polygon.coordinates[0];

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
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

const InternalMap = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  isochroneData
}: {
  facilities: Facility[],
  selectedFacility: Facility | null,
  onSelectFacility: (f: Facility) => void,
  isochroneData: FeatureCollection | null
}) => {
  // 初期位置（富山県・石川県境付近）
  const initialPosition: [number, number] = [36.85, 137.0];

  const geoJsonStyle = {
    fillColor: "#3B82F6",
    weight: 1,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.4
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

const FACILITIES: Facility[] = [
  { id: '1', name: '金沢医科大学氷見市民病院', lat: 36.857236126567436, lon: 136.96744588128246, type: 'hospital' },
  { id: '2', name: 'アルビス 氷見店', lat: 36.83954104779495, lon: 136.98720552009104, type: 'supermarket' },
  { id: '3', name: 'イオンモール高岡', lat: 36.72398312341095, lon: 137.01681490346044, type: 'supermarket' },
];

const SCENARIOS = [
  { id: 'morning', label: '午前中で到達可能', time: '11:30:00', description: '11:30までに到着' },
  { id: 'afternoon', label: '昼過ぎ(15時頃)までに到達可能', time: '14:30:00', description: '14:30までに到着' },
  { id: 'evening', label: '夕方までに到達可能', time: '17:00:00', description: '17:00までに到着' },
];

function App() {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0].id);
  const [isochroneData, setIsochroneData] = useState<FeatureCollection | null>(null);
  const [populationData, setPopulationData] = useState<FeatureCollection | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPopulationData = async () => {
      try {
        const res = await fetch("/mesh_data/17.json");
        if (!res.ok) throw new Error("Population data not found");
        const data = await res.json();
        setPopulationData(data);
        console.log("Population data loaded:", data.features.length, "meshes");
      } catch (error) {
        console.error("Failed to load population data:", error);
      }
    };
    loadPopulationData();
  }, []);

  useEffect(() => {
    if (!isochroneData || !populationData || isochroneData.features.length === 0) return;

    // 到達圏ポリゴンの取得
    const isoFeature = isochroneData.features[0];
    const isoGeometry = isoFeature.geometry;

    if (!isoGeometry || (isoGeometry.type !== "Polygon" && isoGeometry.type !== "MultiPolygon")) return;

    let totalPop = 0;
    let coveredPop = 0;

    // ポリゴンリストの作成（MultiPolygon対応）
    const polygons: Polygon[] = isoGeometry.type === "Polygon"
      ? [isoGeometry as Polygon]
      : (isoGeometry as MultiPolygon).coordinates.map(coords => ({ type: "Polygon", coordinates: coords }));

    // 人口メッシュごとの判定
    populationData.features.forEach((feature: Feature) => {
      const props = feature.properties || {};
      const pop = props.population || 0;
      totalPop += pop;

      if (feature.geometry) {
        // メッシュの中心点を計算
        const center = getPolygonCentroid(feature.geometry);
        if (!center) return;

        // 中心点が到達圏ポリゴンのいずれかに含まれるか判定
        const isCovered = polygons.some(poly => isPointInPolygon(center, poly));

        if (isCovered) {
          coveredPop += pop;
        }
      }
    });

    setStats({
      totalPop,
      coveredPop,
      percentage: totalPop > 0 ? (coveredPop / totalPop) * 100 : 0,
    });
  }, [isochroneData, populationData]);

  const handleSearch = async () => {
    if (!selectedFacility) {
      alert("地図上の施設を選択してください");
      return;
    }

    setIsLoading(true);
    setIsochroneData(null);
    setStats(null);

    const scenario = SCENARIOS.find(s => s.id === selectedScenarioId);
    const targetTime = scenario?.time || '12:00:00';
    const targetDate = '2025-11-01';

    try {
      const params = new URLSearchParams({
        fromPlace: "36.79203438947747,137.05797185098484",
        toPlace: `${selectedFacility.lat},${selectedFacility.lon}`,
        arriveBy: 'true',
        date: targetDate,
        time: targetTime,
        mode: 'WALK,TRANSIT',
        maxWalkDistance: '1000',
        cutoffSec: "21600",
      });

      const res = await fetch(`http://localhost:8080/otp/routers/default/isochrone?${params.toString()}`);
      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();
      setIsochroneData(data);

    } catch (error) {
      console.error(error);
      alert("到達圏データの取得に失敗しました。OTPが起動しているか確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-row bg-gray-50 text-gray-800 font-sans overflow-hidden">
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-6 bg-blue-600 text-white shadow-md z-10">
          <h1 className="text-xl font-bold tracking-wide">生活交通シミュレータ</h1>
          <p className="text-xs mt-1 opacity-80 font-medium">施設への到達可能性と人口カバー率</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">1. 目的地 (地図から選択)</label>
            <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${selectedFacility ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-gray-50 border-dashed'}`}>
              {selectedFacility ? (
                <div>
                  <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">選択中</span>
                  <div className="text-lg font-bold text-gray-800 leading-tight">{selectedFacility.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{selectedFacility.type === 'hospital' ? '🏥 病院' : '🛒 スーパー'}</div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm text-center py-4">
                  地図上のマーカーを<br />クリックしてください
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">2. 想定シナリオ</label>
            <div className="relative">
              <select
                className="w-full p-3 pl-4 pr-10 border border-gray-300 rounded-xl bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow text-sm"
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
              >
                {SCENARIOS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 px-1 mt-1">
              {SCENARIOS.find(s => s.id === selectedScenarioId)?.description} に間に合うエリアを表示
            </p>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || !selectedFacility}
            className={`
              w-full py-4 rounded-xl font-bold text-white shadow-md transition-all duration-200
              ${isLoading || !selectedFacility
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-[0.98]'}
            `}
          >
            {isLoading ? '計算中...' : '到達圏を表示'}
          </button>

          {stats && (
            <div className="pt-6 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-4 block">3. 分析結果</label>

              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm font-bold text-gray-700">人口カバー率</span>
                    <span className="text-3xl font-extrabold text-blue-600">{stats.percentage.toFixed(1)}<span className="text-lg text-gray-500 ml-0.5">%</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                    <div className="text-[10px] text-gray-500 mb-1">到達可能人口</div>
                    <div className="font-bold text-gray-800 text-lg">{stats.coveredPop.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">人</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                    <div className="text-[10px] text-gray-500 mb-1">エリア総人口</div>
                    <div className="font-bold text-gray-800 text-lg">{stats.totalPop.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">人</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-[10px] text-gray-400 text-center">
          Powered by OpenTripPlanner & React Leaflet
        </div>
      </div>

      <div className="flex-1 relative">
        <InternalMap
          facilities={FACILITIES}
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
          isochroneData={isochroneData}
        />

        {isochroneData && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-1000 text-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 opacity-40 border border-blue-600 rounded-sm block"></span>
              <span className="font-medium text-gray-700">到達可能エリア</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;