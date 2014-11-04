/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

var APP;

// includes
var User = require('./models/user'),
    Session = require('./models/session'),
    Contact = require('./models/contact'),
    Dialog = require('./models/dialog'),
    Message = require('./models/message'),
    Attach = require('./models/attach'),
    ContactList = require('./models/contact_list'),
    UserView = require('./views/user'),
    DialogView = require('./views/dialog'),
    MessageView = require('./views/message'),
    AttachView = require('./views/attach'),
    ContactListView = require('./views/contact_list'),
    Routes = require('./routes'),
    QBApiCalls = require('./qbApiCalls');

function QM() {
  this.models = {
    User: new User(this),
    Session: new Session(this),
    Contact: new Contact(this),
    Dialog: new Dialog(this),
    Message: new Message(this),
    Attach: new Attach(this),
    ContactList: new ContactList(this)
  };

  this.views = {
    User: new UserView(this),
    Dialog: new DialogView(this),
    Message: new MessageView(this),
    Attach: new AttachView(this),
    ContactList: new ContactListView(this)
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
        // new format of storage data (20.07.2014)
        JSON.parse(localStorage['QM.user']).user_jid) {
      
      token = JSON.parse(localStorage['QM.session']).token;
      this.service.init(token);

    } else {
      this.service.init();
    }

    this.routes.init();

    if (QMCONFIG.debug) console.log('App init', this);
  },

  chromaHash: function() {
    // new ChromaHash({
    //   visualization: 'bars'
    // });
    $('input:password').chromaHash({bars: 4});
  },

  setHtml5Patterns: function() {
    $('.pattern-name').attr('pattern', QMCONFIG.patterns.name);
    $('.pattern-pass').attr('pattern', QMCONFIG.patterns.password);
  }
};

// Application initialization
$(document).ready(function() {
  $.ajaxSetup({ cache: true });
  $.getScript('https://connect.facebook.net/en_US/sdk.js', function() {
    FB.init({
      appId: QMCONFIG.fbAccount.appId,
      version: 'v2.0'
    });
    if (QMCONFIG.debug) console.log('FB init', FB);

    // emoji smiles run
    $('.smiles-group').each(function() {
      var obj = $(this);
      obj.html(minEmoji(obj.text()));
    });

    APP = new QM;
    APP.init();
  });
});

// Leave a chat after closing window
// window.onbeforeunload = function() {
//   QB.chat.sendPres('unavailable');
// };

window.offLineHandler = function() {
  $('.no-connection').removeClass('is-hidden');
};

window.onLineHandler = function() {
  $('.no-connection').addClass('is-hidden');
};
