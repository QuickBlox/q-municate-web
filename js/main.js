/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

var UserActions = require('./actions'),
    QBApiCalls = require('./qbApiCalls');

var APP = {
  init: function() {
    this.scrollbar();
    this.chromaHash();
    this.setDefAvatar();
    this.setHtml5Patterns();
    UserActions.init();
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

  setDefAvatar: function() {
    $('#defAvatar').find('img').attr('src', QMCONFIG.defAvatar.url).siblings('span').text(QMCONFIG.defAvatar.caption);
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
