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

        geoCoords.lat = position.coords.latitude;
        geoCoords.lng = position.coords.longitude;

        callback(geoCoords);
      });
    },

    getStaticMapUrl: function(geoCoords) {
      var params = {
        size: [300, 300],
        lat: geoCoords.lat,
        lng: geoCoords.lng,
        zoom: 16,
        markers: [{lat: geoCoords.lat, lng: geoCoords.lng}]
      };

      return GMaps.staticMapURL(params);
    },

    getMapUrl: function(geoCoords) {
      return mapUrl = 'https://www.google.com/maps?q='+geoCoords.lat+','+geoCoords.lng;
    }

  }
    
  return Location;
});