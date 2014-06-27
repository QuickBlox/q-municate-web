/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

(function(window, $, ChromaHash, QB, QBAPP) {
  var actionsModule = require('./actions'),
      UserActions = new actionsModule();

  var APP = {
    init: function() {
      this.chromaHash();
      UserActions.init();
    },

    chromaHash: function() {
      new ChromaHash({
        visualization: 'bars'
      });
    }
  };

  APP.init();
})(window, jQuery, ChromaHash, QB, QBAPP);
