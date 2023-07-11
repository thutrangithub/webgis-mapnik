import {Pointer as PointerInteraction} from 'ol/interaction.js';


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
	//console.log("drag en cours");
	const deltaX = evt.coordinate[0] - this.coordinate_[0];
	const deltaY = evt.coordinate[1] - this.coordinate_[1];

	deltaXTotal+=deltaX;
	deltaYTotal+=deltaY;
  
	this.coordinate_[0] = evt.coordinate[0];
	this.coordinate_[1] = evt.coordinate[1];
	
	var points = [clickPoint,[this.coordinate_[0],this.coordinate_[1]] ];

	deleteLayer(map,'vectorLineLayer');

	// var featureLine = new Feature({
	// 	geometry: new LineString(points)
	// });

	if(this.feature_.type_=="Polygon"){	
		var FlatCoordinates = this.feature_.getFlatCoordinates();
	}
	else{
		var FlatCoordinates = this.feature_.values_.geometry.getFlatCoordinates();
	}

	drawLine(map,points)
	drawFeature(map,FlatCoordinates,1,points,null);
	
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
	//console.log("drag stop");
	deleteLayer(map,'vectorLineLayer');

	if(this.feature_.type_=="Polygon"){
		var FlatCoordinates = this.feature_.getFlatCoordinates();
	}
	else{
		var FlatCoordinates = this.feature_.values_.geometry.getFlatCoordinates();
	}

	var points = [clickPoint,[this.coordinate_[0],this.coordinate_[1]] ];

	drawFeature(map,FlatCoordinates,0,null,new Style({
				fill: new Fill({ color: '#ece8ae', weight: 4 }),
				stroke: new Stroke({ color: 'blue', width: 2 })
			}));
	drawFeature(map,FlatCoordinates,1,points,new Style({
				fill: new Fill({ color: '#ece8ae', weight: 4 }),
				stroke: new Stroke({ color: 'green', width: 2 })
			}));

	const gid = this.feature_.getProperties().gid;

	if(deltaXTotal!=0 || deltaYTotal!=0){
		try{

			//add the modification to the modifications array
			modifications.push([gid,deltaXTotal,deltaYTotal]);
			let counter = document.createElement("div");
			counter.innerHTML="number of modifications : "+modifications.length;

			if(document.getElementById("commit").children.length){
				
				//update the counter of modifications
				document.getElementById("commit").removeChild(document.getElementById("commit").firstChild);
				document.getElementById("commit").prepend(counter);


			}
			else{
				//add the counter of modifications
				document.getElementById("commit").prepend(counter);

				//add the textarea for the commit message
				let modif = document.createElement("textarea");
				modif.value="your commit message";
				modif.style.width='100%';
				document.getElementById("commit").appendChild(modif);

				//add the commit button
				let button = document.createElement("button");
				button.style.width='100%';
				button.style.height='20px';
				button.innerHTML="Commit changes";
				button.onclick = function(){	
					try{
						if(modifications.length==0){
							alert("Nothing to commit");
						}
						else if(modif.value=="your commit message"){
							alert("You have to change the commit message!");
						}
						else{
							console.log("you commit");
							let requestOptions = {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({message:modif.innerHTML,modifications:modifications}),
							};

							//fetch the modifications to the server
							fetch('/commit/',
								requestOptions
							)
							webSocket.send("Database update");
							//clean the commit message and moficactions array
							modifications=[];
							document.getElementById("commit").removeChild(document.getElementById("commit").firstChild);
							counter.innerHTML="number of modifications : "+modifications.length;
							document.getElementById("commit").prepend(counter);
							modif.value="your commit message";

							deleteLayer(map,'vectorLineLayer');
							//refresh the map after the commit
							refreshLayer(map);

						}
					}
					catch{
						console.log("error while committing changes")
					}
					
					
				}; 
				document.getElementById("commit").appendChild(button);
			}
		}
		catch(error){
			console.log(error);
		}
	}

	this.coordinate_ = null;
	this.feature_ = null;
	deltaXTotal=0;
	deltaYTotal=0;

	return false;
  }


export const drag = new Drag();
