/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
		var timeID;
		var geoIntervalID;
		var geolocationID;
		var startTime;
		var currentPosition;
		var distance = 0; // meters
		var rythme = 0; // min/km
		var track;
		
		$("#play").on("tap", function(){
			console.log("play tap");
			startEmulatedTracker();
		});

		$("#stop").on("tap", function(){
			stopTracker();
		});

		$("#save").on("tap", function(){
			saveTrack();
		});

		function startEmulatedTracker() {
			if(typeof(geoIntervalID) == "undefined") {
				startTime = Date.now();
				currentPosition = new LatLon(43.37372818,1.74102725);
				distance = 0;
				rythme = 0;
				track = new Array();
				
				updateTimerIndicator();
				updateGeolocationIndicators();
				
				timeID = setInterval(function () {onTimeInterval()}, 1000);
				geoIntervalID = setInterval(function () {onGeolocationInterval()}, 5000);
				geolocationID = navigator.geolocation.watchPosition(onGeolocationSuccess, onGeolocationError,{ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
			}
		}
		
		function startTracker() {
			if(typeof(geolocationID) == "undefined") {
				startTime = Date.now();
				currentPosition = new LatLon(43.37372818,1.74102725);
				distance = 0;
				rythme = 0;
				track = new Array();
				
				updateTimerIndicator();
				updateGeolocationIndicators();
				
				timeID = setInterval(function () {onTimeInterval()}, 1000);
				geolocationID = navigator.geolocation.watchPosition(onGeolocationUpdate, onGeolocationError,{ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
			}
		}
		
		function stopTracker() {
			if(typeof(timeID) !== "undefined") {
				clearInterval(timeID);
				timeID = undefined
			}
			if(typeof(geoIntervalID) !== "undefined") {
				clearInterval(geoIntervalID);
				geoIntervalID = undefined
			}	
			if(typeof(geolocationID) !== "undefined") {
				navigator.geolocation.clearWatch(geolocationID);
				geolocationID = undefined
			}
		}
		
		//function saveTrack() {
			//var now = new Date();
			//var gpxHeader =
				//'<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' + '\n' +
				//'<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="Tracker" version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">' + '\n' +
				//'  <metadata>' + '\n' +
				//'    <link href="http://www.garmin.com">' + '\n' +
				//'      <text>Garmin International</text>' + '\n' +
				//'    </link>' + '\n' +
				//'    <time>' + now.toISOString() + '</time>' + '\n' +
				//'  </metadata>' + '\n' +
				//'  <trk>' + '\n' +
				//'    <name>Track ' + now.toLocaleString() + '</name>' + '\n' +
				//'    <trkseg>';
			//var gpxFooter =
				//'    </trkseg>' + '\n' +
				//'  </trk>' + '\n' +
				//'</gpx> ';
			//var gpxTrack = gpxHeader;
			////track.forEach(function (trkpt) {
				////gpxTrack += '      <trkpt lat="' + trkpt.coords.latitude + '" lon="' + trkpt.coords.longitude + '">' + '\n';
				////gpxTrack += '        <ele>' + trkpt.altitude + '</ele>' + '\n';
				////gpxTrack += '        <time>' + trkpt.timestamp + '</time>' + '\n';
				////gpxTrack += '      </trkpt>' + '\n';	
			////});
			////for (let trkpt of track) {
				////gpxTrack += '      <trkpt lat="' + trkpt.coords.latitude + '" lon="' + trkpt.coords.longitude + '">' + '\n';
				////gpxTrack += '        <ele>' + trkpt.altitude + '</ele>' + '\n';
				////gpxTrack += '        <time>' + trkpt.timestamp + '</time>' + '\n';
				////gpxTrack += '      </trkpt>' + '\n';
			////};

			//window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

			//function gotFS(fileSystem) {
				//fileSystem.root.getFile("readme.txt", {create: true, exclusive: false}, gotFileEntry, fail);
			//}

			//function gotFileEntry(fileEntry) {
				//fileEntry.createWriter(gotFileWriter, fail);
			//}

			//function gotFileWriter(writer) {
				//writer.write("some sample text");
				//writer.onwriteend = function(evt) {
					//console.log("contents of file now 'some sample text'");
					//writer.truncate(11);  
					//writer.onwriteend = function(evt) {
						//console.log("contents of file now 'some sample'");
						//writer.seek(4);
						//writer.write(" different text");
						//writer.onwriteend = function(evt){
							//console.log("contents of file now 'some different text'");
						//};
					//};
				//};
			//}

			//function fail(error) {
				//console.log(error.code);
			//}
		//}
		
		function onTimeInterval() {
			updateTimerIndicator();
		}
		
		function onGeolocationInterval() {
			var step = 0.015 + 0.015*0.2*Math.random() - 0.015*0.1;
			var angle = 45 + 45*0.2*Math.random() - 45*0.1;
			var newPosition = currentPosition.destinationPoint(angle,step)
			var position = {
				coords: {
					latitude: newPosition.lat,
					longitude: newPosition.lon,
					altitude:270
				},
				timestamp: Date.now()
			};

			onGeolocationUpdate(position);
		}
		
		function onGeolocationUpdate(position) {
			var newPosition = new LatLon(position.coords.latitude, position.coords.longitude);
			var step = currentPosition.distanceTo(newPosition);
			
			currentPosition = newPosition;
			distance += step;
			rythme = (rythme + 1/(step*12)) / 2;
			
			track.push(position);
			updateGeolocationIndicators();
		}
		
		function onGeolocationSuccess(position) {
			console.log(new Date().toLocaleTimeString() 
						+ ' Latitude: ' + position.coords.latitude  
						+ ' Longitude: ' + position.coords.longitude 
						+ ' Altitude: ' + position.coords.altitude
						+ ' Accuracy: ' + position.coords.accuracy
						+ ' Speed: ' + position.coords.speed
						+ ' Time: ' + new Date(position.timestamp).toISOString());
		}
		
		function onGeolocationError(error) {
			console.log('onError: ' + error);
			alert('onError!');
		}

		function updateTimerIndicator() {
			var d = new Date(); 
			d.setHours(0);
			d.setMinutes(0);
			d.setSeconds((Date.now() - startTime) / 1000);
			document.getElementById("duration").innerHTML = d.toLocaleTimeString();
		}
		
		function updateGeolocationIndicators() {
			document.getElementById("distance").innerHTML = (distance).toFixed(2);
			document.getElementById("rythme").innerHTML = rythme.toFixed(1);
		}
    }
};
