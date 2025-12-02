export interface Facility {
    id: string;
    name: string;
    lat: number;
    lon: number;
    type: 'hospital' | 'supermarket';
}

export interface Stats {
    totalPop: number;
    coveredPop: number;
    percentage: number;
}
