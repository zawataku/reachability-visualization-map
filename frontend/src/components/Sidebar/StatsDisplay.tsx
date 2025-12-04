import type { Stats } from "../../types";

interface StatsDisplayProps {
    stats: Stats;
}

const StatsDisplay = ({ stats }: StatsDisplayProps) => {
    return (
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
                        <div className="font-bold text-gray-800 text-lg">{Math.round(stats.coveredPop).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400">人</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                        <div className="text-[10px] text-gray-500 mb-1">エリア総人口</div>
                        <div className="font-bold text-gray-800 text-lg">{Math.round(stats.totalPop).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400">人</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsDisplay;
