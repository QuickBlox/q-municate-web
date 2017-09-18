/*
 * Q-municate chat application
 *
 * Main Module
 *
 */
define([
    'jquery', 'UserModule',
    'SessionModule', 'SettingsModule',
    'ContactModule', 'DialogModule',
    'MessageModule', 'AttachModule',
    'ContactListModule', 'VideoChatModule',
    'CursorModule', 'SyncTabsModule',
    'UserView', 'SettingsView',
    'DialogView', 'MessageView',
    'AttachView', 'ContactListView',
    'VideoChatView', 'Events',
    'Helpers', 'QBApiCalls',
    'config', 'Entities',
    'QMHtml', 'Listeners',
    'VoiceMessage', 'QMPlayer',
    'FirebaseWidget'
], function(
    $, User,
    Session, Settings,
    Contact, Dialog,
    Message, Attach,
    ContactList, VideoChat,
    Cursor, SyncTabs,
    UserView, SettingsView,
    DialogView, MessageView,
    AttachView, ContactListView,
    VideoChatView, Events,
    Helpers, QBApiCalls,
    QMCONFIG, Entities,
    QMHtml, Listeners,
    VoiceMessage, QMPlayer,
    FirebaseWidget
) {

    function QM() {
        this.listeners = new Listeners(this);

        this.models = {
            User        : new User(this),
            Session     : new Session(this),
            Settings    : new Settings(this),
            Contact     : new Contact(this),
            Dialog      : new Dialog(this),
            Message     : new Message(this),
            Attach      : new Attach(this),
            ContactList : new ContactList(this),
            VideoChat   : new VideoChat(this),
            Cursor      : new Cursor(this),
            SyncTabs    : new SyncTabs(this),
            VoiceMessage: new VoiceMessage(this)
        };

        this.views = {
            User        : new UserView(this),
            Settings    : new SettingsView(this),
            Dialog      : new DialogView(this),
            Message     : new MessageView(this),
            Attach      : new AttachView(this),
            ContactList : new ContactListView(this),
            VideoChat   : new VideoChatView(this)
        };

        this.events    = new Events(this);
        this.service   = new QBApiCalls(this);

        this.entities  = Entities;
        this.entities.app = this;

        this.QMPlayer = QMPlayer;
        this.FirebaseWidget = FirebaseWidget;
    }

    QM.prototype = {
        init: function() {
            var token;

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
            this.listeners.init();

            Helpers.log('App init', this);
        },

        preloader: function() {
            var spinner = $('#welcomePage .l-spinner');

            spinner.addClass('is-hidden');
            spinner.prevAll().removeClass('is-hidden');
        },

        setHtml5Patterns: function() {
            $('.pattern-name').attr('pattern', QMCONFIG.patterns.name);
            $('.pattern-pass').attr('pattern', QMCONFIG.patterns.password);
        }
    };

    return QM;
});
