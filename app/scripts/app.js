/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

define([
    'jquery', 'UserModule', 'SessionModule', 'ContactModule',
    'DialogModule', 'MessageModule', 'AttachModule',
    'ContactListModule', 'UserView', 'DialogView',
    'MessageView', 'AttachView', 'ContactListView',
    'Routes', 'QBApiCalls', 'config', 'chromaHash'
  ], function(
    $, User, Session, Contact, Dialog,
    Message, Attach, ContactList, UserView,
    DialogView, MessageView, AttachView,
    ContactListView, Routes, QBApiCalls, QMCONFIG
  ) {

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
          JSON.parse(localStorage['QM.user']).user_jid &&
          // is requirejs format of app modules
          localStorage['QM.isRequireJsUsed']) {
        
        token = JSON.parse(localStorage['QM.session']).token;
        this.service.init(token);

      } else if (localStorage['QM.isRequireJsUsed']) {
        this.service.init();
      } else {
        // removing the old cached data from LocalStorage
        localStorage.clear();
        localStorage.setItem('QM.isRequireJsUsed', '1');
        this.service.init();
      }

      this.routes.init();

      if (QMCONFIG.debug) console.log('App init', this);
    },

    chromaHash: function() {
      $('input:password').chromaHash({bars: 4});
    },

    setHtml5Patterns: function() {
      $('.pattern-name').attr('pattern', QMCONFIG.patterns.name);
      $('.pattern-pass').attr('pattern', QMCONFIG.patterns.password);
    }
  };

  return QM;
});
