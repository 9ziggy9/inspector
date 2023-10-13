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

import {_API_KEY, _DISC_DOC, _SCOPES} from "./secrets.js";

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

// event handlers
function onClickMenuBtn(): void {
  const dropdown = document.getElementById("dropdown");
  dropdown!.style.display = dropdown!.style.display === "none" ? "block" : "none";
}

// attach event handlers
function attachToolbarHandlers(): void {
  const loginBtn: Element = document.getElementsByClassName("login-btn")[0];
  const menuBtn:  Element = document.getElementsByClassName("menu-btn")[0];
  const helpBtn:  Element = document.getElementsByClassName("help-btn")[0];
  loginBtn.addEventListener("click", () => console.log("Hello, login!"));
  menuBtn.addEventListener("click",  onClickMenuBtn);
  helpBtn.addEventListener("click",  () => console.log("Hello, help!"));
}

// Consider changing to a structured query which accepts a UrlSearchParms obj.
async function geocodeAddr(addr: string): Promise<[Coord, Coord]> {
  const res = await fetch(urlNominatimSearch(addr+",Roseville,CA"));
  const [{lon, lat}] = await res.json();
  if (lon && lat) return [lon, lat];
  else throw new Error("Address not found");
}

const newMap = (): Map => new Map({
  controls: [],
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: projection.fromLonLat(ROSEVILLE_COORD),
    zoom: 12,
  }),
});

interface initFlags {
  gapi: boolean;
   gis: boolean;
};

async function loadGapiClient(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      await gapi.load("client", () => {
        gapi.client.init({apiKey: _API_KEY, discoveryDocs: [_DISC_DOC]})
      })
      resolve(true);
    } catch {
      reject(false);
    }
  })
}

async function main() {
  // Load and initialize gapi
  const flags: initFlags = {
    gapi: await loadGapiClient(),
    gis: false
  };
  console.log(flags);
  // Handlers
  attachToolbarHandlers();
  const map = newMap();
}

window.onload = main;
