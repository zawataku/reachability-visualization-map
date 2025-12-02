import { useState, useEffect } from "react";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import type { Facility, Stats } from "../types";
import { getPolygonCentroid, isPointInPolygon } from "../utils/geo";

export const SCENARIOS = [
    { id: 'morning', label: '午前中で到達可能', time: '11:30:00', description: '11:30までに到着' },
    { id: 'afternoon', label: '昼過ぎ(15時頃)までに到達可能', time: '14:30:00', description: '14:30までに到着' },
    { id: 'evening', label: '夕方までに到達可能', time: '17:00:00', description: '17:00までに到着' },
];

export const FACILITIES: Facility[] = [
    { id: '1', name: '金沢医科大学氷見市民病院', lat: 36.857236126567436, lon: 136.96744588128246, type: 'hospital' },
    { id: '2', name: 'アルビス 氷見店', lat: 36.83954104779495, lon: 136.98720552009104, type: 'supermarket' },
    { id: '3', name: 'イオンモール高岡', lat: 36.72398312341095, lon: 137.01681490346044, type: 'supermarket' },
];

import { HIMI_CITY_POLYGON } from "../data/boundaries";

export const useAppLogic = () => {
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0].id);
    const [isochroneData, setIsochroneData] = useState<FeatureCollection | null>(null);
    const [populationData, setPopulationData] = useState<FeatureCollection | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadPopulationData = async () => {
            try {
                const res = await fetch("/mesh_data/16.json");
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

            if (feature.geometry) {
                // メッシュの中心点を計算
                const center = getPolygonCentroid(feature.geometry);
                if (!center) return;

                // 指定した自治体（氷見市）に含まれるか判定
                const isInMunicipality = isPointInPolygon(center, HIMI_CITY_POLYGON);
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

    return {
        selectedFacility,
        setSelectedFacility,
        selectedScenarioId,
        setSelectedScenarioId,
        isochroneData,
        stats,
        isLoading,
        handleSearch
    };
};
