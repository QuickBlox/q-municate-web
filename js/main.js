/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

(function(window, $, ChromaHash, QB, CONFIG) {
  var actionsModule = require('./actions'),
      UserActions = new actionsModule();

  var APP = {
    init: function() {
      this.chromaHash();
      UserActions.init();

      if (CONFIG.debug) console.log('App init', this);
    },

    chromaHash: function() {
      new ChromaHash({
        visualization: 'bars'
      });
    }
  };

  APP.init();
})(window, jQuery, ChromaHash, QB, CONFIG);
