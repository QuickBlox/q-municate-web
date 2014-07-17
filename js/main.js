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
    var token;

    this.scrollbar();
    this.chromaHash();
    this.setHtml5Patterns();
    Routes.init();

    if (QMCONFIG.debug) console.log('App init', this);

    // Checking if autologin was chosen
    if (localStorage.getItem('QM.session') && localStorage.getItem('QM.user') &&
        // new format of storage data (14.07.2014)
        JSON.parse(localStorage.getItem('QM.user')).contact &&
        // new format of storage data (17.07.2014)
        JSON.parse(localStorage.getItem('QM.user')).contact.xmpp_jid) {

      token = JSON.parse(localStorage.getItem('QM.session')).token;
      QBApiCalls.init(token);

    } else {
      QBApiCalls.init();
    }
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

// Application initialization
$(document).ready(function() {
  APP.init();
});

// FB SDK initialization
window.fbAsyncInit = function() {
  var UserView = require('./user/UserView');

  FB.init({
    appId: QMCONFIG.fbAccount.appId,
    version: 'v2.0'
  });
  if (QMCONFIG.debug) console.log('FB init', FB);

  // If you called the getFBStatus function before FB.init
  // Continue it again
  if (sessionStorage.getItem('QM.is_getFBStatus')) {
    sessionStorage.removeItem('QM.is_getFBStatus');
    UserView.getFBStatus();
  }
};
