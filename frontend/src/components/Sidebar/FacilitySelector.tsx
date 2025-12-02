import type { Facility } from "../../types";

interface FacilitySelectorProps {
    selectedFacility: Facility | null;
}

const FacilitySelector = ({ selectedFacility }: FacilitySelectorProps) => {
    return (
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
    );
};

export default FacilitySelector;
