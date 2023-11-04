import {getAllSheetData, normalizeSheetData} from "./sheets";
import {geolocateData} from "./geo";

export function createViewer(): Viewer {
  let __raw: ValueRange[]     = [];
  let __master: CitationTable = {};
  let __view: CitationTable   = __master;
  let __filter: Filter        = {};

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
    // updates view to reflect current filter
    applyFilter:  () => {
      const {names} = __filter;
      if (names) {
        __view = Object.fromEntries(
          Object.entries(__master).filter(([k]) => names.includes(k))
        );
      } else {
        __view == __master;
      };
    },
    // to be bound to clicking functions, merely adds/removes depending
    // on state
    toggleFilter: (k: string, v: string) => {
      __filter[k] = __filter[k].includes(v)
        ? __filter[k].filter(s => s !== v)
        : [...__filter[k], v];
    },
    view: () => __view,
    listViewNames: () => Object.keys(__view),
    listMasterNames: () => Object.keys(__master),
  };
}
