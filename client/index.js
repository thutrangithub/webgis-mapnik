import './style.css';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import TileDebug from 'ol/source/TileDebug.js';
import MVT from 'ol/format/MVT.js';
import View from 'ol/View.js';
import {Fill, Stroke, Text} from 'ol/style.js';
import Style from 'ol/style/Style.js';
import 'ol/layer/Vector.js'
import {Draw, Modify, Pointer as PointerInteraction, Snap} from 'ol/interaction.js';
import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js'
import {transform} from 'ol/proj';
import { Polygon, clone } from 'ol/geom';
import Select from 'ol/interaction/Select.js';
import { click } from 'ol/events/condition';
// import createMapboxStreetsV6Style from './mapbox-streets-v6-style';

//style definition
const country = new Style({
  stroke: new Stroke({
    color: ' ##213660 ',
    width: 1,
  }),
  fill: new Fill({
    color: '#ffffff',
  }),
  text: new Text({
	font: '20px sans-serif',
  })
});
function setStyleForArray(features, style) {
	features.forEach((feature) => {
	  feature.setStyle(style);
	});
  }
  

//source
const source = new VectorTileSource({
	format: new MVT(),
	url: '/api/vector/gdam1/{z}/{x}/{y}'
	// url: '/api/vector/acdb/{z}/{x}/{y}'
});
console.log(source)
const source_ = new VectorTileSource({
	format: new MVT(),
	// url: '/api/vector/gdam1/{z}/{x}/{y}'
	url: '/api/vector/acdb/{z}/{x}/{y}'
});

//def the layers to dispaly on the map
const layers = [
	{
		title: 'Country',
		shown: true,
		layer: new VectorTileLayer({
			// background: 'grey',
			// declutter: true,
			source: source,
			style: country,
		}),
	},
	{
		title: 'Vector tiles',
		shown: true,
		layer: new VectorTileLayer({
			// background: 'grey',
			// declutter: true,
			source: source_,
			style: country,
		}),
	},
	{
		title: 'Debug',
		shown: true,
		layer: new TileLayer({
			source: new TileDebug(),
		}),
	}
]


//defintion of the map object
const map = new Map({
	target: 'map',
	layers: layers.filter(e => e.shown).map(e => e.layer),
	view: new View({
		center: [0, 0],
		zoom: 2,
	}),
});


//Checkbox 
const options = document.getElementById('options');
layers.forEach(l => {
	const label = document.createElement('label');
	options.appendChild(label);

	const inp = document.createElement('input');
	inp.setAttribute('type', 'checkbox');
	inp.checked = l.shown;
	label.appendChild(inp);

	label.appendChild(document.createTextNode(l.title));

	inp.addEventListener('click', () => {
		l.shown = !l.shown;

		if (l.shown) map.addLayer(l.layer);
		else map.removeLayer(l.layer);
	})
})


//handle the choice of action
const typeSelect = document.getElementById('type');


const select = new Select();

// const selectedFeatures = select.getFeatures()


//Implement the drag interraction
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
	  this.cursor_ = 'pointer';
  
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

	deltaXTotal+=deltaX;
	deltaYTotal+=deltaY;
  
	this.coordinate_[0] = evt.coordinate[0];
	this.coordinate_[1] = evt.coordinate[1];
	
	var points = [clickPoint,[this.coordinate_[0],this.coordinate_[1]] ];

	if(map.getAllLayers().length>2){
		map.removeLayer(map.getAllLayers()[2]);
	}
	var featureLine = new Feature({
		geometry: new LineString(points)
	});


	var FlatCoordinates = this.feature_.getFlatCoordinates();
	var coordinates = [[]];
	var i = 0;
	while(i<FlatCoordinates.length){
		coordinates[0][i/2]=[FlatCoordinates[i],FlatCoordinates[i+1]];
		i=i+2;
	}


	var featurePolygon = new Feature({
		geometry : new Polygon(coordinates)
	});
	featurePolygon.getGeometry().translate(points[1][0]-points[0][0],points[1][1]-points[0][1])
	console.log("coordinates", coordinates);
	var vectorLineSource = new VectorSource({});
	vectorLineSource.addFeature(featureLine);
	vectorLineSource.addFeature(featurePolygon);


	var vectorLineLayer = new VectorLayer({
		source: vectorLineSource,
		style: new Style({
			fill: new Fill({ color: '#DFE0EB', weight: 1 }),
			stroke: new Stroke({ color: '#213660', width: 2 })
		})
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
  function handleUpEvent(evt) {
	const requestOptions = {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({deltaXTotal:deltaXTotal,deltaYTotal:deltaYTotal})
	};
	const id = this.feature_.getId();
	if(deltaXTotal!=0 || deltaYTotal!=0){
		try{
			fetch('/translate/'+id,
			requestOptions
		)
		}
		catch(error){
			console.log(error);
		}
	}

	this.coordinate_ = null;
	this.feature_ = null;
	deltaXTotal=0;
	deltaYTotal=0;

	if(map.getAllLayers().length>2){
		map.removeLayer(map.getAllLayers()[2]);
	}

	return false;
  }

const drag = new Drag();


function removeInteractions() {
	map.removeInteraction(drag);
  }


const mode = document.getElementById('mode');
function onChange() {
  removeInteractions();
  switch (mode.value) {
	case 'none': {
		break;
	  }
    case 'draw': {
		alert("not yet implemented");
      break;
    }
    case 'modify': {
        map.addInteraction(drag);
      break;
    }
    default: {
    }
  }
}
mode.addEventListener('change', onChange);
onChange();


//display data of the clicked vector
const status = document.getElementById('status');

let selected = null;
map.on('click', function (e) {
	while(document.getElementById('selected').firstChild){
		document.getElementById('selected').removeChild(document.getElementById('selected').firstChild);
	}

if (selected !== null) {

	selected = null;
}

  
map.forEachFeatureAtPixel(e.pixel, function (f) {
	selected = f;
	
	let dataDiv = document.createElement('div');

	let titleDiv = document.createElement("div");
	titleDiv.appendChild(document.createTextNode("Selected vector tiles data :"));
	dataDiv.appendChild(titleDiv);
	//Info of the selected vector tiles
	let Properties= f.getProperties();
	console.log("Properties", Properties)
	let data =[
		'Country : '+Properties.COUNTRY,
		'ID : '+f.getId(),
		'Area : '+Properties.ENGTYPE_1,
		'gid : '+Properties.gid,
		'gid0 : '+Properties.GID_0,
		'gid1: '+Properties.GID_1,
		'hasc_1: '+Properties.HASC_1,
		'iso1 : '+Properties.ISO_1,
		'region : '+Properties.NAME_1,
	]

	for( e in data ){
		let div = document.createElement("div");
		div.appendChild(document.createTextNode(data[e]));
		dataDiv.appendChild(div);
	}

	//Display the selected country using canva
	var canvas = document.createElement("canvas");
	var objctx = canvas.getContext('2d');
	objctx.beginPath();
	var points= f.getFlatCoordinates();
	
	let i=0;
	let nbpoints=0
	while(i<points.length){
		objctx.lineTo(Math.round(Math.abs(points[i])/100000), Math.round(Math.abs(points[i+1])/100000));
		i=i+2;
		nbpoints=nbpoints+1;

	}

	objctx.closePath();
	objctx.fillStyle = '#ece8ae';
	objctx.fill();
	dataDiv.appendChild(canvas);

	document.getElementById("selected").appendChild(dataDiv);

	return true;
});

if (selected) {
	status.innerHTML = selected.get('ECO_NAME');
} else {
	status.innerHTML = '&nbsp;';
}
});



