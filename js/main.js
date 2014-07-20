/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

// includes
var User = require('./models/user'),
    Session = require('./models/session'),
    Contact = require('./models/contact'),
    FriendList = require('./models/friend_list'),
    UserView = require('./views/user'),
    FriendListView = require('./views/friend_list'),
    Routes = require('./routes'),
    QBApiCalls = require('./qbApiCalls');

function QM() {
  this.models = {
    User: new User(this),
    Session: new Session(this),
    Contact: new Contact(this),
    FriendList: new FriendList(this)
  };

  this.views = {
    User: new UserView(this),
    FriendList: new FriendListView(this)
  };

  this.routes = new Routes(this);
  this.service = new QBApiCalls(this);
}

QM.prototype = {
  init: function() {
    var token;

    this.chromaHash();
    this.setHtml5Patterns();

    // QB SDK initialization
    // Checking if autologin was chosen
    if (localStorage['QM.session'] && localStorage['QM.user'] &&
        // new format of storage data (14.07.2014)
        JSON.parse(localStorage['QM.user']).contact &&
        // new format of storage data (20.07.2014)
        JSON.parse(localStorage['QM.user']).contact.user_jid) {

      token = JSON.parse(localStorage['QM.session']).token;
      this.service.init(token);

    } else {
      this.service.init();
    }

    this.routes.init();

    if (QMCONFIG.debug) console.log('App init', this);
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
  var APP = new QM;
  APP.init();
});

// FB SDK initialization
window.fbAsyncInit = function() {
  var view = APP.views.User;

  FB.init({
    appId: QMCONFIG.fbAccount.appId,
    version: 'v2.0'
  });
  if (QMCONFIG.debug) console.log('FB init', FB);

  // If you called the getFBStatus function before FB.init
  // Continue it again
  if (sessionStorage['QM.is_getFBStatus']) {
    sessionStorage.removeItem('QM.is_getFBStatus');
    view.getFBStatus();
  }
};
