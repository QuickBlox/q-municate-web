/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

define([
    'jquery', 'UserModule', 'SessionModule', 'ContactModule',
    'DialogModule', 'MessageModule', 'AttachModule',
    'ContactListModule', 'VideoChatModule', 'UserView', 'DialogView',
    'MessageView', 'AttachView', 'ContactListView', 'VideoChatView', 
    'Events', 'Helpers', 'QBApiCalls', 'config', 'chromaHash'
  ], function(
    $, User, Session, Contact, Dialog,
    Message, Attach, ContactList, VideoChat, UserView,
    DialogView, MessageView, AttachView, ContactListView,
    VideoChatView, Events, Helpers, QBApiCalls, QMCONFIG
  ) {

  function QM() {
    this.models = {
      User: new User(this),
      Session: new Session(this),
      Contact: new Contact(this),
      Dialog: new Dialog(this),
      Message: new Message(this),
      Attach: new Attach(this),
      ContactList: new ContactList(this),
      VideoChat: new VideoChat(this)
    };

    this.views = {
      User: new UserView(this),
      Dialog: new DialogView(this),
      Message: new MessageView(this),
      Attach: new AttachView(this),
      ContactList: new ContactListView(this),
      VideoChat: new VideoChatView(this)
    };

    this.events = new Events(this);
    this.service = new QBApiCalls(this);
  }

  QM.prototype = {
    init: function() {
      var token;

      this.chromaHash();
      this.setHtml5Patterns();
      this.preloader();

      // QB SDK initialization
      // Checking if autologin was chosen
      if (localStorage['QM.session'] && localStorage['QM.user'] &&
          // new QB release account (13.02.2015)
          localStorage['QM.isReleaseQBAccount']) {
        
        token = JSON.parse(localStorage['QM.session']).token;
        this.service.init(token);

      } else if (localStorage['QM.isReleaseQBAccount']) {
        this.service.init();
      } else {
        // removing the old cached data from LocalStorage
        localStorage.clear();
        localStorage.setItem('QM.isReleaseQBAccount', '1');
        this.service.init();
      }

      this.events.init();

      Helpers.log('App init', this);
    },

    preloader: function() {
      var spinner = $('#welcomePage .l-spinner');

      spinner.addClass('is-hidden');
      spinner.prevAll().removeClass('is-hidden');
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
