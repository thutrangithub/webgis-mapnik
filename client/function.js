import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js'
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Style from 'ol/style/Style.js';
import {Fill, Stroke} from 'ol/style.js';
import { Polygon } from 'ol/geom';
import Map from 'ol/Map.js';


export function refreshLayer(map){
	map.getLayers().forEach(layer => layer.getSource().refresh());
}

export function deleteLayer(map, layerName){
	map.getAllLayers().forEach(layer => {
		if (layer.getClassName()== layerName){
			console.log("delete layers");
			map.removeLayer(layer)
		}
	  });
}

export function drawFeature(map,flatCoordinates,ends,translate,points,style,gid,layerName){
	var coordinates = [];
	var linearRing = [];

	var i = 0;
	var j = 0;
	if(ends){
		while(j<ends.length){
			while(i<ends[j]){
				linearRing.push([flatCoordinates[i],flatCoordinates[i+1]]);
				i=i+2;
			}
			coordinates.push(linearRing);
			linearRing= [];
			j++;
		}
	}

	var featurePolygon = new Feature({
		geometry : new Polygon(coordinates)
	});
	if(translate){
		featurePolygon.getGeometry().translate(points[1][0]-points[0][0],points[1][1]-points[0][1])
	}
	featurePolygon.id_=gid;

	var vectorSource = new VectorSource({});
	vectorSource.addFeature(featurePolygon);

    if(style==null){
        style= new Style({
			fill: new Fill({ color: '#ece8ae', weight: 4 }),
			stroke: new Stroke({ color: 'red', width: 2 })
		});
    }
	var vectorLayer = new VectorLayer({
		className: layerName,
		source: vectorSource,
		style: style
	});

	map.addLayer(vectorLayer);
}

export function drawLine(map,points){
	var featureLine = new Feature({
		geometry: new LineString(points)
	});

	var vectorLineSource = new VectorSource({});
	vectorLineSource.addFeature(featureLine);

	
	var vectorLineLayer = new VectorLayer({
		className: 'vectorLineLayer',
		source: vectorLineSource,
		style: new Style({
			fill: new Fill({ color: '#ece8ae', weight: 4 }),
			stroke: new Stroke({ color: 'red', width: 2 })
		})
	});

	map.addLayer(vectorLineLayer);
}

//display data of the clicked vector
export function displayData(map,e){
	let selected = null;
	while(document.getElementById('selected').firstChild){
		document.getElementById('selected').removeChild(document.getElementById('selected').firstChild);
	}

	if (selected !== null) {

		selected = null;
	}
	map.forEachFeatureAtPixel(e.pixel, function (f) {
		selected = f;


		let data = []
		let dataDiv = document.createElement('div');

		if(f.type_=="Polygon"){

			let titleDiv = document.createElement("div");
			titleDiv.appendChild(document.createTextNode("Selected vector tiles data :"));
			dataDiv.appendChild(titleDiv);
			// console.log("if");
			//Info of the selected vector tiles
			let Properties= f.getProperties();
			data =[
				'Name : '+Properties.name,
				'ID : '+Properties.gid,
				'Area : '+Properties.area,
				'Latitude : '+Properties.lat,
				'Longitude : '+Properties.lon,
				'Midpoint coordinates : '+f.getFlatMidpoint()[0]+'\n'+f.getFlatMidpoint()[1],
				'fips : ' +Properties.fips,
				'gid : '+Properties.gid,
				'iso2 : '+Properties.iso2,
				'iso3 : '+Properties.iso3,
				'layer : '+Properties.layer,
				'pop2005 : '+Properties.pop2005,
				'region : '+Properties.region,
				'subregion : '+Properties.subregion,
				'un : '+Properties.un
				//Add data to display here
			]



			//Display the selected country using canva
			var canvas = document.createElement("canvas");
			var objctx = canvas.getContext('2d');
			objctx.beginPath();

			var points= f.getFlatCoordinates();
			
			let i=0;
			let nbpoints=0
			while(i<points.length){
				objctx.lineTo(Math.round(Math.abs(points[i])/100000),Math.round(Math.abs(points[i+1])/100000));
				i=i+2;
				nbpoints=nbpoints+1;

			}
			objctx.closePath();
			objctx.fillStyle = '#ece8ae';
			objctx.fill();
			dataDiv.appendChild(canvas);

		}
		else{
			console.log("else");
		}

		for( e in data ){
			let div = document.createElement("div");
			div.appendChild(document.createTextNode(data[e]));
			dataDiv.appendChild(div);
		}

		document.getElementById("selected").appendChild(dataDiv);

		return true;
	});
}