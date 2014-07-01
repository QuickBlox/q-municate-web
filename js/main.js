/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

var UserActions = require('./actions'),
    QBApiCalls = require('./qbApi');

var APP = {
  init: function() {
    this.chromaHash();
    UserActions.init();
    QBApiCalls.init();

    if (QMCONFIG.debug) console.log('App init', this);
  },

  chromaHash: function() {
    new ChromaHash({
      visualization: 'bars'
    });
  }
};

$(document).ready(function() {
  APP.init();
});
