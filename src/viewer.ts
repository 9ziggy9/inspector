import {getAllSheetData, normalizeSheetData} from "./sheets";
import {geolocateData} from "./geo";

export function createViewer(): Viewer {
  let __raw: ValueRange[]     = [];
  let __master: CitationTable = {};
  let __filter: Filter        = {};
  let __view: CitationTable   = __master;
  return {
    purge: () => { __raw = []; __master = {}, __view = {}; __view = {}; },
    setFilter: () => console.log("Hello, filter!"),
    view: () => __view,
    init: async (id: string, rng: string): Promise<void> => {
      __raw    = await getAllSheetData(id, rng);
      __master = await normalizeSheetData(__raw);
      __master = await geolocateData(__master);
      __view   = __master;
    },
  };
}
