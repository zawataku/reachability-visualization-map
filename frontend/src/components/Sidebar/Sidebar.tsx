import type { Facility, Stats } from "../../types";
import FacilitySelector from "./FacilitySelector";
import ScenarioSelector from "./ScenarioSelector";
import StatsDisplay from "./StatsDisplay";

interface Scenario {
    id: string;
    label: string;
    time: string;
    description: string;
}

interface SidebarProps {
    selectedFacility: Facility | null;
    scenarios: Scenario[];
    selectedScenarioId: string;
    onSelectScenarioId: (id: string) => void;
    onSearch: () => void;
    isLoading: boolean;
    stats: Stats | null;
}

const Sidebar = ({
    selectedFacility,
    scenarios,
    selectedScenarioId,
    onSelectScenarioId,
    onSearch,
    isLoading,
    stats
}: SidebarProps) => {
    return (
        <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col shadow-xl z-20 shrink-0">
            <div className="p-6 bg-blue-600 text-white shadow-md z-10">
                <h1 className="text-xl font-bold tracking-wide">生活交通シミュレータ</h1>
                <p className="text-xs mt-1 opacity-80 font-medium">施設への到達可能性と人口カバー率</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <FacilitySelector selectedFacility={selectedFacility} />

                <ScenarioSelector
                    scenarios={scenarios}
                    selectedScenarioId={selectedScenarioId}
                    onSelectScenarioId={onSelectScenarioId}
                />

                <button
                    onClick={onSearch}
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

                {stats && <StatsDisplay stats={stats} />}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 text-[10px] text-gray-400 text-center">
                Powered by OpenTripPlanner & React Leaflet
            </div>
        </div>
    );
};

export default Sidebar;
