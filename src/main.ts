import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import * as mapControls from "ol/control";
import * as projection from "ol/proj";
import * as olCoord from "ol/coordinate";

// SHOULD GO TO DEDICATE GLOBALS FILE
const ROSEVILLE_COORD: olCoord.Coordinate = [-121.2880,38.7521];

const newMap = () => new Map({
  controls: [],
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: projection.fromLonLat(ROSEVILLE_COORD), // Roseville CA
    zoom: 12,
  }),
});

function main() {
  const h1 = document.createElement("h1");
  h1.innerText = "Hello, maps!";
  document.body.appendChild(h1);
  const map = newMap();
}

window.onload = main;
