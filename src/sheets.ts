import {SanityCheck, Sanitizer} from "./sanitizer";

async function getAllSheetNames(id: string): Promise<string[]> {
  try {
    const response = await gapi.client.sheets.spreadsheets.get({spreadsheetId: id});
    if (!response.result.sheets) throw new Error("No sheets in spreadsheets.");
    return response.result.sheets.map(s => s.properties?.title || "");
  } catch (e) {
    console.error("Error fetching sheet names:", e);
    throw e;
  }
}

async function getSheetData(id: string, rng: string): Promise<ValueRange> {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: rng,
    });
    if (!response.result.values || response.result.values.length === 0) {
      return {...response.result, "values": []};
    } else {
      return response.result;
    }
  } catch (e) {
    console.error("Error fetching sheet data:", e);
    throw e;
  }
}

export async function getSheetGeoCache(id: string): Promise<ValueRange> {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "dev-cached"+"!A1:B", // TODO: unhardcode
    });
    return response.result;
  } catch (e) {
    console.error("Error fetching sheet geo cache data:", e);
    throw e;
  }
}

export async function appendSheetGeoCache(
  id: string, addr: string, v: string
): Promise<void> {
  try {
    const params = {
      spreadsheetId: id,
      range: "dev-cached"+"!A1:B",
      valueInputOption: "USER_ENTERED",
    };
    const data = {
      values: [[addr, v]],
    };
    const req = gapi.client.sheets.spreadsheets.values.append(
      params,
      data
    );
    const res = await req;
  } catch (e) {
    console.error("Error appending sheet data: ", e);
    throw e;
  }
}

export async function getAllSheetData(id: string, rng: string): Promise<ValueRange[]> {
  const names = await getAllSheetNames(id);
  const allDataPromises = names
    .filter(n => n !== "dev-cached")
    .map(n => getSheetData(id, `${n}!${rng}`));
  return Promise.all(allDataPromises);
}

const sliceNameFromRange = (rng: string | undefined) => rng!
  .slice(0, rng!.indexOf('!'));

export async function normalizeSheetData(sheetData: ValueRange[]): Promise<CitationTable> {
  if (!sheetData) throw new Error("Attempting to populate table pre-fetch.");
  return <CitationTable> sheetData.reduce((table, {range, values}) => ({
    ...table,
    [sliceNameFromRange(range)]: values!
      .map((vs, vId) => ({
        "id":   `${sliceNameFromRange(range)}-${vId}`,
        "date": vs[0],                  // date
        "addr": vs[1],                  // address
        "time": vs[6],                  // time
        "dept": vs[7],                  // dept
        "sign": Sanitizer.int(vs[9]),   // signs
        "cite": Sanitizer.int(vs[11]),  // citation num
        "cmnt": vs[12],                 // comment
      }))
      .filter(({addr}) => SanityCheck.addr(addr)),
  }), {});
}
