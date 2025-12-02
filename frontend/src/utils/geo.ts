import type { Geometry, Polygon } from "geojson";

// ポリゴンのバウンディングボックス中心点を計算
export function getPolygonCentroid(geometry: Geometry): [number, number] | null {
    if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const processRing = (ring: number[][]) => {
        ring.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });
    };

    if (geometry.type === "Polygon") {
        geometry.coordinates.forEach(processRing);
    } else if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach(poly => poly.forEach(processRing));
    }

    if (minX === Infinity) return null;
    return [(minX + maxX) / 2, (minY + maxY) / 2]; // [lon, lat]
}

// 点がポリゴン内にあるか判定 (Ray Casting Algorithm)
export function isPointInPolygon(point: [number, number], polygon: Polygon): boolean {
    const x = point[0], y = point[1];
    let inside = false;

    // 外側のリングのみで判定
    const ring = polygon.coordinates[0];

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}
