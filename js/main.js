/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

var Routes = require('./routes'),
    QBApiCalls = require('./qbApiCalls');

var APP = {
  init: function() {
    this.scrollbar();
    this.chromaHash();
    this.setHtml5Patterns();
    Routes.init();
    QBApiCalls.init();

    if (QMCONFIG.debug) console.log('App init', this);
  },

  scrollbar: function() {
    $('.scrollbar').mCustomScrollbar({
      theme: 'minimal-dark',
      scrollInertia: 150
    });
  },

  chromaHash: function() {
    new ChromaHash({
      visualization: 'bars'
    });
  },

  setHtml5Patterns: function() {
    $('.pattern-name').attr('pattern', QMCONFIG.patterns.name);
    $('.pattern-pass').attr('pattern', QMCONFIG.patterns.password);
  }
};

$(document).ready(function() {
  APP.init();
});
