import * as olCoord from "ol/coordinate";

type Coord = olCoord.Coordinate;

export const ROSEVILLE_COORD: Coord = [-121.2880,38.7521];

const urlNominatimSearch = (addr: string): string =>
  `https://nominatim.openstreetmap.org/search?format=json&q=${addr}`;

async function checkGeoCache(addr: string): Promise<[Coord, Coord] | null> {
  const cachedLotLan = localStorage.getItem(addr);
  return cachedLotLan
    ? JSON.parse(cachedLotLan)
    : null;
}

// Consider changing to a structured query which accepts a UrlSearchParms obj.
async function geocodeAddr(addr: string): Promise<[Coord, Coord] | null> {
  const cachedData = await checkGeoCache(addr);
  if (cachedData) {
    console.log(`Cached data found: ${addr}`);
    return cachedData;
  }
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
    geolocatedData[insp] = await Promise.all(citationTable[insp]
      .map(entry => appendLatLonField(entry)));
  }
  return geolocatedData;
}
