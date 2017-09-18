/**
 *
 * Q-MUNICATE Location Module
 *
 */
define([
    'googlemaps!',
    'gmaps',
    'Helpers'
], function(
    googleMaps,
    GMaps,
    Helpers
) {
    var Location,
        watchId;

    Location = {

        getGeoCoordinates: function(watch, callback) {
            function success(pos) {
                var geoCoords = {};

                geoCoords.latitude = pos.coords.latitude;
                geoCoords.longitude = pos.coords.longitude;

                callback(geoCoords);
            }

            function fail(err) {
                var error = 'ERROR(' + err.code + '): ' + err.message;

                callback(null, error);
            }

            if (watch) {
                watchId = navigator.geolocation.watchPosition(success, fail);
            } else {
                navigator.geolocation.getCurrentPosition(success, fail);
            }
        },

        getStaticMapUrl: function(geoCoords, options) {
            var params = {
                'size': options && options.size || [200, 150],
                'lat': geoCoords.lat,
                'lng': geoCoords.lng,
                'zoom': options && options.zoom || 15,
                'markers': [{
                    lat: geoCoords.lat,
                    lng: geoCoords.lng
                }]
            };

            return GMaps.staticMapURL(params);
        },

        getMapUrl: function(geoCoords) {
            return 'https://www.google.com/maps?q=' + geoCoords.lat + ',' + geoCoords.lng;
        },

        toggleGeoCoordinatesToLocalStorage: function(saveLocation, callback) {
            var isCoords = (localStorage['QM.latitude'] && localStorage['QM.longitude']) ? true : false,
                $button = $('.j-send_location');

            if (saveLocation) {
                this.getGeoCoordinates(true, function(res, err) {
                    if (err) {
                        Helpers.log(err);

                        if (err.indexOf('ERROR(1):') > -1) {
                            $('.j-geoInfo').addClass('is-overlay')
                                .parent('.j-overlay').addClass('is-overlay');
                        }

                        if (isCoords) {
                            navigator.geolocation.clearWatch(watchId);
                            localStorage.removeItem('QM.latitude');
                            localStorage.removeItem('QM.longitude');
                            $button.removeClass('btn_active');
                        }

                        callback(null, err);
                    } else {
                        localStorage.setItem('QM.latitude', res.latitude);
                        localStorage.setItem('QM.longitude', res.longitude);

                        $button.addClass('btn_active');

                        callback('Added coordinates to localStorage: latitude(' + res.latitude + '), longitude(' + res.longitude + ')');
                    }
                });
            } else {
                localStorage.removeItem('QM.latitude');
                localStorage.removeItem('QM.longitude');

                $button.removeClass('btn_active');

                navigator.geolocation.clearWatch(watchId);

                callback('Removed coordinates from localStorage');
            }
        },

        addMap: function($gmap) {
            $gmap.prepend('<div id="map" class="open_map j-open_map"></div>');

            var isCoords = (localStorage['QM.latitude'] && localStorage['QM.longitude']) ? true : false,
                mapCoords = {};

            var map = new GMaps({
                'div': '#map',
                'lat': isCoords ? localStorage['QM.latitude'] : 0,
                'lng': isCoords ? localStorage['QM.longitude'] : 0,
                'zoom': isCoords ? 15 : 1
            });

            $('#map img').addClass('gooImg');

            if (!isCoords) {
                this.getGeoCoordinates(false, function(res, err) {
                    if (res) {
                        map.setZoom(15);
                        map.setCenter(res.latitude, res.longitude);
                    }
                });
            }

            GMaps.on('click', map.map, function(event) {
                mapCoords.lat = event.latLng.lat();
                mapCoords.lng = event.latLng.lng();

                localStorage.setItem('QM.locationAttach', JSON.stringify(mapCoords));

                map.removeMarkers();

                map.addMarker({
                    'lat': mapCoords.lat,
                    'lng': mapCoords.lng,
                    'title': 'Marker'
                });

                $('.j-send_map').addClass('is-active');

            });
        }

    };

    return Location;
});
