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

import {_API_KEY, _DISC_DOC, _SCOPES, _CLIENT_ID, _SHEET_ID} from "./secrets.js";

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

// sheet interface
type ValueRange = gapi.client.sheets.ValueRange;
let SHEET_DATA: ValueRange[]; // GLOBAL SHEET DATA OBJECT

async function getAllSheetNames(id: string): Promise<string[]> {
  try {
    const response = await gapi.client.sheets.spreadsheets.get({spreadsheetId: id});
    if (!response.result.sheets) throw new Error("No sheets in spreadsheets.");
    return response.result.sheets.map(s => s.properties?.title || "");
  } catch (e) {
    console.error("Error fetching sheet names:", e);
    throw e;
  }
}

async function getSheetData(id: string, rng: string): Promise<ValueRange> {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: rng,
    });
    if (!response.result.values || response.result.values.length === 0) {
      throw new Error("No data found in the sheet.");
    } else {
      return response.result;
    }
  } catch (e) {
    console.error("Error fetching sheet data:", e);
    throw e;
  }
}

async function getAllSheetData(id: string, rng: string): Promise<ValueRange[]> {
  const names = await getAllSheetNames(id);
  const allDataPromises = names.map(n => getSheetData(id, `${n}!${rng}`));
  return Promise.all(allDataPromises);
}

async function loadGapiClient(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      await gapi.load("client", () => {
        gapi.client.init({apiKey: _API_KEY, discoveryDocs: [_DISC_DOC]})
      });
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

// geolocation functions
type Coord = olCoord.Coordinate;
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


// data population
function normalizeSheetData(): any[][][] { // has to be a better data type here...
  if (!SHEET_DATA) throw new Error("Attempting to populate table pre-fetch.");
  const tableData = SHEET_DATA
    .map(({range, values}) => values!
    .map(vs => [
      range!.slice(0, range!.indexOf('!')), // inspector name
      vs[0],    // date
      vs[1],    // address
      vs[6],    // time
      vs[7],    // dept
      vs[11],   // signs
      vs[12],   // comment
    ]));
  return tableData;
}

function genTableTd(data: string): HTMLElement {
  const td = document.createElement("td");
  td.innerText = data;
  return td;
}

function genTableTr(row: string[7]): HTMLElement {
  const tr = document.createElement("tr");
  const [name,date,addr,time,dept,sign,cmnt] = row;
  tr.append(
    genTableTd(name), genTableTd(date),
    genTableTd(addr), genTableTd(time),
    genTableTd(dept), genTableTd(sign),
  );
  tr.addEventListener("click", () => onClickDataRow(cmnt)); // pass cmnt here
  return tr;
}

function populateDataTable(data: any[][][]): void {
  const tableEntryPoint = document.getElementById("table-entry-point");
  for (const inspEntries of data) {
    for (const row of inspEntries) {
      tableEntryPoint!.appendChild(genTableTr(row as unknown as string));
    }
  }
}

async function fetchAndPopulateData(id: string, rng: string): Promise<void> {
  SHEET_DATA = await getAllSheetData(id, rng);
  const tableRows = normalizeSheetData();
  populateDataTable(tableRows);
}

// viewport functions
function unmountDetailedView(): void {
  const detailedView = document.querySelector(".detailed-view");
  if (!detailedView) return;
  const viewport = document.querySelector(".overlay") as HTMLElement;
  viewport.removeChild(detailedView);
  viewport!.style.display = "none";
}

// event handlers
function onClickDataRow(cmnt: string): void {
  unmountDetailedView();
  const viewport         = document.querySelector(".overlay") as HTMLElement;
  const detailedView     = document.createElement("div");
  const commentHeader    = document.createElement("h1");
  const commentParagraph = document.createElement("p");
  const backArrow        = document.createElement("span");
  backArrow!.classList.add("material-symbols-outlined", "close-btn");
  backArrow!.innerText = "arrow_back";
  backArrow!.addEventListener("click", unmountDetailedView);
  commentHeader!.innerText = "Comments:";
  commentParagraph!.innerText = cmnt.length ? cmnt : "No comments to display";
  detailedView!.classList.add("detailed-view");
  detailedView!.append(
    commentHeader, commentParagraph, backArrow
  );
  viewport!.style.display = "block";
  viewport!.append(
    detailedView, backArrow
  );
}

function onClickMenuBtn(): void {
  const dropdown = document.getElementById("dropdown");
  dropdown!.style.display = dropdown!.style.display === "none" ? "block" : "none";
}

async function testGeolocateAddrs() {
  const data = normalizeSheetData()
    .map(row => row[2]);
  console.log(data);
}

function onClickLoginBtn(): void {
  TOKEN_CLIENT.callback = async function(resp: GapiError) {
    if (resp.error !== undefined) throw resp;
    const loginBtn   = document.querySelector(".login-btn") as HTMLElement;
    const logoutBtn  = document.querySelector(".logout-btn") as HTMLElement;
    loginBtn!.style.display = "none";
    logoutBtn!.style.display = "block";
    await fetchAndPopulateData(_SHEET_ID, "A13:M"); // unhardcode range
    await testGeolocateAddrs();
  };
  TOKEN_CLIENT.requestAccessToken({
    "prompt": gapi.client.getToken() ? "consent" : ""
  })
  const token = gapi.client.getToken();
  if (token !== null) {
    console.log("Logged in successfully.");
  }
}

function onClickLogoutBtn(): void {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(
      token.access_token,
      function(): void {
        gapi.client.setToken(null);
        const loginBtn  = document.querySelector(".login-btn") as HTMLElement;
        const logoutBtn = document.querySelector(".logout-btn") as HTMLElement;
        loginBtn!.style.display = "block";
        logoutBtn!.style.display = "none";
      });
    // purge populated data
    SHEET_DATA = [];
    document.getElementById("table-entry-point")!.innerHTML = "";
  }
}

function onClickHelpBtn(): void {
  console.log("Hit help!");
  const token = gapi.client.getToken();
  if (!token) {
    console.log("Not currently logged in.");
  } else {
    console.log("Yes, logged in.");
  }
}

// attach event handlers
function attachToolbarHandlers(): void {
  const loginBtn  = document.querySelector(".login-btn");
  const logoutBtn = document.querySelector(".logout-btn");
  const menuBtn   = document.querySelector(".menu-btn");
  const helpBtn   = document.querySelector(".help-btn");
  loginBtn!.addEventListener("click", onClickLoginBtn);
  menuBtn!.addEventListener("click",  onClickMenuBtn);
  helpBtn!.addEventListener("click",  onClickHelpBtn);
  logoutBtn!.addEventListener("click", onClickLogoutBtn);
}

async function main() {
  // Load and initialize gapi/gis
  const flags: initFlags = {
    gapi: await loadGapiClient(),
    gis:  await loadGisClient()
  };

  // Handlers
  attachToolbarHandlers();

  // Configure OL Map
  const map = newMap();
}

window.onload = main;
