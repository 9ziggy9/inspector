import * as olCoord from "ol/coordinate";

type Coord = olCoord.Coordinate;

export const ROSEVILLE_COORD: Coord = [-121.2880,38.7521];

const T_CACHE_MISS_COOLDOWN = 1300;

const urlNominatimSearch = (addr: string): string =>
  `https://nominatim.openstreetmap.org/search?format=json&q=${addr}`;

async function checkGeoCache(addr: string): Promise<[Coord, Coord] | null> {
  const cachedLotLan = localStorage.getItem(addr);
  return cachedLotLan
    ? JSON.parse(cachedLotLan)
    : null;
}

const backOff = (ms: number): Promise<void> => new Promise((res) =>
  setTimeout(() => {
    console.log(`Cache miss: backing off nominatim API for ${ms} ms.`)
    res();
  }, ms));

// Consider changing to a structured query which accepts a UrlSearchParms obj.
async function geocodeAddr(addr: string): Promise<[Coord, Coord] | null> {
  const cachedData = await checkGeoCache(addr);
  if (cachedData) {
    console.log(`Cached data found: ${addr}`);
    return cachedData;
  }

  await backOff(T_CACHE_MISS_COOLDOWN);

  const res = await fetch(urlNominatimSearch(addr+",Roseville,CA"));
  const data = await res.json();
  if (data.length) {
    const [{lon, lat}] = data;
    localStorage.setItem(addr, JSON.stringify([lon, lat]));
    return [lon, lat];
  }
  return null;
}

async function appendLatLonField(entry: CitationEntry): Promise<CitationEntry> {
  const latlon = await geocodeAddr(entry["addr"]);
  if (!latlon) return entry;
  return {
    ...entry,
    latlon
  };
}

export async function geolocateData(citationTable: CitationTable): Promise<CitationTable> {
  let geolocatedData: CitationTable = {};
  for (const insp of Object.keys(citationTable)) {
    geolocatedData[insp] = [];
    for (const entry of citationTable[insp]) {
      const geolocatedEntry = await appendLatLonField(entry);
      geolocatedData[insp].push(geolocatedEntry);
    }
  }
  return geolocatedData;
}
