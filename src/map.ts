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
import * as olCoord from "ol/coordinate";
// END OpenLayer

const RADIUS_PIN = 7;

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

export function addCirclePin(map: Map, coords: olCoord.Coordinate): void {
  const pinFeature = new Feature({
    geometry: new Point(projection.fromLonLat(coords))
  });
  const pinStyle = new Style({
    image: new Circle({
      radius: RADIUS_PIN,
      fill: new Fill({
        color: "green", // reimplement with color coded by inspector
      }),
      stroke: new Stroke({
        color: "white",
        width: 2,
      })
    }),
  });
  pinFeature.setStyle(pinStyle);

  const vectorSrc = new VectorSource({
    features: [pinFeature]
  });

  const vectorLayer = new VectorLayer({
    source: vectorSrc
  });

  map.addLayer(vectorLayer);
}
