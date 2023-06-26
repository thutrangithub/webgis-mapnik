import "./style.css";
import Map from "ol/Map.js";
import TileLayer from "ol/layer/Tile.js";
import VectorTileLayer from "ol/layer/VectorTile.js";
import VectorTileSource from "ol/source/VectorTile.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import TileDebug from "ol/source/TileDebug.js";
import MVT from "ol/format/MVT.js";
import View from "ol/View.js";
import {
  Fill,
  Stroke,
  Text,
  Circle as CircleStyle,
  RegularShape,
} from "ol/style.js";
import Style from "ol/style/Style.js";
import "ol/layer/Vector.js";
import {
  Modify,
  Select,
  defaults as defaultInteractions,
} from "ol/interaction.js";
import { Pointer as PointerInteraction } from "ol/interaction.js";
import Feature from "ol/Feature.js";
import LineString from "ol/geom/LineString.js";
import { Point, Polygon } from "ol/geom";
import Draw from "ol/interaction/Draw.js";
import { getArea, getLength } from "ol/sphere.js";
import RenderFeature from "ol/render/Feature";

// ********************************** Start coding ********************************** //
// style definition
const country = new Style({
  stroke: new Stroke({
    color: " black ",
    width: 1,
  }),
  fill: new Fill({
    color: "#ffff",
  }),
  text: new Text({
    font: "20px sans-serif",
  }),
});

// source
const source = new VectorTileSource({
  format: new MVT(),
  url: "/api/vector/gdam1/{z}/{x}/{y}",
});

const source_ = new VectorTileSource({
  format: new MVT(),
  url: "/api/vector/acdb/{z}/{x}/{y}",
});

const source__ = new VectorSource({ wrapX: false });

const vector = new VectorLayer({
  source: source__,
  style: function (feature) {
    return styleFunction(feature, showSegments.checked);
  },
});

// def the layers to dispaly on the map
const layers = [
  {
    title: "Country (Viet Nam)",
    shown: true,
    layer: new VectorTileLayer({
      // background: 'grey',
      // declutter: true,
      source: source,
      style: country,
    }),
  },
  {
    title: "Mong Duong",
    shown: true,
    layer: new VectorTileLayer({
      // background: 'grey',
      // declutter: true,
      source: source_,
      style: country,
    }),
  },
  {
    title: "z:x:y",
    shown: true,
    layer: new TileLayer({
      source: new TileDebug(),
    }),
  },
  {
    title: "Layout",
    shown: true,
    layer: vector,
  },
];

// defintion of the map object
const map = new Map({
  target: "map",
  layers: layers.filter((e) => e.shown).map((e) => e.layer),
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

// Checkbox
const options = document.getElementById("options");
layers.forEach((l) => {
  const label = document.createElement("label");
  options.appendChild(label);

  const inp = document.createElement("input");
  inp.setAttribute("type", "checkbox");
  inp.checked = l.shown;
  label.appendChild(inp);

  label.appendChild(document.createTextNode(l.title));

  const space = document.createTextNode("\u00A0"); // Add a non-breaking space
  label.appendChild(space);

  inp.addEventListener("click", () => {
    l.shown = !l.shown;

    if (l.shown) map.addLayer(l.layer);
    else map.removeLayer(l.layer);
  });
});

// handle the choice of action
const typeSelect = document.getElementById("type");

const select = new Select();

const selectedFeatures = select.getFeatures();

// Implement the drag interraction
class Drag extends PointerInteraction {
  constructor() {
    super({
      handleDownEvent: handleDownEvent,
      handleDragEvent: handleDragEvent,
      handleMoveEvent: handleMoveEvent,
      handleUpEvent: handleUpEvent,
    });

    /**
     * @type {import("../src/ol/coordinate.js").Coordinate}
     * @private
     */
    this.coordinate_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.cursor_ = "pointer";

    /**
     * @type {Feature}
     * @private
     */
    this.feature_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.previousCursor_ = undefined;
  }
}
var deltaXTotal = 0;
var deltaYTotal = 0;

let draggedFeatureIds = [];

let draggedFeatureCount = 0;

var clickPoint;
/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
function handleDownEvent(evt) {
  clickPoint = JSON.parse(JSON.stringify(evt.coordinate));
  const map = evt.map;

  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });

  if (feature) {
    this.coordinate_ = evt.coordinate;
    this.feature_ = feature;
  }

  return !!feature;
}

/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
 */

function handleDragEvent(evt) {
  const deltaX = evt.coordinate[0] - this.coordinate_[0];
  const deltaY = evt.coordinate[1] - this.coordinate_[1];

  deltaXTotal += deltaX;
  deltaYTotal += deltaY;

  this.coordinate_[0] = evt.coordinate[0];
  this.coordinate_[1] = evt.coordinate[1];

  var points = [clickPoint, [this.coordinate_[0], this.coordinate_[1]]];

  // if (map.getAllLayers().length > 2) {
  //   map.removeLayer(map.getAllLayers()[2])
  // }

  map.getLayers().forEach((layer) => {
    if (layer.getClassName() == "vectorLineLayer") {
      // console.log("delete layers");
      map.removeLayer(layer);
    }
  });

  var featureLine = new Feature({
    geometry: new LineString(points),
  });

  let FlatCoordinates;

  // console.log("this.feature_", this.feature_)

  if (this.feature_.hasOwnProperty("getFlatCoordinates")) {
    console.log(this.feature_);
    FlatCoordinates = this.feature_.getFlatCoordinates();
  }

  // var FlatCoordinates = this.feature_.getFlatCoordinates()
  var coordinates = [[]];

  var i = 0;
  while (i < FlatCoordinates?.length) {
    coordinates[0][i / 2] = [FlatCoordinates[i], FlatCoordinates[i + 1]];
    i = i + 2;
  }

  var featurePolygon = new Feature({
    geometry: new Polygon(coordinates),
  });

  featurePolygon
    .getGeometry()
    .translate(points[1][0] - points[0][0], points[1][1] - points[0][1]);
  var vectorLineSource = new VectorSource({});
  vectorLineSource.addFeature(featureLine);
  vectorLineSource.addFeature(featurePolygon);

  var vectorLineLayer = new VectorLayer({
    className: "vectorLineLayer",
    source: vectorLineSource,
    style: new Style({
      fill: new Fill({ color: "#F6F7F9", weight: 4 }),
      stroke: new Stroke({ color: "#213660", width: 2 }),
    }),
  });

  map.addLayer(vectorLineLayer);
}

/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Event.
 */

function handleMoveEvent(evt) {
  if (this.cursor_) {
    const map = evt.map;
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });
    const element = evt.map.getTargetElement();
    if (feature) {
      if (element.style.cursor != this.cursor_) {
        this.previousCursor_ = element.style.cursor;
        element.style.cursor = this.cursor_;
      }
    } else if (this.previousCursor_ !== undefined) {
      element.style.cursor = this.previousCursor_;
      this.previousCursor_ = undefined;
    }
  }
}

/**
 * @return {boolean} `false` to stop the drag sequence.
 */

function updateDraggedFeatureCount() {
  const countElement = document.getElementById("dragged-feature-count");
  countElement.textContent = draggedFeatureCount.toString();
  console.log({ draggedFeatureIds });
  document.getElementById("dragged-ids").textContent =
    "List feature id dragged: " + draggedFeatureIds.join(",");
}
// init variable store polygon
var FlatCoordinates = [];
function handleUpEvent(evt) {
  // console.log("drag stop")
  map.getLayers().forEach((layer) => {
    if (layer.getClassName() == "vectorLineLayer") {
      // console.log("delete layers");
      map.removeLayer(layer);
    }
  });
  // check intance of RenderFeature
  if (this.feature_ instanceof RenderFeature) {
    FlatCoordinates = this.feature_.getFlatCoordinates();
  }
  var coordinates = [[]];
  var i = 0;
  while (i < FlatCoordinates.length) {
    coordinates[0][i / 2] = [FlatCoordinates[i], FlatCoordinates[i + 1]];
    i = i + 2;
  }

  var featureNewPolygon = new Feature({
    geometry: new Polygon(coordinates),
  });

  var points = [clickPoint, [this.coordinate_[0], this.coordinate_[1]]];

  featureNewPolygon
    .getGeometry()
    .translate(points[1][0] - points[0][0], points[1][1] - points[0][1]);

  var featurePolygon = new Feature({
    geometry: new Polygon(coordinates),
  });
  var vectorCommitSource = new VectorSource({});
  var vectorNewCommitSource = new VectorSource({});

  vectorCommitSource.addFeature(featurePolygon);
  vectorNewCommitSource.addFeature(featureNewPolygon);

  var vectorCommitLayer = new VectorLayer({
    source: vectorCommitSource,
    style: new Style({
      fill: new Fill({ color: "#ece8ae", weight: 4 }),
      stroke: new Stroke({ color: "blue", width: 2 }),
    }),
  });

  var vectorNewCommitLayer = new VectorLayer({
    source: vectorNewCommitSource,
    style: new Style({
      fill: new Fill({ color: "rgba(255, 100, 100, 0.3)", weight: 4 }),
      stroke: new Stroke({ color: "rgba(255, 80, 80, 0.9)", width: 2 }),
    }),
  });

  //add the layers
  map.addLayer(vectorCommitLayer);
  map.addLayer(vectorNewCommitLayer);

  const gid = this.feature_.getProperties().gid;

  // if (deltaXTotal != 0 || deltaYTotal != 0) {
  //   try {
  //     //add the modification to the modifications array
  //     modifications.push([gid, deltaXTotal, deltaYTotal]);
  //     let counter = document.createElement("div");
  //     counter.innerHTML = "number of modifications : " + modifications.length;

  //     if (document.getElementById("commit").children.length) {
  //       const featureId = this.feature_.getProperties().gid;
  //       draggedFeatureIds.push(featureId);
  //       // console.log("featureId", featureId)
  //       // console.log("draggedFeatureIds", draggedFeatureIds)
  //       // //update the counter of modifications
  //       // document.getElementById("commit").removeChild(document.getElementById("commit").firstChild);
  //       // document.getElementById("commit").prepend(counter);

  //       // draggedFeatureIds.push(featureId);
  //       // Tăng giá trị draggedFeatureCount lên 1
  //       draggedFeatureCount += 1;
  //       updateDraggedFeatureCount();
  //     } else {
  //       //add the counter of modifications
  //       document.getElementById("commit").prepend(counter);

  //       //add the textarea for the commit message
  //       let modif = document.createElement("textarea");
  //       modif.value = "your commit message";
  //       modif.style.width = "100%";
  //       document.getElementById("commit").appendChild(modif);

  //       //add the commit button
  //       let button = document.createElement("button");
  //       button.style.width = "100%";
  //       button.style.height = "20px";
  //       button.innerHTML = "Commit changes";
  //       button.onclick = function () {
  //         try {
  //           if (modifications.length == 0) {
  //             alert("Nothing to commit");
  //           } else if (modif.value == "your commit message") {
  //             alert("You have to change the commit message!");
  //           } else {
  //             // console.log("you commit");
  //             let requestOptions = {
  //               method: "PUT",
  //               headers: { "Content-Type": "application/json" },
  //               body: JSON.stringify({
  //                 message: modif.innerHTML,
  //                 modifications: modifications,
  //               }),
  //             };

  //             //fetch the modifications to the server
  //             fetch("/commit/", requestOptions);

  //             //clean the commit message and moficactions array
  //             modifications = [];
  //             document
  //               .getElementById("commit")
  //               .removeChild(document.getElementById("commit").firstChild);
  //             counter.innerHTML =
  //               "number of modifications : " + modifications.length;
  //             document.getElementById("commit").prepend(counter);
  //             modif.value = "your commit message";

  //             //remove the local display of modifications
  //             map.getLayers().forEach((layer) => {
  //               if (layer.getClassName() == "vectorLineLayer") {
  //                 map.removeLayer(layer);
  //               }
  //             });
  //           }
  //         } catch {
  //           console.log("error while committing changes");
  //         }

  //         //refresh the map after the commit
  //         map.getLayers().forEach((layer) => layer.getSource().refresh());
  //       };
  //       document.getElementById("commit").appendChild(button);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  if (deltaXTotal != 0 || deltaYTotal != 0) {
    // Thêm ID của feature vào mảng draggedFeatureIds
    const featureId = this.feature_.getProperties().gid || this.feature_.ol_uid;
    draggedFeatureIds.push(featureId);
    // Tăng giá trị draggedFeatureCount lên 1
    draggedFeatureCount += 1;
    updateDraggedFeatureCount();
  }

  // const requestOptions = {
  // 	method: 'PUT',
  // 	headers: { 'Content-Type': 'application/json' },
  // 	body: JSON.stringify({deltaXTotal:deltaXTotal,deltaYTotal:deltaYTotal})
  // };
  // const gid = this.feature_.getProperties().gid;
  // if(deltaXTotal!=0 || deltaYTotal!=0){
  // 	try{
  // 		fetch('/translate/'+gid,
  // 		requestOptions
  // 	)
  // 	}
  // 	catch(error){
  // 		console.log(error);
  // 	}
  // }

  this.coordinate_ = null;
  this.feature_ = null;
  deltaXTotal = 0;
  deltaYTotal = 0;

  if (map.getAllLayers().length > 2) {
    map.removeLayer(map.getAllLayers()[2]);
  }

  return false;
}

const drag = new Drag();

let modifications = [];

function removeInteractions() {
  map.removeInteraction(drag);
}

const saveButton = document.getElementById("save-button");
saveButton.addEventListener("click", () => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draggedFeatureIds),
  };

  fetch("/api/your-endpoint", requestOptions)
    .then((response) => {
      // Handle the response from the server
      if (response.ok) {
        // Handle success
        console.log("Save successful");
      } else {
        // Handle failure
        console.error("Save failed");
      }
    })
    .catch((error) => {
      // Error occurred
      console.error("An error occurred", error);
    });
});

const mode = document.getElementById("mode");
function onChange() {
  removeInteractions();
  const modeValue = mode.value;
  // const saveButton = document.getElementById('save-button');
  const draggedFeatureSection = document.getElementById(
    "dragged-feature-section"
  );
  const drawFeatureSection = document.getElementById("draw-feature-section");

  const measureFeatureSection = document.getElementById(
    "measure-feature-section"
  );

  switch (modeValue) {
    case "none": {
      // saveButton.style.display = 'none';
      draggedFeatureSection.style.display = "none";
      drawFeatureSection.style.display = "none"; // Hide draw-feature-section
      measureFeatureSection.style.display = "none"; // Hide measure-feature-section
      break;
    }
    case "draw": {
      // saveButton.style.display = 'none';
      draggedFeatureSection.style.display = "none";
      drawFeatureSection.style.display = "block"; // Show draw-feature-section
      measureFeatureSection.style.display = "none"; // Hide measure-feature-section
      break;
    }
    case "modify": {
      // saveButton.style.display = 'block';
      draggedFeatureSection.style.display = "block";
      drawFeatureSection.style.display = "none"; // Hide draw-feature-section
      measureFeatureSection.style.display = "none"; // Hide measure-feature-section
      map.addInteraction(drag);
      break;
    }
    case "measure": {
      // saveButton.style.display = 'block';
      draggedFeatureSection.style.display = "none";
      drawFeatureSection.style.display = "none"; // Hide draw-feature-section
      measureFeatureSection.style.display = "block"; // Hide measure-feature-section
      map.addInteraction(drag);
      break;
    }
    default: {
      // saveButton.style.display = 'none';
      draggedFeatureSection.style.display = "none";
      drawFeatureSection.style.display = "none"; // Hide draw-feature-section
      measureFeatureSection.style.display = "none"; // Hide measure-feature-section
    }
  }
}
mode.addEventListener("change", onChange);
onChange();

// display data of the clicked vector
const status = document.getElementById("status");

let selected = null;
map.on("click", function (e) {
  while (document.getElementById("selected").firstChild) {
    document
      .getElementById("selected")
      .removeChild(document.getElementById("selected").firstChild);
  }

  if (selected !== null) {
    selected = null;
  }
  map.forEachFeatureAtPixel(e.pixel, function (f) {
    selected = f;
    let dataDiv = document.createElement("div");

    let titleDiv = document.createElement("div");
    titleDiv.appendChild(
      document.createTextNode("Selected vector tiles data :")
    );
    dataDiv.appendChild(titleDiv);
    //Info of the selected vector tiles
    let Properties = f.getProperties();
    let data = [
      "Country : " + Properties.COUNTRY,
      "ID : " + f.getId(),
      "Area : " + Properties.ENGTYPE_1,
      "gid : " + Properties.gid,
      "gid0 : " + Properties.GID_0,
      "gid1: " + Properties.GID_1,
      "hasc_1: " + Properties.HASC_1,
      "iso1 : " + Properties.ISO_1,
      "region : " + Properties.NAME_1,
    ];
    for (e in data) {
      let div = document.createElement("div");
      div.appendChild(document.createTextNode(data[e]));
      dataDiv.appendChild(div);
    }

    //Display the selected country using canva
    var canvas = document.createElement("canvas");
    var objctx = canvas.getContext("2d");
    objctx.beginPath();
    // var points= f.getFlatCoordinates();

    let i = 0;
    let nbpoints = 0;
    // while(i<points.length){
    // 	objctx.lineTo(Math.round(Math.abs(points[i])/100000),Math.round(Math.abs(points[i+1])/100000));
    // 	i=i+2;
    // 	nbpoints=nbpoints+1;

    // }
    objctx.closePath();
    objctx.fillStyle = "#ece8ae";
    objctx.fill();
    dataDiv.appendChild(canvas);

    document.getElementById("selected").appendChild(dataDiv);

    return true;
  });

  if (selected) {
    status.innerHTML = selected.get("ECO_NAME");
  } else {
    status.innerHTML = "&nbsp;";
  }
});

// Draw point, linestring, polygon, circle

const typeSelection = document.getElementById("type");

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelection.value;
  if (value !== "None") {
    draw = new Draw({
      source: source__,
      type: typeSelection.value,
    });
    map.addInteraction(draw);
  }
}

/**
 * Handle change event.
 */
typeSelection.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

document.getElementById("undo").addEventListener("click", function () {
  draw.removeLastPoint();
});

addInteraction();

// Measurement

const typeSelectMeasure = document.getElementById("typeMeasure");
const showSegments = document.getElementById("segments");
const clearPrevious = document.getElementById("clear");

const style = new Style({
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.2)",
  }),
  stroke: new Stroke({
    color: "rgba(0, 0, 0, 0.5)",
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: "14px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [3, 3, 3, 3],
    textBaseline: "bottom",
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});

const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
  text: new Text({
    text: "Drag to modify",
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});

const segmentStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textBaseline: "bottom",
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
});

const segmentStyles = [segmentStyle];

const formatLength = function (line) {
  const length = getLength(line);
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + " km";
  } else {
    output = Math.round(length * 100) / 100 + " m";
  }
  return output;
};

const formatArea = function (polygon) {
  const area = getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + " km\xB2";
  } else {
    output = Math.round(area * 100) / 100 + " m\xB2";
  }
  return output;
};

// const raster = new TileLayer({
//   source: new OSM(),
// });

// const source = new VectorSource();

const modify = new Modify({ source: source__, style: modifyStyle });

let tipPoint;

function styleFunction(feature, segments, drawType, tip) {
  const styles = [style];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type) {
    if (type === "Polygon") {
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === "LineString") {
      point = new Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    let count = 0;
    line.forEachSegment(function (a, b) {
      const segment = new LineString([a, b]);
      const label = formatLength(segment);
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  if (
    tip &&
    type === "Point" &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tipStyle.getText().setText(tip);
    styles.push(tipStyle);
  }
  return styles;
}

// const vector = new VectorLayer({
//   source: source,
//   style: function (feature) {
//     return styleFunction(feature, showSegments.checked);
//   },
// });

// const map = new Map({
//   layers: [raster, vector],
//   target: 'map',
//   view: new View({
//     center: [-11000000, 4600000],
//     zoom: 15,
//   }),
// });

map.addInteraction(modify);

let drawMeasure; // global so we can remove it later

function addMeasureInteraction() {
  const drawType = typeSelectMeasure.value;
  if (drawType !== "None-Measure") {
    const activeTip =
      "Click to continue drawing the " +
      (drawType === "Polygon" ? "polygon" : "line");
    const idleTip = "Click to start measuring";
    let tip = idleTip;
    drawMeasure = new Draw({
      source: source__,
      type: drawType,
      style: function (feature) {
        return styleFunction(feature, showSegments.checked, drawType, tip);
      },
    });
    drawMeasure.on("drawstart", function () {
      if (clearPrevious.checked) {
        source__.clear();
      }
      modify.setActive(false);
      tip = activeTip;
    });
    drawMeasure.on("drawend", function () {
      modifyStyle.setGeometry(tipPoint);
      modify.setActive(true);
      map.once("pointermove", function () {
        modifyStyle.setGeometry();
      });
      tip = idleTip;
    });
    modify.setActive(true);
    map.addInteraction(drawMeasure);
  }
}

typeSelectMeasure.onchange = function () {
  map.removeInteraction(drawMeasure);
  addMeasureInteraction();
};

addMeasureInteraction();

showSegments.onchange = function () {
  vector.changed();
  drawMeasure.getOverlay().changed();
};
