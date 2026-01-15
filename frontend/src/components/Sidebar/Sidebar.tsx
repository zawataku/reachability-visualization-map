import type { Facility, Stats } from "../../types";
import FacilitySelector from "./FacilitySelector";
import ScenarioSelector from "./ScenarioSelector";
import WalkDistanceSelector from "./WalkDistanceSelector";
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
    selectedYear: '2020' | '2065';
    onSelectYear: (year: '2020' | '2065') => void;
    maxWalkDistance: number;
    onSelectMaxWalkDistance: (distance: number) => void;
    showPopulation: boolean;
    onTogglePopulation: (show: boolean) => void;
    onSearch: () => void;
    isLoading: boolean;
    stats: Stats | null;
}

const Sidebar = ({
    selectedFacility,
    scenarios,
    selectedScenarioId,
    onSelectScenarioId,
    selectedYear,
    onSelectYear,
    maxWalkDistance,
    onSelectMaxWalkDistance,
    showPopulation,
    onTogglePopulation,
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

                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">人口データ基準年</span>
                    <div className="flex bg-gray-200 rounded-lg p-1 relative">
                        <button
                            onClick={() => onSelectYear('2020')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all z-10 ${selectedYear === '2020' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            2020年
                        </button>
                        <button
                            onClick={() => onSelectYear('2065')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all z-10 ${selectedYear === '2065' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            2065年(予想)
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">人口ヒートマップ</span>
                    <button
                        onClick={() => onTogglePopulation(!showPopulation)}
                        className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            ${showPopulation ? 'bg-blue-600' : 'bg-gray-200'}
                        `}
                    >
                        <span
                            className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${showPopulation ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </div>

                <WalkDistanceSelector
                    maxWalkDistance={maxWalkDistance}
                    onSelectMaxWalkDistance={onSelectMaxWalkDistance}
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
