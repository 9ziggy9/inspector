import {ROSEVILLE_COORD} from "./geo";
import {createViewer} from "./viewer";
import {_API_KEY, _DISC_DOC, _SCOPES, _CLIENT_ID, _SHEET_ID, _SHEET_URL} from "./secrets";
import {createPinMap} from "./map";
import Map from "ol/Map";
import {MONTHS} from "./globals";

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

function initModal(): void {
  const modalBG = document.getElementById("modal-background");
  const modal = document.getElementById("modal");
  modal!.addEventListener("click", e => e.stopPropagation());
  modalBG!.addEventListener("click", e => {
    e.stopPropagation();
    modalBG!.style.display = "none";
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

function purgeDataTable(): void {
  const tableEntryPoint = document.getElementById("table-entry-point");
  tableEntryPoint!.innerHTML = "";
}

function populateDataTable(citationTable: CitationTable): void {
  const tableEntryPoint = document.getElementById("table-entry-point");
  for (const insp of Object.keys(citationTable)) {
    for (const row of citationTable[insp]) {
      tableEntryPoint!.appendChild(genTableTr(insp, row));
    }
  }
}

function renderFromView(v: Viewer, p?: PinMap): void {
  purgeDataTable();
  populateDataTable(v.view());
  if (p) {
    p.unpinAll();
    p.addAll(v.view());
  }
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

function onClickLoginBtn(v: Viewer, p: PinMap): void {
  TOKEN_CLIENT.callback = async function(resp: GapiError) {
    if (resp.error !== undefined) throw resp;
    const loginBtn   = document.querySelector(".login-btn") as HTMLElement;
    const logoutBtn  = document.querySelector(".logout-btn") as HTMLElement;
    const editBtn    = document.querySelector(".edit-btn") as HTMLElement;
    const loadScrn   = document.getElementById("table-load-pane") as HTMLElement;
    const tableScrn  = document.querySelector("#data-pane table") as HTMLElement;
    loadScrn!.style.display  = "flex";
    loginBtn!.style.display  = "none";
    logoutBtn!.style.display = "block";
    editBtn!.style.display   = "block";

    await v.init(_SHEET_ID, "A4:M"); // unhardcode range

    v.setFilter({
      names: ["drogers", "arogers"],
      months: ["September", "October", "November"],
    } as Filter);

    v.applyFilter();

    populateDataTable(v.view());
    p.addAll(v.view());

    loadScrn!.style.display = "none";
    tableScrn!.style.display = "table";

    attachTableHandlers(v, p);
  };
  TOKEN_CLIENT.requestAccessToken({
    "prompt": gapi.client.getToken() ? "consent" : ""
  })
  const token = gapi.client.getToken();
  if (token !== null) {
    console.log("Logged in successfully.");
  }
}

function onClickLogoutBtn(v: Viewer): void {
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
    v.purge();
    location.reload(); // hard page refresh;
  }
}

function onClickEditButton(): void {
  const modal = document.getElementById("modal-background");
  modal!.innerHTML = "";
  modal!.style.display = modal!.style.display === "none" ? "flex" : "none";
  if (modal!.style.display === "flex") {
    const embeddedSheet = document.createElement("iframe");
    embeddedSheet!.id  = "modal-sheet";
    embeddedSheet!.src = _SHEET_URL;
    modal!.appendChild(embeddedSheet);
  }
}

// attach event handlers
function attachToolbarHandlers(v: Viewer, p: PinMap): void {
  initModal(); // Allow closing by clicking BG area.
  const loginBtn  = document.querySelector(".login-btn");
  const logoutBtn = document.querySelector(".logout-btn");
  const menuBtn   = document.querySelector(".menu-btn");
  const helpBtn   = document.querySelector(".edit-btn");
  loginBtn!.addEventListener(
    "click", () => onClickLoginBtn(v, p)
  );
  logoutBtn!.addEventListener(
    "click", () => onClickLogoutBtn(v)
  );
  menuBtn!.addEventListener("click",  onClickMenuBtn);
  helpBtn!.addEventListener("click",  onClickEditButton);
}

function onTableClickInsp(v: Viewer, p: PinMap): void {
  const selectedNames = v.listViewByField("names");
  const columnEl = document.getElementById("table-insp");
  columnEl!.classList.toggle("col-selected");
  const dropdown = document.getElementById("table-drop-insp") as HTMLElement;
  dropdown!.innerHTML = "";
  v.listMasterNames().forEach(name => {
    const nameEl = document.createElement("p") as HTMLElement;
    nameEl.innerHTML = name;
    if (selectedNames.includes(name)) nameEl.classList.add("selected-insp");
    nameEl.addEventListener("click", (e) => {
      const target = e!.target as HTMLElement;

      // Toggle selection and stop upward propagation
      // This allows the menu to stay open until closed
      target.classList.toggle("selected-insp");
      e.stopPropagation();

      v.toggleFilter("names", target.innerHTML);
      v.applyFilter();

      renderFromView(v, p);
    });
    dropdown!.appendChild(nameEl);
  });
  dropdown!.style.display = dropdown!.style.display === "none" ? "block" : "none";
}

function onTableClickDate(v: Viewer, p: PinMap): void {
  const selectedMonths = v.listViewByField("months");
  const columnEl = document.getElementById("table-date");
  columnEl!.classList.toggle("col-selected");
  const dropdown = document.getElementById("table-drop-date");
  dropdown!.innerHTML = "";
  MONTHS.forEach(month => {
    const monthEl = document.createElement("p") as HTMLElement;
    monthEl.innerHTML = month;
    if (selectedMonths.includes(month)) monthEl.classList.add("selected-insp");
    monthEl.addEventListener("click", (e) => {
      const target = e!.target as HTMLElement;

      // Toggle selection and stop upward propagation
      // This allows the menu to stay open until closed
      target.classList.toggle("selected-insp");
      e.stopPropagation();

      v.toggleFilter("months", target.innerHTML);
      v.applyFilter();

      renderFromView(v, p);
    });
    dropdown!.appendChild(monthEl);
  });
  dropdown!.style.display = dropdown!.style.display === "none" ? "block" : "none";
}

function attachTableHandlers(v: Viewer, p: PinMap): void {
  const selectorInsp = document.getElementById("table-insp");
  const selectorDate = document.getElementById("table-date");
  const selectorAddr = document.getElementById("table-addr");
  const selectorTime = document.getElementById("table-time");
  const selectorDept = document.getElementById("table-dept");
  const selectorSign = document.getElementById("table-sign");
  const selectorCite = document.getElementById("table-cite");
  selectorInsp!.addEventListener("click", () => onTableClickInsp(v, p));
  selectorDate!.addEventListener("click", () => onTableClickDate(v, p));
  selectorAddr!.addEventListener("click", () => p.log(v.view()));
  selectorTime!.addEventListener("click", () => console.log("table hello"));
  selectorDept!.addEventListener("click", () => console.log("table hello"));
  selectorSign!.addEventListener("click", () => console.log("table hello"));
  selectorCite!.addEventListener("click", () => console.log("table hello"));
}

async function main() {
  // Load and initialize gapi/gis
  const flags: initFlags = {
    gapi: await loadGapiClient(),
    gis:  await loadGisClient()
  };

  // Application state
  let v: Viewer = createViewer();

  // Initialize OL Map
  const p: PinMap = createPinMap(
    ROSEVILLE_COORD, 6, ["green", "yellow", "orange", "red"],
  );

  // Handlers
  attachToolbarHandlers(v, p);
}

window.onload = main;
