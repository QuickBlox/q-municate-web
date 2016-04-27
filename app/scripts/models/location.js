/**
 * Helper Module
 */

define(['googlemaps!', 'gmaps', 'Helpers'], function(googleMaps, GMaps, Helpers) {
  google.maps === googleMaps;

  var Location = {};

  Location = {

  	getGeoCoordinates: function(callback) {
  		navigator.geolocation.getCurrentPosition(function(position) {
        var geoCoords = {};

        geoCoords.latitude = position.coords.latitude;
        geoCoords.longitude = position.coords.longitude;

        callback(geoCoords);
      });
    },

    getStaticMapUrl: function(geoCoords) {
      var params = {
        size: [300, 300],
        lat: geoCoords.latitude,
        lng: geoCoords.longitude,
        zoom: 16,
        markers: [{lat: geoCoords.latitude, lng: geoCoords.longitude}]
      };

      return GMaps.staticMapURL(params);
    },

    getMapUrl: function(geoCoords) {
      return mapUrl = 'https://www.google.com/maps?q='+geoCoords.latitude+','+geoCoords.longitude;
    }

  }
    
  return Location;
});