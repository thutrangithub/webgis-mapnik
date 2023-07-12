import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js'
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Style from 'ol/style/Style.js';
import {Fill, Stroke} from 'ol/style.js';
import { Polygon } from 'ol/geom';


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


