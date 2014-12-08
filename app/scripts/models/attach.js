/*
 * Q-municate chat application
 *
 * Attach Module
 *
 */

define(['loadImage', 'canvasToBlob'], function(loadImage, dataURLtoBlob) {

  function Attach(app) {
    this.app = app;
  }

  Attach.prototype = {

    upload: function(file, callback) {
      var QBApiCalls = this.app.service,
          self = this;

      QBApiCalls.createBlob({file: file, 'public': true}, function(blob) {
        callback(blob);
      });
    },

    create: function(blob, size) {
      var type = blob.content_type.indexOf('audio/') === 0 ? 'audio' :
                 blob.content_type.indexOf('video/') === 0 ? 'video' :
                 'photo';

      return {
        type: type,
        url: blob.path && blob.path.replace('http://', 'https://') || null,
        name: blob.name,
        size: size,
        'content-type': blob.content_type
      };
    },

    crop: function(file, params, callback) {
      loadImage(
        file,
        function (img) {
          var attr = {crop: true};
          if (img.width > img.height)
            attr.maxWidth = params.w;
          else
            attr.maxHeight = params.h;
          
          loadImage(
            file,
            function (canvas) {
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
