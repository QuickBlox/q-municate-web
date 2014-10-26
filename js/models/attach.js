/*
 * Q-municate chat application
 *
 * Attach Module
 *
 */

module.exports = Attach;

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
    return {
      id: blob.id,
      type: blob.content_type,
      name: blob.name,
      size: size,
      url: blob.path && blob.path.replace('http://', 'https://') || null,
      uid: blob.uid
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
