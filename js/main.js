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
    this.setDefAvatar();
    this.setHtml5Patterns();
    UserActions.init();
    QBApiCalls.init();

    if (QMCONFIG.debug) console.log('App init', this);
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

    $('.regexp-name').attr({pattern: FULL_NAME, title: 'Minimum length is 3 symbols, maximum is 50'});
    $('.regexp-email').attr('title', 'Should look like an email address');
    $('.regexp-pass').attr({pattern: ALLNUM_ALLPUNCT, title: 'Should contain alphanumeric and punctuation characters only. Minimum length is 8 symbols, maximum is 40'});
  }
};

$(document).ready(function() {
  APP.init();
});
