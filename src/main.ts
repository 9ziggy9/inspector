// BEGIN OpenLayer
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import * as mapControls from "ol/control";
import * as projection from "ol/proj";
import * as olCoord from "ol/coordinate";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import {Icon, Style} from "ol/style";
// END OpenLayer

// BEGIN Google
import {google} from "googleapis";
import {OAuth2Client} from "google-auth-library";
// END Google

// Types
type Coord = olCoord.Coordinate;
type SheetRow = {
  date       : Date;
  addr       : string;
  time       : number;
  dept       : number; // make enumeration for departments
  citNo      : number;
  comment    : string;
};

// SHOULD GO TO DEDICATE GLOBALS FILE
const ROSEVILLE_COORD: Coord = [-121.2880,38.7521];

const urlNominatimSearch = (addr: string): string =>
  `https://nominatim.openstreetmap.org/search?format=json&q=${addr}`;

async function fetchLogEntries(logName: string, range: string) {
  // TODO TOMORROW
  const sheetEndpoint = "https://sheets.googleapis.com/v4/spreadsheets/"
    + `${_API_SHEET_ID}/values/${logName}!${range}?key=${_API_SHEET_KEY}:`;
  try {
    const res = await fetch(sheetEndpoint);
    const data = res.json();
    console.log(data);
  } catch (error) {
    console.error("Error feching sheet data:", error);
  }
}

// Consider changing to a structured query which accepts a UrlSearchParms obj.
async function geocodeAddr(addr: string): Promise<[Coord, Coord]> {
  const res = await fetch(urlNominatimSearch(addr+",Roseville,CA"));
  const [{lon, lat}] = await res.json();
  if (lon && lat) return [lon, lat];
  else throw new Error("Address not found");
}

const newMap = () => new Map({
  controls: [],
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: projection.fromLonLat(ROSEVILLE_COORD), // Roseville CA
    zoom: 12,
  }),
});

async function main() {
  const h1 = document.createElement("h1");
  h1.innerText = "Hello, maps!";
  document.body.appendChild(h1);
  const map = newMap();
  fetchLogEntries("Log-arogers", "A13:M");
}

window.onload = main;
