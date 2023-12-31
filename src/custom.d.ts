declare module '*.html' {
  const content: string;
  export default content;
}

declare interface initFlags {
  gapi: boolean;
   gis: boolean;
};
declare interface GapiResponse {
  result: {
    values?: string[][];
  };
}
declare interface GapiError {
  error?: any;
  message?: string;
}
declare type TokenClient = {
  callback?: (resp: any) => void;
  requestAccessToken: (options: any) => void;
};

declare type ValueRange = gapi.client.sheets.ValueRange;

// data population
  /*
    Normalizing data to the following structure:
    {
      "name1": [
        [date, addr, time, dept, signs, cit, comment],
        [date, addr, time, dept, signs, cit, comment],
        [date, addr, time, dept, signs, cit, comment],
        ],
      "name2": [
        [date, addr, time, dept, signs, cit, comment],
        [date, addr, time, dept, signs, cit, comment],
        [date, addr, time, dept, signs, cit, comment],
      ]
    }
   */
declare type CitationEntry = {
  id: string, date: string, addr: string,
  time: string, dept: string, sign: string,
  cite: string, cmnt: string, stat: string,
  latlon?: [Coord, Coord] | null,
};

declare type CitationTable = {
  [insp: string]: CitationEntry[];
};

declare type Filter = {
  [names: string]: string[];
  [dates: string]: string[];
  [depts: string]: string[];
  [cites: string]: number;
};

declare type Viewer = {
  setFilter: (f: Filter) => void;
  applyFilter: () => void;
  toggleFilter: (k: string, v: string) => void;
  log: (v?: string) => void;
  purge: () => void;
  view: () => CitationTable;
  init: (id: string, rng: string) => Promise<void>;
  listMasterNames: () => string[];
  listViewByField: (f: string) => string[];
};

declare type PinMap = {
  map: Map;
  addAll: (t: CitationTable) => void;
  unpinAll: () => void;
  log: (t?: CitationTable) => void;
};
