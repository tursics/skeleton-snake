/*jslint browser: true*/
/*global mapboxgl*/

//-----------------------------------------------------------------------

mapboxgl.accessToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiJjajBoN3hzZGwwMDJsMnF0YW96Y2l3OGk2In0._5BdojVYvNuR6x4fQNYZrA';

//-----------------------------------------------------------------------

var mapCenter = [13.379514, 52.53002]; // hackathon location

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/dark-v10', //streets-v11 outdoors-v11 light-v10 dark-v10 satellite-v9 satellite-streets-v11
	center: mapCenter,
	minZoom: 18,
	maxZoom: 20,
	zoom: 19,
	bearing: -25,
	pitch: 60,
	hash: true,
	interactive: false,
//	maxBounds: [[6.4, 51.22], [6.8, 51.46]]
});
var canvas = map.getCanvasContainer();

//-----------------------------------------------------------------------

var rotateCameraOnIdle = false;

function rotateCamera(timestamp) {
	// clamp the rotation between 0 -360 degrees
	// Divide timestamp by 100 to slow rotation to ~10 degrees / sec
	map.rotateTo((timestamp / 100) % 360, { duration: 0 });

	if (rotateCameraOnIdle) {
		requestAnimationFrame(rotateCamera);
	}
}

function startRotateCamera(event) {
	if (rotateCameraOnIdle) {
		rotateCameraOnIdle = false;
	} else {
		removeLabels();

		rotateCameraOnIdle = true;
		rotateCamera(0);
	}
}

//-----------------------------------------------------------------------
/* Idea from Stack Overflow https://stackoverflow.com/a/51683226 */
class MapboxGLButtonControl {
	constructor({
		className = '',
		title = '',
		html = '',
		eventHandler = evtHndlr
	}) {
		this._className = className;
		this._title = title;
		this._html = html;
		this._eventHandler = eventHandler;
	}

	onAdd(map) {
		this._btn = document.createElement('button');
		this._btn.className = 'mapboxgl-ctrl-icon' + ' ' + this._className;
		this._btn.type = 'button';
		this._btn.title = this._title;
		this._btn.innerHTML = this._html;
		this._btn.onclick = this._eventHandler;

		this._container = document.createElement('div');
		this._container.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
		this._container.appendChild(this._btn);

		return this._container;
	}

	onRemove() {
		this._container.parentNode.removeChild(this._container);
		this._map = undefined;
	}
}

//-----------------------------------------------------------------------

function addMapControls() {
	map.addControl(new mapboxgl.FullscreenControl(), 'top-left');
	// map.addControl(new mapboxgl.NavigationControl(), 'top-left');
	/* map.addControl(new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		}
	}), 'top-left'); */
	/* map.addControl(new MapboxGLButtonControl({
		title: 'Automatisch drehen',
		html: '<i class="fas fa-sync-alt fa-lg"></i>',
		eventHandler: startRotateCamera
	}), 'top-left'); */

	map.addControl(new MapboxGLButtonControl({
		title: '',
		html: 'Test Project for 3D snake',
		className: 'nav-title',
		eventHandler: nonFunctional
	}), 'top-right');
/*	map.addControl(new MapboxGLButtonControl({
		title: 'Ein Fahrrad einf??gen',
		html: '<img src="assets/share-bike.png">',
		className: 'nav-button',
		eventHandler: setObjectBike
	}), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Ein Moped einf??gen',
		html: '<img src="assets/share-motorbike.png">',
		className: 'nav-button',
		eventHandler: setObjectMotorBike
	}), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Ein Auto einf??gen',
		html: '<img src="assets/share-car.png">',
		className: 'nav-button',
		eventHandler: setObjectCar
	}), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Ein B??rlk??nig einf??gen',
		html: '<img src="assets/share-bus.png">',
		className: 'nav-button',
		eventHandler: setObjectBus
	}), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Eine Jelbi-S??ule einf??gen',
		html: '<img src="assets/share-jelbisaeule.png">',
		className: 'nav-button',
		eventHandler: setObjectJelbiSaeule
	}), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Eine Warteh??uschen einf??gen',
		html: '',
		className: 'nav-button',
		eventHandler: setObjectWaitingHall
	}), 'top-right');*/
	map.addControl(new MapboxGLButtonControl({
		title: 'place large object',
		html: '',
		className: 'nav-button',
		eventHandler: setObjectSnake
	}), 'top-right');
}

//-----------------------------------------------------------------------

function removeLabels() {
	var layers = map.getStyle().layers;

	for (var i = 0; i < layers.length; i++) {
		if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
			// remove text labels
			map.removeLayer(layers[i].id);
		}
	}
}

//-----------------------------------------------------------------------

function add3dBuilding() {
	map.addLayer({
		'id': '3d-buildings',
		'source': 'composite',
		'source-layer': 'building',
		'filter': ['==', 'extrude', 'true'],
		'type': 'fill-extrusion',
		'minzoom': 15,
		'paint': {
			'fill-extrusion-color': '#ffe500',

			// use an 'interpolate' expression to add a smooth transition effect to the
			// buildings as the user zooms in
			'fill-extrusion-height': [
				'interpolate',
				['linear'],
				['zoom'],
				15,
				0,
				15.05,
				['get', 'height']
			],
			'fill-extrusion-base': [
				'interpolate',
				['linear'],
				['zoom'],
				15,
				0,
				15.05,
				['get', 'min_height']
			],
			'fill-extrusion-opacity': 0.4
		}
	});
}

//-----------------------------------------------------------------------

var geojsonPoint = {
	'type': 'FeatureCollection',
	'features': [
		{
			'type': 'Feature',
			'geometry': {
				'type': 'Point',
				'coordinates': mapCenter
			}
		}
	]
};
var geojson = {
	'type': 'FeatureCollection',
	'features': []
};
var linestring = {
	'type': 'Feature',
	'geometry': {
		'type': 'LineString',
		'coordinates': []
	}
};
var areaPolygon = {
	'type': 'FeatureCollection',
	'features': []
};
var skeletonPolygon = {
	'type': 'FeatureCollection',
	'features': []
};

function setObjectPoint() {
	map.addSource('point', {
		'type': 'geojson',
		'data': geojsonPoint
	});

	map.addLayer({
		'id': 'point',
		'type': 'circle',
		'source': 'point',
		'paint': {
			'circle-radius': 10,
			'circle-color': '#3887be'
		}
	});

	function onMove(e) {
		var coords = e.lngLat;

		canvas.style.cursor = 'grabbing';

		geojsonPoint.features[0].geometry.coordinates = [coords.lng, coords.lat];
		map.getSource('point').setData(geojsonPoint);
	}

	function onUp(e) {
		var coords = e.lngLat;

		console.log('Longitude: ' + coords.lng + '<br />Latitude: ' + coords.lat);
		canvas.style.cursor = '';

		map.off('mousemove', onMove);
		map.off('touchmove', onMove);
	}

	map.on('mouseenter', 'point', function() {
		map.setPaintProperty('point', 'circle-color', '#3bb2d0');
		canvas.style.cursor = 'move';
	});

	map.on('mouseleave', 'point', function() {
		map.setPaintProperty('point', 'circle-color', '#3887be');
		canvas.style.cursor = '';
	});

	map.on('mousedown', 'point', function(e) {
		e.preventDefault();

		canvas.style.cursor = 'grab';

		map.on('mousemove', onMove);
		map.once('mouseup', onUp);
	});

	map.on('touchstart', 'point', function(e) {
		if (e.points.length !== 1) return;

		e.preventDefault();

		map.on('touchmove', onMove);
		map.once('touchend', onUp);
	});
}

//-----------------------------------------------------------------------

function initSourcesAndLayers() {
	map.addSource('area', {
		type: 'geojson',
		data: areaPolygon
	});

	map.addLayer({
		id: 'area',
		type: 'fill-extrusion',
		minzoom: 15,
		source: 'area',
		paint: {
			'fill-extrusion-color': '#ffffff',
			'fill-extrusion-base': 5,
			'fill-extrusion-height': 10,
			'fill-extrusion-opacity': 1
		}
	});

	map.addSource('skeleton', {
		type: 'geojson',
		data: skeletonPolygon
	});

	map.addLayer({
		id: 'skeleton',
		type: 'fill-extrusion',
		source: 'skeleton',
		paint: {
			'fill-extrusion-color': '#ffffff',
			'fill-extrusion-opacity': 1,
			'fill-extrusion-base': {
				type: 'identity',
				property: 'base'
			},
			'fill-extrusion-height': {
				type: 'identity',
				property: 'height'
			}
		}
	});
}

//-----------------------------------------------------------------------

function initGameControls() {
	// pixels the map pans when the up or down arrow is clicked
	const deltaDistance = 100;

	// degrees the map rotates when the left or right arrow is clicked
	const deltaDegrees = 25;

	function easing(t) {
		return t * (2 - t);
	}

	map.getCanvas().focus();

	map.getCanvas().addEventListener(
		'keydown',
		(e) => {
			e.preventDefault();
			if (e.which === 38) {
	// up
	map.panBy([0, -deltaDistance], {
	easing: easing
	});
			} else if (e.which === 40) {
	// down
	map.panBy([0, deltaDistance], {
	easing: easing
	});
			} else if (e.which === 37) {
	// left
	map.easeTo({
	bearing: map.getBearing() - deltaDegrees,
	easing: easing
	});
			} else if (e.which === 39) {
	// right
	map.easeTo({
	bearing: map.getBearing() + deltaDegrees,
	easing: easing
	});
			}
		},
		true
	);
}

//-----------------------------------------------------------------------

function pushAreaObject(name, rect, height) {
	// var x = Math.abs(rect.left - rect.right);
	// var y = Math.abs(rect.top - rect.bottom);
	// var min = Math.min(x, y);
	// var idx = areaPolygon.features.length;
	// var imageName = name + idx;

	areaPolygon.features.push({
		'type': 'Feature',
		'geometry': {
			'type': 'Polygon',
			'coordinates': [[]]
		},
		'properties': {
			'name': name,
			'baseRect': rect,
			'height': height
		}
	});
}

//-----------------------------------------------------------------------

function onMoveAreaObject(e) {
	var coords = e.lngLat,
		idx = areaPolygon.features.length - 1,
		rect = areaPolygon.features[idx].properties.baseRect;

	canvas.style.cursor = 'grabbing';

	areaPolygon.features[idx].geometry.coordinates = [[
		[coords.lng + rect.left, coords.lat + rect.top],
		[coords.lng + rect.left, coords.lat + rect.bottom],
		[coords.lng + rect.right, coords.lat + rect.bottom],
		[coords.lng + rect.right, coords.lat + rect.top],
		[coords.lng + rect.left, coords.lat + rect.top]
		]];
	map.getSource('area').setData(areaPolygon);
}

//-----------------------------------------------------------------------

function getBonesFeatures(properties) {
	function pos(x, y) {
		var unitX = 0.0000295,
			unitY = 0.000018;

		return [properties.center[0] + unitX * x, properties.center[1] + unitY * y];
	}

	var options = {
		steps: 16,
		units: 'meters',
		properties: properties
	},
		features = [],
		radius = properties.height / 2;

	features.push(turf.circle(pos(0 * radius, 0 * radius), radius, options));
	features.push(turf.circle(pos(1 * radius, 0 * radius), radius, options));
	features.push(turf.circle(pos(0 * radius, 1 * radius), radius, options));
	features.push(turf.circle(pos(2 * radius, 0 * radius), radius, options));

	return features;
}

//-----------------------------------------------------------------------

function pushBones() {
	var properties = {};

	properties.base = 0;
	properties.height = 4;
	properties.center = [0, 0];

	skeletonPolygon.features = getBonesFeatures(properties);
}

//-----------------------------------------------------------------------

function onMoveSkeleton(e) {
	var coords = [e.lngLat.lng, e.lngLat.lat],
		idx = skeletonPolygon.features.length - 1,
		properties = skeletonPolygon.features[idx].properties;

	properties.center = coords;

	skeletonPolygon.features = getBonesFeatures(properties);
	map.getSource('skeleton').setData(skeletonPolygon);
}

//-----------------------------------------------------------------------

function onMouseEnterAreaObject() {
	map.setPaintProperty('area', 'circle-color', '#3bb2d0');
	canvas.style.cursor = 'move';
}

//-----------------------------------------------------------------------

function onMouseLeaveAreaObject() {
	map.setPaintProperty('area', 'circle-color', '#3887be');
	canvas.style.cursor = '';
}

//-----------------------------------------------------------------------

function setObjectGenerel(name, rect, height) {
	function onClick(e) {
		canvas.style.cursor = '';

		// map.off('mousemove', onMoveAreaObject);
		map.off('mousemove', onMoveSkeleton);
		map.off('click', onClick);

//		map.on('mouseenter', 'area', onMouseEnterAreaObject);
//		map.on('mouseleave', 'area', onMouseLeaveAreaObject);
	}

	// pushAreaObject(name, rect, height);
	pushBones();

	// map.on('mousemove', onMoveAreaObject);
	map.on('mousemove', onMoveSkeleton);
	map.on('click', onClick);
}

//-----------------------------------------------------------------------

function setObjectBike() {
	setObjectGenerel('bike', {
		top: 0.00003,
		left: 0,
		right: 0.00001,
		bottom: 0,
	}, .5);
}

//-----------------------------------------------------------------------

function setObjectMotorBike() {
	setObjectGenerel('motorbike', {
		top: 0.00003,
		left: 0,
		right: 0.00007,
		bottom: 0,
	}, .5);
}

//-----------------------------------------------------------------------

function setObjectCar() {
	setObjectGenerel('car', {
		top: 0.00008,
		left: 0,
		right: 0.00008,
		bottom: 0,
	}, .5);
}

//-----------------------------------------------------------------------

function setObjectBus() {
	setObjectGenerel('bus', {
		top: 0.0001,
		left: 0,
		right: 0.0002,
		bottom: 0,
	}, .5);
}

//-----------------------------------------------------------------------

function setObjectJelbiSaeule() {
	setObjectGenerel('jelbisaeule', {
		top: 0.00002,
		left: 0,
		right: 0.00003,
		bottom: 0,
	}, 6);
}

//-----------------------------------------------------------------------

function setObjectWaitingHall() {
	setObjectGenerel('waitinghall', {
		top: 0.00010,
		left: 0,
		right: 0.00005,
		bottom: 0,
	}, 4.5);
}

//-----------------------------------------------------------------------

function setObjectSnake() {
	setObjectGenerel('snake', {
		top: 0.00009,
		left: 0,
		right: 0.00050,
		bottom: 0,
	}, 10);
}

//-----------------------------------------------------------------------

function unusedSetObjectSprite() {
	map.loadImage(
		'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png',
		function(error, image) {
			if (error) throw error;

			map.addImage('cat', image);
		});

	map.addSource('car', {
		'type': 'geojson',
		'data': geojsonPoint
	});

	map.addLayer({
		'id': 'car',
		'type': 'symbol',
		'source': 'car',
		'layout': {
			'icon-image': 'cat',
			'icon-size': 0.25
		}
	});

	function onMove(e) {
		var coords = e.lngLat;

		canvas.style.cursor = 'grabbing';

		geojsonPoint.features[0].geometry.coordinates = [coords.lng, coords.lat];
		map.getSource('car').setData(geojsonPoint);
	}

	function onRender() {
		const scale = Math.pow(2, map.getZoom());

		map.setLayoutProperty('car', 'icon-size', 1.0 * scale / 100000);
//		geojsonPoint.features[0].geometry.coordinates = [coords.lng, coords.lat];
//		map.getSource('car').setData(geojsonPoint);
	}

	function onClick(e) {
		map.off('mousemove', onMove);
		map.off('click', onClick);
//		map.off('render', onRender);
	}

	map.on('mousemove', onMove);
	map.on('click', onClick);
	map.on('render', onRender);
}

//-----------------------------------------------------------------------

function nonFunctional() {
}

//-----------------------------------------------------------------------

function unusedSetObjectLine() {
	map.addSource('geojson', {
		'type': 'geojson',
		'data': geojson
	});

	map.addLayer({
		id: 'measure-points',
		type: 'circle',
		source: 'geojson',
		paint: {
			'circle-radius': 5,
			'circle-color': '#fff'
		},
		filter: ['in', '$type', 'Point']
	});
	map.addLayer({
		id: 'measure-lines',
		type: 'line',
		source: 'geojson',
		layout: {
			'line-cap': 'round',
			'line-join': 'round'
		},
		paint: {
			'line-color': '#fff',
			'line-width': 2.5
		},
		filter: ['in', '$type', 'LineString']
	});

	function onMove(e) {
		var features = map.queryRenderedFeatures(e.point, {
			layers: ['measure-points']
		});
		// UI indicator for clicking/hovering a point on the map
		canvas.style.cursor = features.length
			? 'pointer'
		: 'crosshair';
	};

	function onClick(e) {
		var features = map.queryRenderedFeatures(e.point, {
			layers: ['measure-points']
		});

		// Remove the linestring from the group
		// So we can redraw it based on the points collection
		if (geojson.features.length > 1) geojson.features.pop();

		// If a feature was clicked, remove it from the map
		if (features.length) {
			var id = features[0].properties.id;
			geojson.features = geojson.features.filter(function(point) {
				return point.properties.id !== id;
			});
		} else {
			var point = {
				'type': 'Feature',
				'geometry': {
					'type': 'Point',
					'coordinates': [e.lngLat.lng, e.lngLat.lat]
				},
				'properties': {
					'id': String(new Date().getTime())
				}
			};

			geojson.features.push(point);
		}

		if (geojson.features.length > 1) {
			linestring.geometry.coordinates = geojson.features.map(function(
				point
			) {
				return point.geometry.coordinates;
			});

			geojson.features.push(linestring);
		}

		map.getSource('geojson').setData(geojson);

		if (geojson.features.length > 4) {
			map.off('mousemove', onMove);
			map.off('click', onClick);

			canvas.style.cursor = '';
		}
	}

	map.on('mousemove', onMove);
	map.on('click', onClick);
}

//-----------------------------------------------------------------------

map.on('load', function () {
	'use strict';

	initSourcesAndLayers();
	addMapControls();
	add3dBuilding();

	initGameControls();
});

//-----------------------------------------------------------------------
