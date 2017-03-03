/*
 * Q-municate chat application
 *
 * Attach Module
 *
 */
define([
    'loadImage',
    'canvasToBlob'
], function(
    loadImage,
    dataURLtoBlob
) {

    function Attach(app) {
        this.app = app;
    }

    Attach.prototype = {

        upload: function(file, callback) {
            var self = this,
                QBApiCalls = self.app.service;

            QBApiCalls.createBlob({
                'file': file,
                'public': true
            }, function(blob) {
                callback(blob);
            });
        },

        create: function(blob, metaData) {
            var type = blob.content_type.indexOf('image/') === 0 ? 'image' :
                blob.content_type.indexOf('audio/') === 0 ? 'audio' :
                blob.content_type.indexOf('video/') === 0 ? 'video' :
                'file';

            return {
                'type': type,
                'id': blob.uid,
                'name': blob.name,
                'content-type': blob.content_type,
                'duration': metaData.duration,
                'height': metaData.height,
                'width': metaData.width,
                'size': metaData.size
            };
        },

        crop: function(file, params, callback) {
            loadImage(
                file,
                function(img) {
                    var attr = {
                        'crop': true
                    };
                    if (img.width > img.height) {
                        attr.maxWidth = params.w;
                    } else {
                        attr.maxHeight = params.h;
                    }

                    loadImage(
                        file,
                        function(canvas) {
                            canvas.toBlob(function(blob) {
                                blob.name = file.name;
                                callback(blob);
                            }, file.type);
                        },
                        attr
                    );
                }
            );
        }

    };

    return Attach;

});
