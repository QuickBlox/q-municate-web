/**
 * Helper Module
 */

define([], function() {

  var Location = {};

  Location = {

  	getGeoCoordinates: function() {
  		var geoCoords = {};

      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      function error(err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
      };
      
      function success(position) {
        geoCoords.lat = position.coords.latitude;
        geoCoords.long = position.coords.longitude;

        return geoCoords;
      };

      navigator.geolocation.getCurrentPosition(success, error, options);
  	}

  }
    
  return Location;
});