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
} from "ol/interaction.js";
import { Pointer as PointerInteraction } from "ol/interaction.js";
import Feature from "ol/Feature.js";
import LineString from "ol/geom/LineString.js";
import { Point, Polygon } from "ol/geom";
import Draw from "ol/interaction/Draw.js";
import { getArea, getLength } from "ol/sphere.js";
import RenderFeature from "ol/render/Feature";
import { deleteLayer, drawFeature, drawLine } from "./functions";
import OSM from "ol/source/OSM.js";
import jscolor from "./plugins/jscolor.js";
// ********************************** Start coding ********************************** //
// style definition
const country = new Style({
  stroke: new Stroke({
    color: "#ff4200",
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
    title: "Bản đồ Thế giới",
    shown: true,
    layer: new TileLayer({
      source: new OSM(),
      label: "OpenStreetMap",
    }),
    icon: "https://img.icons8.com/officel/50/world-map.png"
  },

  {
    title: "Bản đồ Việt Nam",
    shown: true,
    layer: new VectorTileLayer({
      source: source,
      style: country,
    }),
    icon: "https://img.icons8.com/bubbles/50/vietnam--v1.png"
  },
  {
    title: "Mông Dương - Quảng Ninh",
    shown: true,
    layer: new VectorTileLayer({
      source: source_,
      style: country,
    }),
    icon: "https://img.icons8.com/office/50/mine-cart.png"
  },
  {
    title: "Tọa độ z:x:y",
    shown: true,
    layer: new TileLayer({
      source: new TileDebug(),
    }),
    icon: "https://img.icons8.com/officel/50/grid.png"
  },
  {
    title: "Nền",
    shown: true,
    layer: vector,
    icon: "https://img.icons8.com/external-flat-design-circle/50/external-background-camping-flat-design-circle.png"
  },
];

// defintion of the map object
const map = new Map({
  target: "map",
  layers: layers.filter((e) => e.shown).map((e) => e.layer),
  view: new View({
    center: [0, 0],
    zoom: 4,
  }),
});

// Checkbox
const options = document.getElementById("options");

layers.forEach((l) => {
  // Create a div wrapper
  const divWrapper = document.createElement("div");
  divWrapper.classList.add("wrapper-class");

  const checkboxTitleWrapper = document.createElement("div");
  checkboxTitleWrapper.classList.add("checkbox-title-wrapper-class");

  // Create the input element
  const inp = document.createElement("input");
  inp.setAttribute("type", "checkbox");
  inp.checked = l.shown;

  // Apply spacing using CSS
  inp.style.marginRight = "5px";

  // Create the title element
  const title = document.createElement("span");
  title.textContent = l.title;

  // Add the input and title elements to the checkbox and title wrapper div
  checkboxTitleWrapper.appendChild(inp);
  checkboxTitleWrapper.appendChild(title);

  // Create the icon wrapper div
  const iconWrapper = document.createElement("div");
  iconWrapper.classList.add("icon-wrapper-class");

  // Create the icon element
  const icon = document.createElement("i");
  icon.classList.add("icon-class");
  icon.innerHTML = '<img src="' + l.icon + '" alt="Icon" />';

  // Add the icon element to the icon wrapper div
  iconWrapper.appendChild(icon);

  // Add the label to the div wrapper
  divWrapper.appendChild(checkboxTitleWrapper);
  divWrapper.appendChild(iconWrapper);

  // Add the div wrapper to the options element
  options?.appendChild(divWrapper);

  // Add click event listener to the input element
  inp.addEventListener("click", () => {
    l.shown = !l.shown;
    if (l.shown) l.layer.setVisible(true)
    else l.layer.setVisible(false)
  });
});




// handle the choice of action
// const typeSelect = document.getElementById("type");

// const select = new Select();

// const selectedFeatures = select.getFeatures();

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
    //   console.log(feature);
      this.coordinate_ = evt.coordinate;
      this.feature_ = feature;
  
      if(this.feature_.type_==="Polygon" || this.feature_.type_==="LineString"|| this.feature_.type_==="MultiLineString"){		
      var FlatCoordinates = feature.getFlatCoordinates();
      var gid = feature.getProperties().gid;
  
      }
    else{
      if(this.feature_.id_== 99999){
        return false;
      }
  
    }
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

  let gid = null;
	let FlatCoordinates = null;
	let ends = null; 


  deleteLayer(map, 'vectorLineLayer');

  if(this.feature_.type_==="Polygon" || this.feature_.type_==="LineString"|| this.feature_.type_==="MultiLineString"){	
		FlatCoordinates = this.feature_.getFlatCoordinates();
		ends= this.feature_.getEnds();
		gid = this.feature_.getProperties().gid;

	}
	else{
		FlatCoordinates = this.feature_.values_.geometry.getFlatCoordinates();
		ends = this.feature_.values_.geometry.getEnds();
		gid = this.feature_.id_;

	}

  drawLine(map,points)
	drawFeature(map,FlatCoordinates,ends,1,points,null,gid,"vectorLineLayer");	

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

// function updateDraggedFeatureCount() {
//   const countElement = document.getElementById("dragged-feature-count");
//   countElement.textContent = draggedFeatureIds.length;
//   document.getElementById("dragged-ids").textContent =
//     "Danh sách id tính năng đã được kéo: " + draggedFeatureIds.join(",");
// }

// init variable store polygon

function handleUpEvent(evt) {
  deleteLayer(map, 'vectorLineLayer');

  let gid = null;
  let FlatCoordinates = null;
  let ends = null;


  if(this.feature_.type_==="Polygon" || this.feature_.type_==="LineString"|| this.feature_.type_==="MultiLineString"){
		FlatCoordinates = this.feature_.getFlatCoordinates();
		ends = this.feature_.getEnds();
    if(this.feature_.getProperties().hasOwnProperty("gid")){
      gid = this.feature_.getProperties().gid;
    }
    else if (this.feature_.getProperties().hasOwnProperty("id")){
      gid = this.feature_.getProperties().id;

    }
		if(deltaXTotal!=0 || deltaYTotal!=0){
			drawFeature(map,FlatCoordinates,ends,0,null,new Style({
				fill: new Fill({ color: '#ece8ae', weight: 4 }),
				stroke: new Stroke({ color: 'blue', width: 2 })
			}),99999,"layer");
		}
	}
	else{
		FlatCoordinates = this.feature_.values_.geometry.getFlatCoordinates();
		ends = this.feature_.values_.geometry.getEnds();
		gid = this.feature_.id_;

	}

  var points = [clickPoint, [this.coordinate_[0], this.coordinate_[1]]];

  if(deltaXTotal!=0 || deltaYTotal!=0){
		try{
			if(this.feature_.type_==="Polygon" || this.feature_.type_==="LineString"|| this.feature_.type_==="MultiLineString"){
				modifications.push([gid,deltaXTotal,deltaYTotal]);
			}
			else{
				let i = 0;
				while(i<modifications.length && modifications[i][0]!=this.feature_.id_){
					i++;
				}
				modifications[i][1]+=deltaXTotal;
				modifications[i][2]+=deltaYTotal;
				deleteLayer(map,"vectorLayer"+gid);
			}
			drawFeature(map,FlatCoordinates,ends,1,points,new Style({
				fill: new Fill({ color: '#ece8ae', weight: 4 }),
				stroke: new Stroke({ color: 'green', width: 2 })
			}),gid,"vectorLayer"+gid);

			//add the modification to the modifications array
      let counter = document.createElement("div");
      counter.innerHTML = "Số feature thực hiện kéo thả: <span style='color: red'>" + modifications.length + "</span>";


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
				modif.style.width='90%';
				modif.style.height='100px';
				document.getElementById("commit").appendChild(modif);

				//add the commit button
				let button = document.createElement("button");
        button.id = 'save-button'; 

				button.innerHTML="Lưu thông tin";
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
              counter.innerHTML = "Số feature thực hiện kéo thả: <span style='color: red'>" + modifications.length + "</span>";
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


  // if (gid) {
  //   draggedFeatureIds.push(gid);
  // }
  // if (deltaXTotal != 0 || deltaYTotal != 0) {
  //   draggedFeatureCount += 1;
  //   updateDraggedFeatureCount();
  // }

  this.coordinate_ = null;
  this.feature_ = null;
  deltaXTotal = 0;
  deltaYTotal = 0;

  return false;
}

const drag = new Drag();

let modifications = [];
let listenerKey=null;

function removeInteractions() {
	map.removeInteraction(drag);
	// map.removeInteraction(selectInteraction);
	if(listenerKey){
		unByKey(listenerKey);
	}
  }


// const saveButton = document.getElementById("save-button");
// saveButton?.addEventListener("click", () => {
//   const requestOptions = {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(draggedFeatureIds),
//   };

//   fetch("/api/your-endpoint", requestOptions)
//     .then((response) => {
//       // Handle the response from the server
//       if (response.ok) {
//         // Handle success
//         console.log("Save successful");
//       } else {
//         // Handle failure
//         console.error("Save failed");
//       }
//     })
//     .catch((error) => {
//       // Error occurred
//       console.error("An error occurred", error);
//     });
// });

const mode = document.getElementById("mode");


mode?.addEventListener("change", function (e) {
  removeInteractions();
  const modeValue = mode.value;
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
    // case "draw": {
    //   // saveButton.style.display = 'none';
    //   draggedFeatureSection.style.display = "none";
    //   drawFeatureSection.style.display = "block"; // Show draw-feature-section
    //   measureFeatureSection.style.display = "none"; // Hide measure-feature-section
    //   break;
    // }
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
    case "new": {
      // saveButton.style.display = 'block';
      draggedFeatureSection.style.display = "none";
      drawFeatureSection.style.display = "none"; // Hide draw-feature-section
      measureFeatureSection.style.display = "none"; // Hide measure-feature-section
      break;
    }
    case "color": {
      // saveButton.style.display = 'block';
      draggedFeatureSection.style.display = "none";
      drawFeatureSection.style.display = "none"; // Hide draw-feature-section
      measureFeatureSection.style.display = "none"; // Hide measure-feature-section
      break;
    }
    default: {
      // saveButton.style.display = 'none';
      draggedFeatureSection.style.display = "none";
      drawFeatureSection.style.display = "none"; // Hide draw-feature-section
      measureFeatureSection.style.display = "none"; // Hide measure-feature-section
    }
  }
});

// display data of the clicked vector
const status = document.getElementById("status");
const popup = document.getElementById("popup");

const handleNewFeature = (e) => {
  e.preventDefault();
  alert('Thêm địa điểm mới thành công.')
  // call api
}
const handleSetColorFeature = (e) => {
  e.preventDefault();
  let color = e.target.querySelector('input[name="color"]').value;
  alert('Màu sắc được chọn :' + color)
  // call api
}
// let's set defaults for all color pickers
jscolor.presets.default = {
  width: 141,               // make the picker a little narrower
  position: 'right',        // position it to the right of the target
  previewPosition: 'right', // display color preview on the right
  previewSize: 40,          // make the color preview bigger
  palette: [
    '#000000', '#7d7d7d', '#870014', '#ec1c23', '#ff7e26',
    '#fef100', '#22b14b', '#00a1e7', '#3f47cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b87957', '#feaec9', '#ffc80d',
    '#eee3af', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
  ],
};
let selected = null;
map.on("singleclick", function (e) {
  while (document.getElementById("selected").firstChild) {
    document
      .getElementById("selected")
      .removeChild(document.getElementById("selected").firstChild);
  }

  if (selected !== null) {
    selected = null;
  }

  const feature = map.getFeaturesAtPixel(e.pixel)[0];
  if (!feature) {
    return;
  }
  let point = map.getCoordinateFromPixel(e.pixel);
  // new feature
  if (mode.value === "new" && point) {
    let popupContent = document.createElement("div");

    let divWrapper = document.createElement("div");
    divWrapper.classList.add('content-popup-class');

    let inputName = document.createElement("input");
    inputName.setAttribute('name', 'name');
    inputName.setAttribute('type', 'text');
    inputName.classList.add('form-control');
    inputName.setAttribute('placeholder', 'Nhập tên');

    let inputLongtidute = document.createElement("input");
    inputLongtidute.classList.add('form-control');
    inputLongtidute.setAttribute('name', 'long');
    inputLongtidute.setAttribute('type', 'text');
    inputLongtidute.setAttribute('readonly', true);
    inputLongtidute.setAttribute('value', point[0]);

    let inputLattidute = document.createElement("input");
    inputLattidute.classList.add('form-control');
    inputLattidute.setAttribute('name', 'long');
    inputLattidute.setAttribute('type', 'text');
    inputLattidute.setAttribute('readonly', true);
    inputLattidute.setAttribute('value', point[1]);

    let formAction = document.createElement('div');
    formAction.classList.add('form-action', 'text-center');
    let buttonSubmit = document.createElement('button');
    buttonSubmit.setAttribute('type', 'submit');
    buttonSubmit.classList.add('btn', 'btn-primary');
    buttonSubmit.textContent = "Tạo";
    formAction.appendChild(buttonSubmit);

    // new wrapper
    let formGroup = document.createElement('div');
    formGroup.classList.add('form-group');
    let label = document.createElement('label');
    label.classList.add('label');
    label.textContent = "Tên địa điểm";
    formGroup.appendChild(label);
    formGroup.appendChild(inputName);
    divWrapper.appendChild(formGroup);

    formGroup = document.createElement('div');
    formGroup.classList.add('form-group');
    label = document.createElement('label');
    label.classList.add('label');
    label.textContent = "Longtidute";
    formGroup.appendChild(label);
    formGroup.appendChild(inputLongtidute);
    divWrapper.appendChild(formGroup);

    formGroup = document.createElement('div');
    formGroup.classList.add('form-group');
    label = document.createElement('label');
    label.classList.add('label');
    label.textContent = "Lattidute";
    formGroup.appendChild(label);
    formGroup.appendChild(inputLattidute);
    divWrapper.appendChild(formGroup);

    divWrapper.appendChild(formAction);

    let form = document.createElement('form');
    form.setAttribute('id', 'form-new-feature');
    form.setAttribute('method', 'post');
    form.setAttribute('action', '/new-feature');
    form.appendChild(divWrapper);

    form.addEventListener('submit', (e) => {
      handleNewFeature(e);
    })

    popupContent.appendChild(form);

    // Đặt nội dung cho popup
    popup.querySelector('.popup-title').textContent = "Thêm địa điểm mới";
    document.getElementById("popup-content").innerHTML = "";
    document.getElementById("popup-content").appendChild(popupContent);

    // Hiển thị popup
    popup.style.display = "block";
    popup.style.left = e.pixel[0] + "px";
    popup.style.top = e.pixel[1] + "px";
    handleHidePopup();
    return;
  }
  // color feature
  if (mode.value === "color" && point) {
    let popupContent = document.createElement("div");

    let divWrapper = document.createElement("div");
    divWrapper.classList.add('content-popup-class');

    let inputName = document.createElement("input");
    inputName.setAttribute('name', 'name');
    inputName.setAttribute('type', 'text');
    inputName.classList.add('form-control');
    inputName.setAttribute('readonly', true);
    inputName.value = feature.properties_.NAME_1;

    let formAction = document.createElement('div');
    formAction.classList.add('form-action', 'text-center');
    let buttonSubmit = document.createElement('button');
    buttonSubmit.setAttribute('type', 'submit');
    buttonSubmit.classList.add('btn', 'btn-primary');
    buttonSubmit.textContent = "Lưu";
    formAction.appendChild(buttonSubmit);

    let colorPicker = document.createElement('input');
    colorPicker.setAttribute('data-jscolor', '{}');
    colorPicker.setAttribute('name', 'color');
    colorPicker.value = "#3399FF80";
    colorPicker.classList.add('form-control');

    let picker = new JSColor(colorPicker);

    // name wrapper
    let formGroup = document.createElement('div');
    formGroup.classList.add('form-group');
    let label = document.createElement('label');
    label.classList.add('label');
    label.textContent = "Tên tỉnh thành";
    formGroup.appendChild(label);
    formGroup.appendChild(inputName);
    divWrapper.appendChild(formGroup);
    // color picker
    formGroup = document.createElement('div');
    formGroup.classList.add('form-group');
    label = document.createElement('label');
    label.classList.add('label');
    label.textContent = "Chọn màu sắc";
    formGroup.appendChild(label);
    formGroup.appendChild(colorPicker);
    divWrapper.appendChild(formGroup);

    divWrapper.appendChild(formAction);

    let form = document.createElement('form');
    form.setAttribute('id', 'form-set-color-feature');
    form.setAttribute('method', 'post');
    form.setAttribute('action', '/set-color-feature');
    form.appendChild(divWrapper);

    form.addEventListener('submit', (e) => {
      handleSetColorFeature(e);
    })

    popupContent.appendChild(form);

    // Đặt nội dung cho popup
    popup.querySelector('.popup-title').textContent = "Chọn màu sắc cho tỉnh thành";
    document.getElementById("popup-content").innerHTML = "";
    document.getElementById("popup-content").appendChild(popupContent);

    // Hiển thị popup
    popup.style.display = "block";
    popup.style.left = e.pixel[0] + "px";
    popup.style.top = e.pixel[1] + "px";
    handleHidePopup();
    return;
  }
  // not modify mode
  if (mode.value !== "none") {
    return;
  }
  map.forEachFeatureAtPixel(e.pixel, function (f) {
    selected = f;
    // Tạo nội dung cho popup 
    let popupContent = document.createElement("div");

    let properties = f.getProperties();

    let data =[]
    if(properties.hasOwnProperty("properties")){
      const propertiesObj = JSON.parse(properties.properties);
      data = [
        { label: "ID:", value: properties.id },
        { label: "Material:", value: propertiesObj.material },
        { label: "Layer:", value: propertiesObj.layer },
      ];
    }
    else{
      data = [
        { label: "Quốc gia:", value: properties.COUNTRY },
        { label: "Khu vực:", value: properties.ENGTYPE_1 },
        { label: "Vùng:", value: properties.NAME_1 },
      ];
    }

    for (let i = 0; i < data.length; i++) {
      let paragraph = document.createElement("p");
      paragraph.classList.add("content-popup-class");

      let labelSpan = document.createElement("span");
      labelSpan.classList.add("label-popup-class");
      labelSpan.appendChild(document.createTextNode(data[i].label));

      let valueSpan = document.createElement("span");
      valueSpan.classList.add("value-popup-class");
      valueSpan.appendChild(document.createTextNode(" " + data[i].value));

      paragraph.appendChild(labelSpan);
      paragraph.appendChild(valueSpan);

      popupContent.appendChild(paragraph);
    }

    // Đặt nội dung cho popup
    popup.querySelector('.popup-title').textContent = "Thông tin tính năng";
    document.getElementById("popup-content").innerHTML = "";
    document.getElementById("popup-content").appendChild(popupContent);

    // Hiển thị popup
    popup.style.display = "block";
    popup.style.left = e.pixel[0] + "px";
    popup.style.top = e.pixel[1] + "px";

    handleHidePopup();
    return true;
  });

  if (selected) {
    status.innerHTML = selected.get("ECO_NAME");
  } else {
    status.innerHTML = "&nbsp;";
  }

  // Hiển thị hoặc ẩn popup
  if (selected) {
    popup.style.display = "block";
  } else {
    popup.style.display = "none";
  }
});

// Ẩn popup khi bấm chuột ngoài popup
const handleHidePopup = () => {
  document.addEventListener("click", function (e) {
    let _popup = document.getElementById("popup");
    let colorPicker = document.querySelector('.jscolor-picker');
    if (!_popup.contains(e.target) && !colorPicker?.contains(e.target)) {
      _popup.style.display = "none";
    }
  })
}


// Draw point, linestring, polygon, circle

const typeSelection = document.getElementById("type");

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelection?.value;
  if (value && value !== "None") {
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
typeSelection?.addEventListener('change', function (e) {
  map.removeInteraction(draw);
  addInteraction();
});

document.getElementById("undo")?.addEventListener("click", function () {
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


map.addInteraction(modify);

let drawMeasure; // global so we can remove it later

function addMeasureInteraction() {
  const drawType = typeSelectMeasure?.value;
  if (drawType && drawType !== "NoneMeasure") {
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

typeSelectMeasure?.addEventListener('change', function (e) {
  map.removeInteraction(drawMeasure);
  addMeasureInteraction();
});

addMeasureInteraction();

showSegments?.addEventListener('change', function (e) {
  vector.changed();
  drawMeasure.getOverlay().changed();
});
