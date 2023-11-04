import {getAllSheetData, normalizeSheetData} from "./sheets";
import {geolocateData} from "./geo";

/*
  
  createViewer() takes the current view of our application and diffs it with a user
  provided filter. Suppose the master view looks like:

  {
    "insp-a": [
      {"id": "insp-a-0", date: "10/13/2021", addr: "", ...}
      {"id": "insp-a-1", date: "11/14/2021", addr: "", ...}
      {"id": "insp-a-2", date: "12/15/2021", addr: "", ...}
    ],
    "insp-b": [
      {"id": "insp-b-0", date: "10/13/2021", addr: "", ...}
      {"id": "insp-b-1", date: "11/14/2021", addr: "", ...}
      {"id": "insp-b-2", date: "12/15/2021", addr: "", ...}
    ],
  }

  We seek to apply a filter such as:

  {
    "names": ["insp-a"],
    "months": ["October", "September"]
  }

  The amended view should look like:

  {
    "insp-a": [
      {"id": "insp-a-0", date: "10/13/2021", addr: "", ...}
      {"id": "insp-a-1", date: "11/14/2021", addr: "", ...}
    ],
  }

  The current general filter object should have the following schema:

  {
    "names": [],
    "months": [],
    "citations": [],
    "departments": [],
  }

 */

export function createViewer(): Viewer {
  let __raw: ValueRange[]     = [];
  let __master: CitationTable = {};
  let __view: CitationTable   = __master;
  let __filter: Filter        = {};

  const __batch = (...fns: ((v: CitationTable) => CitationTable)[]): CitationTable => fns
    .reduce((view, f) => f(view), __master);

  const __filterNames = (v: CitationTable): CitationTable => __filter["names"]
    ? Object.fromEntries(
      Object.entries(v).filter(([k]) => __filter["names"].includes(k)))
    : v;

  // const __filterMonths = (v: CitationTable): CitationTable => __filter["months"]
  //   ? Object.fromEntries(
  //     Object.entries(v).filter(([_, ...rows]) => rows.)
  //   )

  return {
    init: async (id: string, rng: string): Promise<void> => {
      __raw    = await getAllSheetData(id, rng);
      __master = await normalizeSheetData(__raw);
      __master = await geolocateData(__master);
      __view   = __master;
    },
    purge: () => { __raw = []; __master = {}; __view = {}; },
    // directly set internal filter object --> please only use to initialize
    setFilter: (f: Filter) => __filter = f,
    // updates view to reflect current filter object by batching pure functions
    applyFilter:  () => __view = __batch(
      __filterNames,
    ),
    // to be bound to clicking functions, merely adds/removes depending
    // on state
    toggleFilter: (k: string, v: string) => {
      __filter[k] = __filter[k].includes(v)
        ? __filter[k].filter(s => s !== v)
        : [...__filter[k], v];
    },
    view: () => __view,
    listViewByField: (field: string) => __filter[field],
    listMasterNames: () => Object.keys(__master),
  };
}
