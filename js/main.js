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
    if (localStorage.getItem('QM.session')) {
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
  FB.init({
    appId: QMCONFIG.fbAccount.appId,
    version: 'v2.0'
  });

  if (QMCONFIG.debug) console.log('FB init', FB);

  /* 
   * This case is needed when your user has exited from Facebook
   * and you try to relogin on a project via FB without reload the page
   */
  //checkFBStatus();
};

function checkFBStatus() {
  setTimeout(function() {
    FB.getLoginStatus(function(response) {
      //if (QMCONFIG.debug) console.log('FB status response', response);
    }, true);

    checkFBStatus();
  }, 30 * 1000);
}
