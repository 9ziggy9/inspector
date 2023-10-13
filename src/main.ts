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

import {_API_KEY, _DISC_DOC, _SCOPES, _CLIENT_ID} from "./secrets.js";

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
interface GapiResponse {
  result: {
    values?: string[][];
  };
}
interface GapiError {
  error?: any;
  message?: string;
}
type TokenClient = {
  callback?: (resp: any) => void;
  requestAccessToken: (options: any) => void;
};

let TOKEN_CLIENT: TokenClient;

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

async function loadGisClient(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      TOKEN_CLIENT = await google.accounts.oauth2.initTokenClient({
        client_id: _CLIENT_ID,
        scope:     _SCOPES,
        callback:  () => {}, // define later
      });
      resolve(true);
    } catch {
      reject(false);
    }
  })
}

// event handlers
function onClickMenuBtn(): void {
  const dropdown = document.getElementById("dropdown");
  dropdown!.style.display = dropdown!.style.display === "none" ? "block" : "none";
}

function onClickLoginBtn(): void {
  TOKEN_CLIENT.callback = function(resp: GapiError) {
    if (resp.error !== undefined) throw resp;
    console.log("hello login callback!");
  };
  TOKEN_CLIENT.requestAccessToken({
    "prompt": gapi.client.getToken() ? "consent" : ""
  })
}

// attach event handlers
function attachToolbarHandlers(): void {
  const loginBtn: Element = document.getElementsByClassName("login-btn")[0];
  const menuBtn:  Element = document.getElementsByClassName("menu-btn")[0];
  const helpBtn:  Element = document.getElementsByClassName("help-btn")[0];
  loginBtn.addEventListener("click", onClickLoginBtn);
  menuBtn.addEventListener("click",  onClickMenuBtn);
  helpBtn.addEventListener("click",  () => console.log("Hello, help!"));
}

async function main() {
  // Load and initialize gapi
  const flags: initFlags = {
    gapi: await loadGapiClient(),
    gis:  await loadGisClient()
  };
  console.log(flags);
  console.log(TOKEN_CLIENT);
  // Handlers
  attachToolbarHandlers();
  const map = newMap();
}

window.onload = main;
