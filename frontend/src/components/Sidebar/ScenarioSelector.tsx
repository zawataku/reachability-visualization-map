interface Scenario {
    id: string;
    label: string;
    time: string;
    description: string;
}

interface ScenarioSelectorProps {
    scenarios: Scenario[];
    selectedScenarioId: string;
    onSelectScenarioId: (id: string) => void;
}

const ScenarioSelector = ({ scenarios, selectedScenarioId, onSelectScenarioId }: ScenarioSelectorProps) => {
    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">2. 想定シナリオ</label>
            <div className="relative">
                <select
                    className="w-full p-3 pl-4 pr-10 border border-gray-300 rounded-xl bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow text-sm"
                    value={selectedScenarioId}
                    onChange={(e) => onSelectScenarioId(e.target.value)}
                >
                    {scenarios.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>
            <p className="text-xs text-gray-500 px-1 mt-1">
                {scenarios.find(s => s.id === selectedScenarioId)?.description} に間に合うエリアを表示
            </p>
        </div>
    );
};

export default ScenarioSelector;
