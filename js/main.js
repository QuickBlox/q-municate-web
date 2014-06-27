/*
 * Q-municate chat application
 *
 * Main Application Module
 *
 */
(function($, ChromaHash, QB, QBAPP) {
  var userActions = require('./actions');

  var APP = {
    init: function() {
      userActions();
      this.chromaHash();
    },

    chromaHash: function() {
      new ChromaHash({
        visualization: 'bars'
      });
    }
  };

  APP.init();
})(jQuery, ChromaHash, QB, QBAPP);
