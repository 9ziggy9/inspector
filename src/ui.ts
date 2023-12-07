import {_SHEET_URL, _SHEET_ID} from "./secrets";

function getRefOrDie(identifier: string): HTMLElement {
  const ref = document.querySelector(identifier) as HTMLElement;
  if (!ref) throw new Error(
    `PANICKING: "${identifier}" could not be queried from DOM.`
  );
  return ref;
}

function createRefOrDie<T extends HTMLElement>(elementType: string): T {
  const ref = document.createElement(elementType);
  if (!ref) throw new Error(
    `PANICKING: "${elementType}" could not be created.`
  );
  return ref as T;
}

function clearRef(ref: HTMLElement): void { ref.innerHTML = ""; }

function toggleRefDisplay(ref: HTMLElement, mode: string): string {
  const {display} = ref.style;
  ref.style.display = display === "none" ? mode : "none";
  return ref.style.display;
}

function setRefDisplay(ref: HTMLElement, mode: string): void {
  ref.style.display = mode;
}

function bindOnRef(
  ref: HTMLElement, evType: string, fn: (e?: Event) => void,
): void {
  ref.addEventListener(evType, (e) => fn(e));
}

type Ref = {
  node:      HTMLElement;
  isVisible: () => boolean;
  show:      () => void;
  hide:      () => void;
  domLookup: () => HTMLElement | null;
  enter:     () => void;
  exit:      () => void;
};

type RefConfig = {
  selector:   string,
  onEntry?:   () => any,
  onExit?:    () => any,
  bindings?:  Array<[t: string, (e?: Event) => any]>,
  plebs?:     string[],
  peers?:     string[],
};

type RefTable = {
  [selector: string]: Ref;
};

function createRefManager(): void {
  let __refs: RefTable = {};

  function __createRef(c: RefConfig): Ref {
    const __node = getRefOrDie(selector);
    const __hide = (): void => __node.classList.add("jimmy-hoffa");
    const __show = (): void => __node.classList.remove("jimmy-hoffa");

    if (c.bindings && c.bindings.length) {
      bindings.forEach(([t, cb]) => __node.addEventListener(t, cb));
    }

    return {
      node: __node,
      isVisible: () => __node.style.visibility !== "hidden",
      domLookup: () => document.querySelector(selector),
      enter: () => {
        __show();
        if (c.onEntry) c.onEntry();
        if (c.peers) c.peers.forEach(peer => __refs[peer].enter());
        if (c.plebs) c.plebs.forEach(pleb => __refs[pleb].exit());
      },
      exit: () => {
        if (c.onExit) c.onExit();
        if (c.peers) c.peers.forEach(peer => __refs[peer].enter());
        if (c.plebs) c.plebs.forEach(pleb => __refs[pleb].exit());
        __hide();
      },
    };
  }

  return {
    createRef: (c: RefConfig): Ref => {
      const {selector} = c;
      if (Object.keys(__refs).includes(selector)) {
        throw new Error(
          `---> createRefManager():\n ref on selector ${selector} exists.`
        )
      }
      __refs[selector] = __createRef(c);
      return __refs[selector];
    },
  };
}

interface UI {
  set: {
    viewer: (v: Viewer) => void;
    pinMap: (p: PinMap) => void;
  };
};

export function createUI(): UI {
  let __tokenClient: TokenClient = {} as TokenClient;
  let __viewer: Viewer           = {} as Viewer;
  let __pinMap: PinMap           = {} as PinMap;

  // let __ref: RefTable = {
  //   modal: {
  //     entry: getRefOrDie("#modal"),
  //     bg:    getRefOrDie("#modal-background"),
  //   },
  //   toolbar: {
  //     login:  getRefOrDie(".login-btn"),
  //     logout: getRefOrDie(".logout-btn"),
  //     stats:  getRefOrDie(".menu-btn"),
  //     edit:   getRefOrDie(".edit-btn"),
  //   },
  //   data: {
  //     entry: getRefOrDie(".scrollable-body"),
  //     load:  getRefOrDie("#table-load-pane"),
  //     table: getRefOrDie("#table-entry-point"),
  //     stats: getRefOrDie("#statistics-entry-point"),
  //   },
  //   master: {
  //     entry:    getRefOrDie("#master-view"),
  //     map:      getRefOrDie("#map"),
  //     viewport: getRefOrDie(".overlay"),
  //     stats:    getRefOrDie(".stats-view"),
  //   }
  // };

  function __bindToolbarHandlers(): void {
    // EDIT
    bindOnRef(__ref.toolbar.edit, "click", () => {
      __ref.toolbar.edit.classList.remove("btn-on");
      clearRef(__ref.modal.bg);
      const currentMode = toggleRefDisplay(__ref.modal.bg, "flex");
      if (currentMode === "flex") {
        __ref.toolbar.edit.classList.add("btn-on");
        const embeddedGoogleSheet = createRefOrDie<HTMLIFrameElement>("iframe");
        embeddedGoogleSheet.id = "modal-sheet";
        embeddedGoogleSheet.src = _SHEET_URL;
        __ref.modal.bg.appendChild(embeddedGoogleSheet);
      }
    });

    // LOGIN
    bindOnRef(__ref.toolbar.login, "click", () => {
      __tokenClient.callback = async function(resp: GapiError) {
        if (resp.error !== undefined) throw resp;
        setRefDisplay(__ref.data.load,      "flex");
        setRefDisplay(__ref.toolbar.login,  "none");
        setRefDisplay(__ref.toolbar.logout, "block");
        setRefDisplay(__ref.toolbar.edit,   "block");

        await __viewer.init(_SHEET_ID, "A4:Z"); // unhardcode range

        __viewer.setFilter({
          names: ["arogers", ],
          months: ["November", ],
        } as Filter);

        __viewer.applyFilter();

        __pinMap.addAll(__viewer.view());
        setRefDisplay(__ref.data.load, "none");
      };

      __tokenClient.requestAccessToken({
        "prompt": gapi.client.getToken() ? "consent" : "",
      })

      const token = gapi.client.getToken();
      if (token !== null) console.log("Gapi token received.");
    });

    // LOGOUT
    bindOnRef(__ref.toolbar.logout, "click", () => {
      const token = gapi.client.getToken();
      if (token !== null) {
        google.accounts.oauth2.revoke(
          token.access_token,
          function(): void {
            gapi.client.setToken(null);
            setRefDisplay(__ref.toolbar.login,  "block");
            setRefDisplay(__ref.toolbar.logout, "none");
          });
        __viewer.purge();
        location.reload();
      }
    });

    // STATS
    bindOnRef(__ref.toolbar.stats, "click", () => {
      if (__ref.master.viewport.style.display === "block") {
        __ref.toolbar.stats.classList.remove("btn-on");
        // DANGER: THIS CAN CRASH FATALLY FOR NOW
        const statsViewportRef = getRefOrDie(".stats-view"); // append to __refs tree
        __ref.master.viewport.removeChild(statsViewportRef);
        setRefDisplay(__ref.master.viewport, "none");
        // END: DANGER

      } else {
        __ref.master.viewport.innerHTML = HTML_STATS;
        __ref.toolbar.stats.classList.add("btn-on");
        setRefDisplay(__ref.master.viewport, "block");
      }
    });
  }

  return {
    set: {
      viewer: (v)  => __viewer = v,
      pinMap: (p)  => __pinMap = p,
    },
  };
}
