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
  cite: string, cmnt: string,
  latlon?: [Coord, Coord] | null,
};

declare type CitationTable = {
  [insp: string]: CitationEntry[];
};
