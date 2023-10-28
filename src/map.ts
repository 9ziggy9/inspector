// BEGIN OpenLayer
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import * as mapControls from "ol/control";
import * as projection from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import {Icon, Style, Fill, Stroke, Circle} from "ol/style";
import {Select} from "ol/interaction";
import {pointerMove} from "ol/events/condition";
import * as olCoord from "ol/coordinate";
// END OpenLayer

const RADIUS_PIN = 6;
enum PinColor {
    Base03 = '#002B36',  // Background
    Base02 = '#073642',  // Content background
    Base01 = '#586E75',  // Comments/Secondary content
    Base00 = '#657B83',  // Body text/default code/primary content
    Base0  = '#839496',  // Optional emphasized content
    Base1  = '#93A1A1',  // Optional emphasized content (brighter)
    Yellow = '#B58900',
    Orange = '#CB4B16',
    Red    = '#DC322F',
    Magenta= '#D33682',
    Violet = '#6C71C4',
    Blue   = '#268BD2',
    Cyan   = '#2AA198',
    Green  = '#859900'
}

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
  for (const insp of Object.keys(table)) {
    for (const {id, latlon} of table[insp]) {
      if (latlon) addCirclePin(map, latlon, id);
    }
  }
}

export function addCirclePin(
  map: Map,
  coords: olCoord.Coordinate,
  id: string,
): void {
  const pinFeature = new Feature({
    geometry: new Point(projection.fromLonLat(coords))
  });
  const pinStyle = new Style({
    image: new Circle({
      radius: RADIUS_PIN,
      fill: new Fill({
        color: PinColor.Red, // reimplement with color coded by inspector
      }),
      stroke: new Stroke({
        color: PinColor.Base00,
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

  map.addLayer(vectorLayer);
  map.addInteraction(selectHover);

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
