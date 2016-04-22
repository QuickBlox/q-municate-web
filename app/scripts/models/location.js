/**
 * Helper Module
 */

define([], function() {

  var Location = {};

  Location = {

  	getGeoCoordinates: function() {
  		var geoCoords = {};

  		navigator.geolocation.getCurrentPosition(function(position) {
		    geoCoords.latitude  = position.coords.latitude;
		    geoCoords.longitude = position.coords.longitude;
		  });
  		console.info(geoCoords);
  		return geoCoords;
  	}

	return Location;

});