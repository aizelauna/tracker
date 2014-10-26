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
        
		$(function(){
    		$( "[data-role='footer']" ).toolbar();
		});
		
		document.addEventListener("backbutton", function(e){
			if($.mobile.activePage.is('#page-live-tracking')){
				navigator.notification.confirm(
					'Do you want to exit ?',  // message
					function onConfirm(buttonIndex) {
						if(buttonIndex === 1) {
							if(typeof(window.plugin) !== "undefined") {
								window.plugin.notification.local.cancelAll();
							}
							e.preventDefault();
							navigator.app.exitApp();
						}
					}
				);
			}
			else {
				navigator.app.backHistory()
			}
		}, false);		

		$.event.special.swipe.scrollSupressionThreshold = 10; // More than this horizontal displacement, and we will suppress scrolling.
		$.event.special.swipe.horizontalDistanceThreshold = Math.round(30 / window.devicePixelRatio); // Swipe horizontal displacement must be more than this.
		$.event.special.swipe.durationThreshold = 500;  // More time than this, and it isn't a swipe.
		$.event.special.swipe.verticalDistanceThreshold = 75; // Swipe vertical displacement must be less than this.
		
		$(document).on("swipeleft", "#page-live-tracking", function() {
			app.updateHistory();
			$.mobile.changePage("#page-history", {transition: "slide", reverse: false});
		});
		$(document).on("swiperight", "#page-history", function() {
			$.mobile.changePage("#page-live-tracking", {transition: "slide", reverse: true});
		});		
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
		$("#play").attr("disabled", "");
		$("#pause").attr("disabled", "");
		$("#stop").attr("disabled", "");
		$("#save").attr("disabled", "");

		if(typeof(window.plugin) !== "undefined") {
			window.plugin.notification.local.add({ title: 'Tracker', message: 'Running. Tap to open.', sound: null, ongoing: true });
		}
		
		app.manageLiveTracking();
    },
    
    manageLiveTracking: function() {
		var timeID = undefined;
		var geoIntervalID = undefined;
		var geolocationID = undefined;
		var startTime = 0;
		var currentPosition = undefined;
		var distance = 0; // meters
		var pace = 0; // min/km
		var track;	

		//geoIntervalID = setInterval(function () {onGeolocationInterval()}, 5000);
		geolocationID = navigator.geolocation.watchPosition(
			onGeolocationUpdate, onGeolocationError,
			{ maximumAge: 2000, 
			  timeout: 3000, 
			  enableHighAccuracy: true 
		    });

		$("#play").removeAttr("disabled", "");
		
		$("#play").on("tap", function(){
			$("#play").attr("disabled", "");
			$("#save").attr("disabled", "");
			$("#pause").removeAttr("disabled", "");
			$("#stop").removeAttr("disabled", "");
			
			startTracker();
		});

		$("#stop").on("tap", function(){
			$("#pause").attr("disabled", "");
			$("#stop").attr("disabled", "");
			$("#play").removeAttr("disabled", "");
			$("#save").removeAttr("disabled", "");
			
			stopTracker();
		});

		$("#save").on("tap", function(){
			$("#pause").attr("disabled", "");
			$("#stop").attr("disabled", "");
			$("#save").attr("disabled", "");
			$("#play").removeAttr("disabled", "");
			
			saveTrack();
		});

		function startTracker() {
			if(typeof(geolocationID) !== "undefined") {
				startTime = Date.now();
				currentPosition = undefined;
				distance = 0;
				pace = 0;
				track = new Array();
				
				updateTimerIndicator();
				updateGeolocationIndicators();
				
				timeID = setInterval(function () {onTimeInterval()}, 1000);
			}
		}
		
		function stopTracker() {
			startTime = 0;
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
		
		function saveTrack() {
			var now = new Date();
			var gpxHeader =
				'<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' + '\n' +
				'<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="Tracker" version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">' + '\n' +
				'  <metadata>' + '\n' +
				'    <link href="http://tracker.esponde.net">' + '\n' +
				'      <text>tracker.esponde.net</text>' + '\n' +
				'    </link>' + '\n' +
				'    <time>' + now.toISOString() + '</time>' + '\n' +
				'  </metadata>' + '\n' +
				'  <trk>' + '\n' +
				'    <name>Track ' + now.yyyymmdd() + '</name>' + '\n' +
				'    <trkseg>';
			var gpxFooter =
				'    </trkseg>' + '\n' +
				'  </trk>' + '\n' +
				'</gpx> ';
				
			var gpxTrack = gpxHeader;
			track.forEach(function (trkpt) {
				gpxTrack += '      <trkpt lat="' + trkpt.coords.latitude + '" lon="' + trkpt.coords.longitude + '">' + '\n';
				gpxTrack += '        <ele>' + trkpt.coords.altitude + '</ele>' + '\n';
				gpxTrack += '        <time>' + new Date(trkpt.timestamp).toISOString() + '</time>' + '\n';
				gpxTrack += '      </trkpt>' + '\n';	
			});
			gpxTrack += gpxFooter;

			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

			function gotFS(fileSystem) {
				fileSystem.root.getDirectory("Tracker", {create:true}, gotDirectory, fail);
				function gotDirectory(directoryEntry){
					directoryEntry.getFile("Track " + now.yyyymmdd() + ".gpx", {create: true, exclusive: false}, gotFileEntry, fail);
					function gotFileEntry(fileEntry) {
						fileEntry.createWriter(gotFileWriter, fail);
						function gotFileWriter(writer) {
							writer.write(gpxTrack);
						}
					}
				}
			}

			function fail(error) {
				console.log("Failed to write Tracker/Track-" + now.yyyymmdd() + ".gpx (error " + error.code + ")");
			}
		}
		
		function onTimeInterval() {
			updateTimerIndicator();
		}
		
		function onGeolocationUpdate(position) {
			var step = 0;
			$("#gps-status").text((position.coords.accuracy < 10) ? "GPS: Ready" : "GPS: Fixing...");
			
			if(startTime > 0) {
				if(typeof(currentPosition) === "undefined") {
					currentPosition = position;			
					track.push(position);
				} else {
					var newLatLon = new LatLon(position.coords.latitude, position.coords.longitude);
					var currentLatLon = new LatLon(currentPosition.coords.latitude, currentPosition.coords.longitude)
					var stepTime = (position.timestamp - currentPosition.timestamp) / 1000; //time in seconds
					step = currentLatLon.distanceTo(newLatLon);
					stepPace = 1/(step*(60/stepTime));
					
					if(step >= 0.001 || stepTime > 60) {		//more than 1 meter or 1 minute
						currentPosition = position;
						distance += step;
						pace = (pace + 15*stepPace) / 16;
						track.push(position);
					} else if(stepPace < 240) {		//more than 240 min/km (very slow speed)
						pace = (pace + 15*stepPace) / 16;
					} else { 	//we are no more moving
						pace = 0;	
					}
				} 
				updateGeolocationIndicators();
			}
			
			//console.log(' Latitude: ' + position.coords.latitude  
						//+ ' Longitude: ' + position.coords.longitude 
						//+ ' Altitude: ' + position.coords.altitude
						//+ ' Step: ' + step*1000
						//+ ' Time: ' + new Date(position.timestamp).toISOString());
		}
			
		function onGeolocationError(error) {
			$("#gps-status").text("GPS: Fixing...");
		}

		function updateTimerIndicator() {
			var d = new Date(); 
			d.setHours(0);
			d.setMinutes(0);
			d.setSeconds((Date.now() - startTime) / 1000);
			$("#duration").text(d.toLocaleTimeString());
		}
		
		function updateGeolocationIndicators() {
			$("#distance").text(distance.toFixed(2));
			$("#pace").text(pace.toFixed(1));
		}
		
		function onGeolocationInterval() {
			var position;
			if(typeof(currentPosition) === "undefined") {
				position = {
					coords: {
						latitude: 43.37372818,
						longitude: 1.74102725,
						altitude:280
					},
					timestamp: Date.now()
				};
			} else {			
				var step = 0.015 + 0.015*0.2*Math.random() - 0.015*0.1;
				var angle = 45 + 45*0.2*Math.random() - 45*0.1;
				var newPosition = new LatLon(currentPosition.coords.latitude, currentPosition.coords.longitude).destinationPoint(angle,step);
				position = {
					coords: {
						latitude: newPosition.lat,
						longitude: newPosition.lon,
						altitude:270
					},
					timestamp: Date.now()
				};
			}
			
			onGeolocationUpdate(position);
		}
				
		Date.prototype.yyyymmdd = function() {                                 
			var yyyy = this.getFullYear().toString();                                    
			var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
			var dd  = this.getDate().toString();             
			var hh  = this.getHours().toString();             
			var min  = this.getMinutes().toString();             
			var sec  = this.getSeconds().toString();             
                            
			return yyyy 
			       + '-' + (mm[1]?mm:"0"+mm[0]) 
			       + '-' + (dd[1]?dd:"0"+dd[0])
			       + ' ' + (hh[1]?hh:"0"+hh[0])
			       + '-' + (min[1]?min:"0"+min[0])
			       + '-' + (sec[1]?sec:"0"+sec[0]);
		};		
    },

    updateHistory: function() {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

		function gotFS(fileSystem) {
			fileSystem.root.getDirectory("Tracker", {create:true}, gotDirectory, fail);
			function gotDirectory(directoryEntry){
				directoryEntry.createReader().readEntries(function(entries) {
					$("#history").empty();
					entries.forEach(function(entry) {
						if(entry.isFile) {
							$("#history").append('<li><a href="#">' + entry.name + '</a></li>');
						}
					});
					$("#history").listview("refresh");
				});				
			}
		}
		
		function fail(error) {
			console.log("Failed to read Tracker folder (error " + error.code + ")");
		}
	},

    logObject: function(o) {
		var cache = [];
		console.log(JSON.stringify(o, function(key, value) {
			if (typeof value === 'object' && value !== null) {
				if (cache.indexOf(value) !== -1) {
					// Circular reference found, discard key
					return;
				}
				// Store value in our collection
				cache.push(value);
			}
			return value;
		}));
		cache = null;
	}
};
