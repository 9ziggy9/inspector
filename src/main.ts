import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

const newMap = () => new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: [0,0],
    zoom: 2,
  }),
});

function main() {
  const h1 = document.createElement("h1");
  h1.innerText = "Hello, maps!";
  document.body.appendChild(h1);
  const map = newMap();
}

window.onload = main;
