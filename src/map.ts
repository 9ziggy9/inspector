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
import {Icon, Style} from "ol/style";
import * as olCoord from "ol/coordinate";
// END OpenLayer

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
