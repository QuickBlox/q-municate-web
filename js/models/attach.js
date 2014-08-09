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
      url: blob.path,
      uid: blob.uid
    };
  }

};
