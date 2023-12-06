import * as olCoord from "ol/coordinate";
import {Sanitizer} from "./sanitizer";
import {getSheetGeoCache, appendSheetGeoCache} from "./sheets";

type Coord = olCoord.Coordinate;

export const ROSEVILLE_COORD: Coord = [-121.2880,38.7521];
export const ROSEVILLE_BOUNDS = [-122, 39, -120, 38];

const T_CACHE_MISS_COOLDOWN = 1300;

const urlNominatimSearch = (addr: string, bounds: Array<number>): string =>
  `https://nominatim.openstreetmap.org/search?format=json&q=${addr}` +
  `&viewbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&bounded=1`;


function logToLoadScreen(msg: string): void {
  const liveLog = document.getElementById("live-log") as HTMLElement;
  liveLog.innerText = `(${msg})`;
}

const backOffAndLog = (msg: string, ms: number): Promise<void> => new Promise((res) =>
  setTimeout(() => {
    logToLoadScreen(msg);
    res();
  }, ms));

const cacheMissLog = (ms: number): Promise<void> => new Promise(async (res) => {
  await backOffAndLog("Fetching new geo data .",   ms/3);
  await backOffAndLog("Fetching new geo data ..",  ms/3);
  await backOffAndLog("Fetching new geo data ...", ms/3);
  res();
});


interface Cache {
  getAddr: (addr: string) => string | null | void;
  setAddr: (addr: string, coords: [Coord, Coord]) => void;
}

function generateLocalCache(): Cache {
  return {
    getAddr: (addr)         => localStorage.getItem(addr),
    setAddr: (addr, coords) => localStorage.setItem(addr, JSON.stringify(coords)),
  }
}

async function generateRemoteCache(id: string): Promise<Cache> {
  const __raw = await getSheetGeoCache(id);
  const __store = __raw.values ? Object.fromEntries(__raw.values as string[][]) : {};
  return {
    getAddr: (addr)         => __store[addr],
    setAddr: (addr, coords) => appendSheetGeoCache(id, addr, JSON.stringify(coords)),
  }
}

function checkGeoCache(addr: string, c: Cache): Promise<[Coord, Coord] | null> {
  // const cachedLotLan = localStorage.getItem(addr);
  const cachedLotLan = c.getAddr(addr);
  return cachedLotLan
    ? JSON.parse(cachedLotLan)
    : null;
}

const isGeoBounded = (lat: number, lon: number): boolean => lon > ROSEVILLE_BOUNDS[0] &&
  lat < ROSEVILLE_BOUNDS[1] &&
  lon < ROSEVILLE_BOUNDS[2] &&
  lat > ROSEVILLE_BOUNDS[3];

const geoBind = (lat: number, lon: number): [Coord, Coord] => isGeoBounded(lat, lon)
  ? [lon, lat] as unknown as [Coord, Coord]
  : [0, 0] as unknown as [Coord, Coord];

async function geocodeAddr(addr: string | null, c: Cache): Promise<[Coord, Coord] | null> {
  if (!addr) return null;
  const cachedData = await checkGeoCache(addr, c);
  if (cachedData) {
    await backOffAndLog(`Cached data found: ${addr}`, 50);
    return cachedData;
  }

  await cacheMissLog(T_CACHE_MISS_COOLDOWN);

  const res = await fetch(urlNominatimSearch(addr+",Roseville,CA", ROSEVILLE_BOUNDS));
  const data = await res.json();
  if (data.length) {
    const [{lon, lat}] = data;
    const coords = geoBind(lat, lon);
    // localStorage.setItem(addr, JSON.stringify(coords));
    c.setAddr(addr, coords);
    return coords;
  }
  // console.log(`Unreachable addr: "${addr}", mapping to Null Island.`);
  // localStorage.setItem(addr, JSON.stringify([0, 0])); // map to Null Island
  c.setAddr(addr, [0, 0] as unknown as [Coord, Coord]);
  return null;
}

async function appendLatLonField(entry: CitationEntry, c: Cache): Promise<CitationEntry> {
  const latlon = await geocodeAddr(Sanitizer.addr(entry["addr"]), c);
  if (!latlon) return entry;
  return {
    ...entry,
    latlon
  };
}

export async function geolocateData(id: string, t: CitationTable): Promise<CitationTable> {
  let geoCache = await generateRemoteCache(id);
  let geolocatedData: CitationTable = {};
  for (const insp of Object.keys(t)) {
    geolocatedData[insp] = [];
    for (const entry of t[insp]) {
      const geolocatedEntry = await appendLatLonField(entry, geoCache);
      geolocatedData[insp].push(geolocatedEntry);
    }
  }
  return geolocatedData;
}
