/*
 * Q-municate chat application
 *
 * Attach Module
 *
 */
define([
    'loadImage'
], function(
    loadImage
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

        create: function(blob, metadata) {
            var type = blob.content_type.indexOf('image/') === 0 ? 'image' :
                blob.content_type.indexOf('audio/') === 0 ? 'audio' :
                blob.content_type.indexOf('video/') === 0 ? 'video' :
                'file';

            return {
                'type': type,
                'id': blob.uid,
                'name': blob.name,
                'size': blob.size || metadata.size,
                'content-type': blob.content_type,
                'duration': metadata.duration,
                'height': metadata.height,
                'width': metadata.width
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
