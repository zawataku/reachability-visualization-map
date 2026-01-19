const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const GRAPH_DIR = path.resolve(__dirname, '../otp/graph');
const OUTPUT_FILE = path.resolve(__dirname, '../frontend/src/data/bus_stops.json');

const extractBusStops = () => {
    const files = fs.readdirSync(GRAPH_DIR);
    const zipFiles = files.filter(file => file.endsWith('.zip'));

    const allStops = new Map(); // Use Map to deduplicate by name

    zipFiles.forEach(zipFile => {
        console.log(`Processing ${zipFile}...`);
        try {
            const zip = new AdmZip(path.join(GRAPH_DIR, zipFile));
            const zipEntries = zip.getEntries();

            const stopsEntry = zipEntries.find(entry => entry.entryName === 'stops.txt');

            if (stopsEntry) {
                const content = stopsEntry.getData().toString('utf8');
                const lines = content.split('\n');

                if (lines.length > 0) {
                    const header = lines[0].trim().split(',');
                    const nameIndex = header.indexOf('stop_name');
                    const latIndex = header.indexOf('stop_lat');
                    const lonIndex = header.indexOf('stop_lon');

                    if (nameIndex !== -1 && latIndex !== -1 && lonIndex !== -1) {
                        for (let i = 1; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (!line) continue;

                            // Simple CSV split (assuming no commas in fields for now, or handle quotes if needed)
                            // GTFS usually quotes fields with commas. basic regex split might be safer
                            // specific regex for CSV with quotes: /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
                            const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                            const name = parts[nameIndex]?.replace(/^"|"$/g, '').trim();
                            const lat = parseFloat(parts[latIndex]);
                            const lon = parseFloat(parts[lonIndex]);

                            if (name && !isNaN(lat) && !isNaN(lon)) {
                                if (!allStops.has(name)) {
                                    allStops.set(name, { name, lat, lon });
                                }
                            }
                        }
                    } else {
                        console.warn(`Required columns missing in stops.txt of ${zipFile}`);
                    }
                }
            } else {
                console.warn(`stops.txt not found in ${zipFile}`);
            }
        } catch (error) {
            console.error(`Error processing ${zipFile}:`, error);
        }
    });

    const stopsArray = Array.from(allStops.values());
    console.log(`Total unique bus stops extracted: ${stopsArray.length}`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stopsArray, null, 2));
    console.log(`Bus stops saved to ${OUTPUT_FILE}`);
};

extractBusStops();
