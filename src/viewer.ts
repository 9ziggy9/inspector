import {getAllSheetData, normalizeSheetData} from "./sheets";
import {geolocateData} from "./geo";

export function createViewer(): Viewer {
  let __raw: ValueRange[]     = [];
  let __master: CitationTable = {};
  let __view: CitationTable   = __master;

  function applyFilter(f: Filter): void {
    const {names} = f;
    if (names && names.length > 0) {
      __view = Object.fromEntries(
        Object.entries(__master).filter(([k]) => names.includes(k))
      );
    } else {
      __view = __master
    }
  }

  return {
    purge: () => { __raw = []; __master = {}, __view = {}; },
    setFilter: (f: Filter) => applyFilter(f),
    view: () => __view,
    init: async (id: string, rng: string): Promise<void> => {
      __raw    = await getAllSheetData(id, rng);
      __master = await normalizeSheetData(__raw);
      __master = await geolocateData(__master);
      __view   = __master;
    },
  };
}
