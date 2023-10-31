import {ROSEVILLE_COORD, geolocateData} from "./geo";
import {getAllSheetData, normalizeSheetData} from "./sheets";
import {_API_KEY, _DISC_DOC, _SCOPES, _CLIENT_ID, _SHEET_ID} from "./secrets";
import {newMap, addCirclePin, pinAllData} from "./map";
import Map from "ol/Map";

let TOKEN_CLIENT: TokenClient;

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

function genTableTd(data: string): HTMLElement {
  const td = document.createElement("td");
  td.innerText = data;
  return td;
}

function genTableTr(insp: string, row: CitationEntry): HTMLElement {
  const tr = document.createElement("tr");
  const {id, date, addr, time, dept, sign, cite, cmnt} = row;
  tr.id = id;
  tr.append(
    genTableTd(insp), genTableTd(date),
    genTableTd(addr), genTableTd(time),
    genTableTd(dept), genTableTd(sign),
    genTableTd(cite),
  );
  tr.addEventListener("click", () => onClickDataRow(cmnt)); // pass cmnt here
  return tr;
}

function populateDataTable(citationTable: CitationTable): void {
  const tableEntryPoint = document.getElementById("table-entry-point");
  for (const insp of Object.keys(citationTable)) {
    for (const row of citationTable[insp]) {
      tableEntryPoint!.appendChild(genTableTr(insp, row));
    }
  }
}

async function fetchAndPopulateData(
  sheetData: ValueRange[],
  citationTable: CitationTable,
  id: string,
  rng: string,
): Promise<CitationTable> {
  sheetData = await getAllSheetData(id, rng);
  citationTable = await normalizeSheetData(sheetData);
  console.log(citationTable);
  populateDataTable(citationTable);
  return citationTable;
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

function onClickLoginBtn(
  sheetData: ValueRange[],
  citationTable: CitationTable,
  map: Map,
): void {
  TOKEN_CLIENT.callback = async function(resp: GapiError) {
    if (resp.error !== undefined) throw resp;
    const loginBtn   = document.querySelector(".login-btn") as HTMLElement;
    const logoutBtn  = document.querySelector(".logout-btn") as HTMLElement;
    const loadScrn   = document.getElementById("table-load-pane") as HTMLElement;
    const tableScrn  = document.querySelector("#data-pane table") as HTMLElement;
    loadScrn!.style.display = "flex";
    loginBtn!.style.display = "none";
    logoutBtn!.style.display = "block";
    citationTable = await fetchAndPopulateData(
      sheetData, citationTable, _SHEET_ID, "A13:M"
    ); // unhardcode range
    citationTable = await geolocateData(citationTable);
    console.log("POST GEOLOCATE: ", citationTable);
    pinAllData(map, citationTable);
    loadScrn!.style.display = "none";
    tableScrn!.style.display = "table";
    attachTableHandlers();
  };
  TOKEN_CLIENT.requestAccessToken({
    "prompt": gapi.client.getToken() ? "consent" : ""
  })
  const token = gapi.client.getToken();
  if (token !== null) {
    console.log("Logged in successfully.");
  }
}

function onClickLogoutBtn(
  sheetData: ValueRange[],
  citationTable: CitationTable,
): void {
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
    sheetData = [];
    citationTable = {};
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
function attachToolbarHandlers(
  sheetData: ValueRange[],
  citationTable: CitationTable,
  map: Map,
): void {
  const loginBtn  = document.querySelector(".login-btn");
  const logoutBtn = document.querySelector(".logout-btn");
  const menuBtn   = document.querySelector(".menu-btn");
  const helpBtn   = document.querySelector(".help-btn");
  loginBtn!.addEventListener(
    "click", () => onClickLoginBtn(sheetData, citationTable, map)
  );
  logoutBtn!.addEventListener(
    "click", () => onClickLogoutBtn(sheetData, citationTable)
  );
  menuBtn!.addEventListener("click",  onClickMenuBtn);
  helpBtn!.addEventListener("click",  onClickHelpBtn);
}

function onTableClickInsp(): void {
  const dropdown = document.getElementById("table-drop-insp");
  dropdown!.style.display = dropdown!.style.display === "none" ? "block" : "none";
}

function attachTableHandlers(): void {
  const selectorInsp = document.getElementById("table-insp");
  const selectorDate = document.getElementById("table-date");
  const selectorAddr = document.getElementById("table-addr");
  const selectorTime = document.getElementById("table-time");
  const selectorDept = document.getElementById("table-dept");
  const selectorSign = document.getElementById("table-sign");
  const selectorCite = document.getElementById("table-cite");
  selectorInsp!.addEventListener("click", onTableClickInsp);
  selectorDate!.addEventListener("click", () => console.log("table hello"));
  selectorAddr!.addEventListener("click", () => console.log("table hello"));
  selectorTime!.addEventListener("click", () => console.log("table hello"));
  selectorDept!.addEventListener("click", () => console.log("table hello"));
  selectorSign!.addEventListener("click", () => console.log("table hello"));
  selectorCite!.addEventListener("click", () => console.log("table hello"));
}

async function main() {
  // session state data
  let SHEET_DATA: ValueRange[] = [];
  let CITATION_TABLE: CitationTable = {};

  // Load and initialize gapi/gis
  const flags: initFlags = {
    gapi: await loadGapiClient(),
    gis:  await loadGisClient()
  };

  // Initialize OL Map
  const MAP = newMap(ROSEVILLE_COORD);

  // Handlers
  attachToolbarHandlers(SHEET_DATA, CITATION_TABLE, MAP);
}

window.onload = main;
