import {ROSEVILLE_COORD} from "./geo";
import {createViewer} from "./viewer";
import {_API_KEY, _DISC_DOC, _SCOPES,
        _CLIENT_ID, _SHEET_ID, _SHEET_URL} from "./secrets";
import {createPinMap} from "./map";
import {MONTHS} from "./globals";

// HTML TEMPLATES
import HTML_TEST from "../views/stats.html";
import HTML_STATS_CASES from "../views/stats-case-by-insp.html"
import HTML_TABLE from "../views/table.html"
// END HTML TEMPLATES

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
  const {id, date, addr, time, dept, sign, cite, cmnt, stat} = row;
  tr.id = id;
  tr.append(
    genTableTd(insp), genTableTd(date),
    genTableTd(addr), genTableTd(time),
    genTableTd(dept), genTableTd(sign),
    genTableTd(cite), genTableTd(stat),
  );
  tr.addEventListener("click", () => onClickDataRow(cmnt)); // pass cmnt here
  return tr;
}

// function purgeDataTable(): void {
//   const tableEntryPoint = document.getElementById("table-entry-point");
//   tableEntryPoint!.innerHTML = "";
// }

function populateDataTable(v: Viewer, p: PinMap): void {
  mountInDataPane(HTML_TABLE);
  const t: CitationTable = v.view();
  const tableEntryPoint = document.getElementById("table-entry-point");
  for (const insp of Object.keys(t)) {
    for (const row of t[insp]) {
      tableEntryPoint!.appendChild(genTableTr(insp, row));
    }
  }
  attachTableHandlers(v, p);
}

function renderFromView(v: Viewer, p: PinMap): void {
  populateDataTable(v, p);
  p.unpinAll();
  p.addAll(v.view());
}

// viewport functions
function unmountDetailedView(identifier: string): void {
  const detailedView = document.querySelector("." + identifier);
  if (!detailedView) return;
  const viewport = document.querySelector(".overlay") as HTMLElement;
  viewport.removeChild(detailedView);
  viewport!.style.display = "none";
}

// event handlers
function onClickStatsBtn(v: Viewer, p: PinMap): void {
  const viewport  = document.querySelector(".overlay") as HTMLElement;
  const statBtn   = document.querySelector(".menu-btn") as HTMLElement;

  if (viewport!.style.display === "block") {
    statBtn!.classList.remove("btn-on");
    unmountDetailedView("stats-view");
    renderFromView(v, p);
  } else {
    viewport!.innerHTML = HTML_TEST;
    statBtn!.classList.add("btn-on");
    viewport!.style.display = "block";
    Object.entries(onClickStatBtn)
      .forEach(([id, fn]) => {
        document.getElementById(id)!.addEventListener("click", () => fn(v, p));
      });
  }
}

function onClickDataRow(cmnt: string): void {
  unmountDetailedView("detailed-view");
  const viewport         = document.querySelector(".overlay") as HTMLElement;
  const detailedView     = document.createElement("div");
  const commentHeader    = document.createElement("h1");
  const commentParagraph = document.createElement("p");
  const backArrow        = document.createElement("span");
  backArrow!.classList.add("material-symbols-outlined", "close-btn");
  backArrow!.style.backgroundColor = "green";
  backArrow!.innerText = "arrow_back";
  backArrow!.addEventListener("click", () => unmountDetailedView("detailed-view"));
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
    loadScrn!.style.display  = "flex";
    loginBtn!.style.display  = "none";
    logoutBtn!.style.display = "block";
    editBtn!.style.display   = "block";

    await v.init(_SHEET_ID, "A4:Z"); // unhardcode range
    v.log("raw");

    v.setFilter({
      names: ["arogers",],
      months: ["September", "October", "November"],
    } as Filter);

    v.applyFilter();

    populateDataTable(v, p);
    p.addAll(v.view());

    loadScrn!.style.display = "none";

    // const tableScrn  = document.querySelector("#data-pane table") as HTMLElement;
    // tableScrn!.style.display = "table";
    // attachTableHandlers(v, p);
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
  const modal     = document.getElementById("modal-background");
  const helpBtn   = document.querySelector(".edit-btn");
  helpBtn!.classList.remove("btn-on");
  modal!.innerHTML = "";
  modal!.style.display = modal!.style.display === "none" ? "flex" : "none";
  if (modal!.style.display === "flex") {
    helpBtn!.classList.add("btn-on");
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
  const menuBtn   = document.querySelector(".menu-btn"); // currently stats!
  const helpBtn   = document.querySelector(".edit-btn");
  loginBtn!.addEventListener(
    "click", () => onClickLoginBtn(v, p)
  );
  logoutBtn!.addEventListener(
    "click", () => onClickLogoutBtn(v)
  );
  menuBtn!.addEventListener(
    "click",  () => onClickStatsBtn(v, p)
  );
  helpBtn!.addEventListener("click",  onClickEditButton);
}

function onTableClickInsp(v: Viewer, p: PinMap): void {
  console.log("onclick: Hit inspector function");
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
    }) ;
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
  console.log("ENTERING TABLE ATTACHMENT");
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

interface statHandlers {
  [identifier: string]: (v: Viewer, p: PinMap) => void;
}

const onClickStatBtn: statHandlers = {
  "s-btn1": (v, p) => {
    // const dataEntry = document.getElementById("data-pane");
    // dataEntry!.innerHTML = HTML_STATS_CASES;
    mountInDataPane(HTML_STATS_CASES);
    const crunch = document.getElementById("stats-crunch-cases-data");
    const newElements = Object.entries(v.view()).map(([inspector, cs]) => {
      let el = document.createElement("div");
      el!.innerText = `${inspector}: ${cs.length}`;
      return el;
    });
    crunch!.append(...newElements);
    attachTableHandlers(v, p);
  },
  "s-btn2": (v,p) => console.log("s-btn2"),
  "s-btn3": (v,p) => console.log("s-btn3"),
  "s-btn4": (v,p) => console.log("s-btn4"),
  "s-btn5": (v,p) => console.log("s-btn5"),
  "s-btn6": (v,p) => console.log("s-btn6"),
};

function mountInDataPane(tmpl: string): void {
  const entryPoint = document.getElementById("data-pane");
  entryPoint!.innerHTML = tmpl;
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
