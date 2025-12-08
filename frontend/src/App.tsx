import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";
import { useAppLogic, SCENARIOS, FACILITIES } from "./hooks/useAppLogic";

function App() {
  const {
    selectedFacility,
    setSelectedFacility,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedYear,
    setSelectedYear,
    isochroneData,
    stats,
    isLoading,
    handleSearch
  } = useAppLogic();

  return (
    <div className="flex h-screen w-screen flex-row bg-gray-50 text-gray-800 font-sans overflow-hidden">
      <Sidebar
        selectedFacility={selectedFacility}
        scenarios={SCENARIOS}
        selectedScenarioId={selectedScenarioId}
        onSelectScenarioId={setSelectedScenarioId}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        onSearch={handleSearch}
        isLoading={isLoading}
        stats={stats}
      />

      <div className="flex-1 relative">
        <Map
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