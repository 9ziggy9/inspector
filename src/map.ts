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
import {Coordinate as Coord} from "ol/coordinate";
// END OpenLayer

export function createPinMap(
  centerCoord: Coord,
  pinRad: number,
  pinClrs: [string, string, string, string],
): PinMap {
  // Growable array of all pins (features)
  let __pinSource: VectorSource = new VectorSource({features: []});
  // Layer where pins are actually rendered
  let __pinsLayer: VectorLayer<VectorSource> = new VectorLayer({
    source: __pinSource
  });

  let __map: Map = new Map({
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
      // maxZoom: TODO,
      // minZoom: TODO,
    }),
  });
  __map.addLayer(__pinsLayer);
  __map.addInteraction(new Select({
    condition: pointerMove,
    layers: [__pinsLayer],
  }));
  __map.addInteraction(new Select({
    condition: click,
    layers: [__pinsLayer],
  }));

  // Index corresponds to level of severity, 
  const __pinSeverity: Style[] = pinClrs
    .map(clr => new Style({
      image: new Circle({
        radius: pinRad,
        fill: new Fill({color: clr}),
        stroke: new Stroke({color: "grey", width: 2}),
      })
    }));

  // Confirm that coordinates are not on null island.
  const _notNullIsland = ([x,y]: Coord): boolean => x !== 0 && y !== 0;

  function _createPin(id: string, x: Coord, severity: number): Feature {
    const pin: Feature = new Feature({
      geometry: new Point(projection.fromLonLat(x)),
    });
    pin.setStyle(__pinSeverity[severity]);
    pin.setId(id);
    return pin;
  }

  // I'm quite pleased with this pattern, try to remember for future.
  const _genPins = (t: CitationTable): Feature<Geometry>[] => Object.entries(t)
    .flatMap(([_, cases]) => cases)
    .reduce<Feature<Geometry>[]>((pins, {id, latlon, cite}) => [
      ...pins, ... latlon && _notNullIsland(latlon)
        ? [_createPin(id, latlon, Number.isInteger(+cite) ? +cite : 0)]
        : []
    ], []);

  return {
    // reference to actual map element
    map: __map,
    // bulk add all non-null citation table entries
    addAll:   (t: CitationTable) => __pinSource.addFeatures(_genPins(t)),
    unpinAll: () => __pinSource.clear(),
    log: function(t?: CitationTable): void {
      console.log(__map);
      console.log(__pinsLayer);
      console.log(__pinSource);
      if (t) console.log(
        "generated pins:",
        _genPins(t),
      );
    }
  }
}
