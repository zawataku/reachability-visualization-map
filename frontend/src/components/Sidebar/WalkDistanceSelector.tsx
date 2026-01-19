
import React from 'react';

const WALK_DISTANCE_OPTIONS = [300, 500, 1000, 1500, 2000];

interface WalkDistanceSelectorProps {
    maxWalkDistance: number;
    onSelectMaxWalkDistance: (distance: number) => void;
}

const WalkDistanceSelector: React.FC<WalkDistanceSelectorProps> = ({ maxWalkDistance, onSelectMaxWalkDistance }) => {
    // Find the index of the current value to control the slider
    const currentIndex = WALK_DISTANCE_OPTIONS.indexOf(maxWalkDistance);

    // Fallback to 500 (index 1) if something goes wrong
    const sliderValue = currentIndex !== -1 ? currentIndex : 1;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const index = parseInt(e.target.value, 10);
        const newValue = WALK_DISTANCE_OPTIONS[index];
        onSelectMaxWalkDistance(newValue);
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">最大徒歩距離</span>
                <span className="text-sm font-bold text-blue-600">{maxWalkDistance}m</span>
            </div>

            <input
                type="range"
                min="0"
                max={WALK_DISTANCE_OPTIONS.length - 1}
                step="1"
                value={sliderValue}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between mt-1 px-1">
                {WALK_DISTANCE_OPTIONS.map((opt, i) => (
                    <div key={opt} className="flex flex-col items-center">
                        <span className="w-0.5 h-1 bg-gray-300 mb-1"></span>
                        {/* Only show first, middle and last labels to avoid crowding if needed, or all if short */}
                        <span className={`text-[10px] ${i === currentIndex ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                            {opt}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WalkDistanceSelector;
