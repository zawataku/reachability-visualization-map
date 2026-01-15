import { useState, useEffect } from "react";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import type { Facility, Stats } from "../types";
import { getPolygonCentroid, isPointInPolygon } from "../utils/geo";

export const SCENARIOS = [
    { id: 'morning', label: '午前中で到達可能', time: '12:00:00', description: '12:00までに到着', cutoffSec: '7200' },
    { id: 'afternoon', label: '昼過ぎ(15時頃)までに到達可能', time: '14:30:00', description: '14:30までに到着', cutoffSec: '16200' },
    { id: 'evening', label: '夕方までに到達可能', time: '17:00:00', description: '17:00までに到着', cutoffSec: '25200' },
];

export const FACILITIES: Facility[] = [
    { id: '1', name: '珠洲市総合病院', lat: 37.443687763127535, lon: 137.27066058600244, type: 'hospital' },
    { id: '2', name: 'ゲンキー野々江店', lat: 37.44214641839527, lon: 137.27335936962766, type: 'supermarket' },
    // { id: '3', name: 'イオンモール高岡', lat: 36.72398312341095, lon: 137.01681490346044, type: 'supermarket' },
];

import { SUZU_CITY_POLYGON } from "../data/boundaries";

export const useAppLogic = () => {
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0].id);
    const [selectedYear, setSelectedYear] = useState<'2020' | '2065'>('2020');
    const [maxWalkDistance, setMaxWalkDistance] = useState<number>(500);
    const [isochroneData, setIsochroneData] = useState<FeatureCollection | null>(null);
    const [populationData, setPopulationData] = useState<FeatureCollection | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [showPopulation, setShowPopulation] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const loadPopulationData = async () => {
            try {
                const apiKey = import.meta.env.VITE_REINFOLIB_API_KEY;
                if (!apiKey) {
                    console.error("API key is missing. Please set VITE_REINFOLIB_API_KEY in .env");
                    return;
                }

                const tiles = [
                    { x: 1803, y: 793 },
                    // { x: 1803, y: 794 },
                    // { x: 1803, y: 795 },
                    { x: 1804, y: 793 },
                    { x: 1804, y: 794 },
                    { x: 1805, y: 793 },
                    { x: 1805, y: 794 }
                ];

                const requests = tiles.map(tile =>
                    fetch(`/api/reinfolib/ex-api/external/XKT013?response_format=geojson&z=11&x=${tile.x}&y=${tile.y}`, {
                        headers: {
                            "Ocp-Apim-Subscription-Key": apiKey
                        },
                        signal: controller.signal
                    }).then(async res => {
                        if (!res.ok) throw new Error(`Request failed for tile ${tile.x},${tile.y}`);
                        return res.json();
                    })
                );

                const results = await Promise.all(requests);

                // Merge features from all tiles
                const allFeatures = results.flatMap((data: FeatureCollection) => data.features);

                const mergedData: FeatureCollection = {
                    type: "FeatureCollection",
                    features: allFeatures
                };

                setPopulationData(mergedData);
                console.log("Population data loaded:", allFeatures.length, "meshes from", tiles.length, "tiles");
                // console.log("Full Data Object:", mergedData); 
            } catch (error: unknown) {
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log('Fetch aborted');
                    return;
                }
                console.error("Failed to load population data:", error);
            }
        };
        loadPopulationData();

        return () => {
            controller.abort();
        };
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
            const pop = selectedYear === '2020' ? (props.PTN_2020 || 0) : (props.PTN_2065 || 0);

            if (feature.geometry) {
                // メッシュの中心点を計算
                const center = getPolygonCentroid(feature.geometry);
                if (!center) return;

                // 指定した自治体（珠洲市）に含まれるか判定
                const isInMunicipality = isPointInPolygon(center, SUZU_CITY_POLYGON);
                if (!isInMunicipality) return;

                totalPop += pop;

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
    }, [isochroneData, populationData, selectedYear]);

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
        const targetDate = '2023-05-01';
        const targetCutoffsec = scenario?.cutoffSec || '21600';

        try {
            const params = new URLSearchParams({
                fromPlace: "37.43671338485977, 137.2605634716872", // 珠洲市の中心付近
                toPlace: `${selectedFacility.lat},${selectedFacility.lon}`,
                arriveBy: 'true',
                date: targetDate,
                time: targetTime,
                mode: 'WALK,TRANSIT',
                maxWalkDistance: maxWalkDistance.toString(),
                cutoffSec: targetCutoffsec,
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
    return {
        selectedFacility,
        setSelectedFacility,
        selectedScenarioId,
        setSelectedScenarioId,
        selectedYear,
        setSelectedYear,
        maxWalkDistance,
        setMaxWalkDistance,
        isochroneData,
        stats,
        isLoading,
        handleSearch,
        populationData,
        showPopulation,
        setShowPopulation
    };
};
