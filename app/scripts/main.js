
/*global require*/
'use strict';

requirejs.config({
    googlemaps: {
        params: {
            key: 'AIzaSyAhduIkJbVdtRm0Hz6XpkihGt8h_R8cZds',
            libraries: 'geometry'
        }
    },
    baseUrl: 'scripts',
    shim: {
        gmaps: {
            deps: ['googlemaps'],
            exports: "GMaps"
        },
        cryptojs: {
            exports: 'CryptoJS'
        },
        progressbar: {
            exports: 'ProgressBar'
        },
        minEmoji: {
            exports: 'minEmoji'
        }
    },
    paths: {
        // libs
        googlemaps: '../bower_components/googlemaps-amd/src/googlemaps',
        async: '../bower_components/requirejs-plugins/src/async',
        gmaps: 'https://cdnjs.cloudflare.com/ajax/libs/gmaps.js/0.4.24/gmaps.min',
        cryptojs: '../bower_components/crypto-js-lib/rollups/aes',
        jquery: '../bower_components/jquery/dist/jquery',
        underscore: '../bower_components/underscore/underscore',
        backbone: '../bower_components/backbone/backbone',
        quickblox: 'https://cdnjs.cloudflare.com/ajax/libs/quickblox/2.5.1/quickblox.min',
        progressbar: '../bower_components/progressbar.js/lib/control/progressbar',
        loadImage: '../bower_components/blueimp-load-image/js/load-image',
        mCustomScrollbar: '../bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar',
        mousewheel: '../bower_components/jquery-mousewheel/jquery.mousewheel',
        timeago: '../bower_components/jquery-timeago/jquery.timeago',
        minEmoji: '../vendor/emoji/js/minEmoji',
        initTelInput: '../vendor/intl-tel-input/js/intlTelInput.min',
        intlTelInputUtils: '../vendor/intl-tel-input/js/utils',
        nicescroll: '../bower_components/jquery.nicescroll/jquery.nicescroll.min',
        perfectscrollbar: '../bower_components/perfect-scrollbar/js/perfect-scrollbar.min',
        QBNotification: '../bower_components/web-notifications/qbNotification',
        lamejs: '../bower_components/lamejs/lame.min',
        QBMediaRecorder: '../bower_components/media-recorder-js/mediaRecorder',
        firebase: '../bower_components/firebase/firebase',

        // Q-municate application
        config: '../configs/main_config',
        MainModule: 'app',
        // models
        UserModule: 'models/user',
        SessionModule: 'models/session',
        SettingsModule: 'models/settings',
        ContactModule: 'models/contact',
        DialogModule: 'models/dialog',
        MessageModule: 'models/message',
        AttachModule: 'models/attach',
        ContactListModule: 'models/contact_list',
        VideoChatModule: 'models/videochat',
        CursorModule: 'models/custom_cursor',
        SyncTabsModule: 'models/sync_tabs',
        VoiceMessage: 'models/voicemessage',
        FirebaseWidget: 'models/firebase_widget',
        // views
        UserView: 'views/user',
        SettingsView: 'views/settings',
        DialogView: 'views/dialog',
        MessageView: 'views/message',
        AttachView: 'views/attach',
        ContactListView: 'views/contact_list',
        VideoChatView: 'views/videochat',
        LocationView: 'views/location',
        // apiCalls
        QBApiCalls: 'qbApiCalls',
        // events
        Events: 'events',
        // helpers
        Helpers: 'helpers',
        // custom listeners
        Listeners: 'listeners',
        // templates
        QMHtml: 'qmhtml',
        // entities
        Entities: 'entities',
        // QM Player
        QMPlayer: 'views/qmplayer'
    }
});

requirejs([
    'jquery',
    'config',
    'minEmoji',
    'MainModule',
    'backbone',
    'QBNotification',
    'firebase'
], function(
    $,
    QMCONFIG,
    minEmoji,
    QM,
    Backbone,
    QBNotification,
    firebase
) {
    var APP;

    // Application initialization
    $(function() {
        // set Q-MUNICATE version
        $('.j-appVersion').html('v. 1.13.0');

        $.ajaxSetup({cache: true});

        // initialize facebook sdk
        if (window.hasOwnProperty('FB')) {
            FB.init({
                appId: QMCONFIG.fbAccount.appId,
                version: 'v2.9'
            });
        }

        // emoji smiles run
        $('.smiles-group').each(function() {
            var obj = $(this);
            obj.html(minEmoji(obj.text(), true));
        });

        if (QMCONFIG.notification && QBNotification.isSupported()) {
            QBNotification.requestPermission();
        }

        APP = new QM();
        APP.init();
    });

});
