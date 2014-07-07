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
    var FULL_NAME = "[^><;]{3,50}";
    var ALLNUM_ALLPUNCT = "[A-Za-z0-9`~!@#%&=_<>;:,'" + '\\"' + "\\.\\$\\^\\*\\-\\+\\\\\/\\|\\(\\)\\[\\]\\{\\}\\?]{8,40}";

    $('.pattern-name').attr('pattern', FULL_NAME);
    $('.pattern-pass').attr('pattern', ALLNUM_ALLPUNCT);
  }
};

$(document).ready(function() {
  APP.init();
});
