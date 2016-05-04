/**
 * Helper Module
 */

define(['googlemaps!', 'gmaps', 'Helpers'], function(googleMaps, GMaps, Helpers) {
  google.maps === googleMaps;

  var Location = {};

  Location = {

  	getGeoCoordinates: function(callback) {
      function success(pos) {
        var geoCoords = {
          'latitude': pos.coords.latitude,
          'longitude': pos.coords.longitude
        };

        callback(geoCoords);
      }

      function fail(err) {
        var error= 'ERROR('+err.code + '): '+err.message;

        callback(null, error);
      }

  		navigator.geolocation.getCurrentPosition(success, fail);
    },

    getStaticMapUrl: function(geoCoords) {
      var params = {
        'size': [200, 200],
        'lat': geoCoords.latitude,
        'lng': geoCoords.longitude,
        'zoom': 15,
        'markers': [{lat: geoCoords.latitude, lng: geoCoords.longitude}]
      };

      return GMaps.staticMapURL(params);
    },

    getMapUrl: function(geoCoords) {
      return 'https://www.google.com/maps?q='+geoCoords.latitude+','+geoCoords.longitude;
    },

    toggleGeoCoordinatesToLocalStorage: function(saveLocation) {
      if (saveLocation) {  
        this.getGeoCoordinates(function(res, err) {
          if (err) {
            Helpers.log('Error: ',err);
          } else {
            localStorage.setItem('QM.latitude', res.latitude);
            localStorage.setItem('QM.longitude', res.longitude);
          }
        });
      } else {
        localStorage.removeItem('QM.latitude');
        localStorage.removeItem('QM.longitude');
      }
    }

  };
    
  return Location;
});