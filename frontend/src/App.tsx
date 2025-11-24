import { useState } from "react";
import Map from "./components/Map";
import type { Facility } from "./components/Map";
import type { FeatureCollection } from "geojson";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!selectedFacility) {
      alert("地図上の施設を選択してください");
      return;
    }

    setIsLoading(true);
    setIsochroneData(null);

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
        cutoffSec: "3600",
      });

      // バックエンド(OTP)へのリクエスト
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
    <div className="flex h-screen w-screen flex-row">
      <div className="w-1/3 max-w-120 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10 shrink-0">
        <div className="p-6 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">生活交通シミュレータ</h1>
          <p className="text-xs mt-1 opacity-80">施設への到達可能性を可視化</p>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">1. 目的地 (地図から選択)</label>
            <div className={`p-3 rounded-lg border-2 ${selectedFacility ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              {selectedFacility ? (
                <div>
                  <div className="text-xs text-blue-600 font-bold mb-1">選択中</div>
                  <div className="text-lg font-bold text-gray-800">{selectedFacility.name}</div>
                  <div className="text-sm text-gray-500">{selectedFacility.type === 'hospital' ? '病院' : 'スーパー'}</div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm text-center py-2">
                  地図上のマーカーを<br />クリックしてください
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">2. 想定シナリオ</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
            >
              {SCENARIOS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 px-1">
              {SCENARIOS.find(s => s.id === selectedScenarioId)?.description} に間に合うエリアを表示
            </p>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || !selectedFacility}
            className={`
              w-full py-4 rounded-lg font-bold text-white shadow-md transition-all mt-4
              ${isLoading || !selectedFacility
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 hover:shadow-lg active:transform active:scale-95'}
            `}
          >
            {isLoading ? '計算中...' : '到達圏を表示'}
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
          Powered by OpenTripPlanner / React + Vite
        </div>
      </div>

      <div className="flex-1 relative">
        <Map
          facilities={FACILITIES}
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
          isochroneData={isochroneData}
        />

        {isochroneData && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded shadow-lg z-1000 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 opacity-50 border border-blue-600 block"></span>
              <span>到達可能エリア</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;