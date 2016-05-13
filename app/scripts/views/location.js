/**
 * Location
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
        var error= 'ERROR('+err.code+'): '+err.message;

        callback(null, error);
      }

  		navigator.geolocation.getCurrentPosition(success, fail);
    },

    getStaticMapUrl: function(geoCoords, options) {
      var params = {
        'size': options && options.size || [200, 150],
        'lat': geoCoords.latitude,
        'lng': geoCoords.longitude,
        'zoom': options && options.zoom || 15,
        'markers': [{lat: geoCoords.latitude, lng: geoCoords.longitude}]
      };

      return GMaps.staticMapURL(params);
    },

    getMapUrl: function(geoCoords) {
      return 'https://www.google.com/maps?q='+geoCoords.latitude+','+geoCoords.longitude;
    },

    toggleGeoCoordinatesToLocalStorage: function(saveLocation, callback) {
      if (saveLocation) {  
        this.getGeoCoordinates(function(res, err) {
          if (err) {
            Helpers.log(err);

            if (err.indexOf('ERROR(1):') > -1) {
              $('.j-geoInfo').addClass('is-overlay')
               .parent('.j-overlay').addClass('is-overlay');
            }

            $('.j-send_location').removeClass('btn_active');
            
            localStorage.removeItem('QM.latitude');
            localStorage.removeItem('QM.longitude');

            callback(null, err);
          } else {
            localStorage.setItem('QM.latitude', res.latitude);
            localStorage.setItem('QM.longitude', res.longitude);

            callback('Added coordinates to localStorage: latitude('+res.latitude+'), longitude('+res.longitude+')');
          }
        });
      } else {
        localStorage.removeItem('QM.latitude');
        localStorage.removeItem('QM.longitude');

        callback('Removed coordinates from localStorage');
      }
    },

    addMap: function($gmap){
      $gmap.prepend('<div id="map" class="open_map j-open_map"></div>');

      function _addMap(res) {
        var mapCoords = {};
        var map = new GMaps({
          div: '#map',
          lat: res ? res.latitude : 0,
          lng: res ? res.longitude : 0,
          zoom: res ? 15 : 1
        });

        $('#map img').addClass('gooImg');

        GMaps.on('click', map.map, function(event) {
          mapCoords.lat = event.latLng.lat(),
          mapCoords.lng = event.latLng.lng();

          localStorage.setItem('QM.locationAttach', JSON.stringify(mapCoords));

          map.removeMarkers();

          map.addMarker({
            lat: mapCoords.lat,
            lng: mapCoords.lng,
            title: 'Marker'
          });

          $('.j-send_map').addClass('is-active');
        });
      }

      this.getGeoCoordinates(function(res, err) {
        if (err) {
          _addMap();
        } else {
          _addMap(res);
        }
      });
    }

  };
    
  return Location;
});