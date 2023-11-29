import * as olCoord from "ol/coordinate";
import {Sanitizer} from "./sanitizer";

type Coord = olCoord.Coordinate;

export const ROSEVILLE_COORD: Coord = [-121.2880,38.7521];

const T_CACHE_MISS_COOLDOWN = 1300;

const urlNominatimSearch = (addr: string): string =>
  `https://nominatim.openstreetmap.org/search?format=json&q=${addr}`;


function checkGeoCache(addr: string): Promise<[Coord, Coord] | null> {
  const cachedLotLan = localStorage.getItem(addr);
  return cachedLotLan
    ? JSON.parse(cachedLotLan)
    : null;
}

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

async function geocodeAddr(addr: string | null): Promise<[Coord, Coord] | null> {
  // Guard bad sheet data.
  if (!addr) return null;

  const cachedData = await checkGeoCache(addr);
  if (cachedData) {
    await backOffAndLog(`Cached data found: ${addr}`, 50);
    return cachedData;
  }

  await cacheMissLog(T_CACHE_MISS_COOLDOWN);

  const res = await fetch(urlNominatimSearch(addr+",Roseville,CA"));
  const data = await res.json();
  if (data.length) {
    const [{lon, lat}] = data;
    localStorage.setItem(addr, JSON.stringify([lon, lat]));
    return [lon, lat];
  }

  console.log(`Unreachable addr: "${addr}", mapping to Null Island.`);
  localStorage.setItem(addr, JSON.stringify([0,0])); // map to Null Island
  return null;
}

async function appendLatLonField(entry: CitationEntry): Promise<CitationEntry> {
  const latlon = await geocodeAddr(Sanitizer.addr(entry["addr"]));
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
