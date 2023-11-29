// BEGIN OpenLayer
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import * as mapControls from "ol/control";
import * as projection from "ol/proj";
import BaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import Geometry from "ol/geom/Geometry";
import {Icon, Style, Fill, Stroke, Circle} from "ol/style";
import {Select} from "ol/interaction";
import {pointerMove, click} from "ol/events/condition";
import * as olCoord from "ol/coordinate";
// END OpenLayer

const PIN_RADIUS = 6;
const PIN_COLOR_SEVERITY = [
  "green",
  "yellow",
  "orange",
  "red",
];

export const newMap = (centerCoord: olCoord.Coordinate): Map => new Map({
  controls: [],
  target: "map",
  layers: [
   new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: projection.fromLonLat(centerCoord),
    zoom: 12,
  }),
});

export function pinAllData(map: Map, table: CitationTable): void {
  console.log("Following table available:", table);
  Object.keys(table).forEach((insp, i) => {
    for (const {id, latlon, cite} of table[insp]) {
      if (latlon) addCirclePin(
        map,
        latlon,
        id,
        Number.isInteger(+cite) ? +cite : 0, // handling for empty fields
      );
    }
  });
}

// WARNING:
// I'm highly suspect of this function, consider generalizing object and
// holding references to vector source and layers instead.
export function unpinAllData(map: Map): void {
  map.getLayers().getArray()
    .forEach((l: BaseLayer) => {
      if (l instanceof VectorLayer) {
        const source: VectorSource = l.getSource();
        source.clear();
      }
    });
}

export function addCirclePin(
  map: Map,
  coords: olCoord.Coordinate,
  id: string,
  citeNumber: number,
): void {
  const pinFeature = new Feature({
    geometry: new Point(projection.fromLonLat(coords))
  });
  const pinStyle = new Style({
    image: new Circle({
      radius: PIN_RADIUS,
      fill: new Fill({
        color: PIN_COLOR_SEVERITY[citeNumber], // reimplement with color coded by inspector
      }),
      stroke: new Stroke({
        color: "grey",
        width: 2,
      })
    }),
  });
  pinFeature.setStyle(pinStyle);
  pinFeature.setId(id);
  const vectorSrc = new VectorSource({
    features: [pinFeature]
  });

  const vectorLayer = new VectorLayer({
    source: vectorSrc
  });

  const selectHover = new Select({
    condition: pointerMove,
    layers: [vectorLayer]
  });

  const selectClick = new Select({
    condition: click,
    layers: [vectorLayer]
  });

  map.addLayer(vectorLayer);
  map.addInteraction(selectHover);
  map.addInteraction(selectClick);

  selectClick.on("select", e => {
    if (e.selected.length > 0) {
      console.log(`Clicked on ${e.selected[0].getId()}`)
    }
  });

  selectHover.on("select", e => {
    if (e.selected.length > 0) {
      const selectedFeature = e.selected[0];
      const selectedId = selectedFeature.getId();
      const dataRow = document.getElementById(selectedId as string);
      if (dataRow) dataRow.classList.toggle("map-hovered");
    }
    if (e.deselected.length > 0) {
      const deselectedFeature = e.deselected[0];
      const deselectedId = deselectedFeature.getId();
      const dataRow = document.getElementById(deselectedId as string);
      if (dataRow) dataRow.classList.remove("map-hovered");
    }
  });
}
