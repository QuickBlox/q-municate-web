
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
        facebook: {
            exports: 'FB'
        },
        gmaps: {
            deps: ['googlemaps'],
            exports: "GMaps"
        },
        handlebars: {
            exports: 'Handlebars'
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
        facebook: 'https://connect.facebook.net/en_US/sdk',
        googlemaps: '../bower_components/googlemaps-amd/src/googlemaps',
        async: '../bower_components/requirejs-plugins/src/async',
        gmaps: 'https://cdnjs.cloudflare.com/ajax/libs/gmaps.js/0.4.24/gmaps.min',
        digits: 'https://cdn.digits.com/1/sdk',
        cryptojs: '../bower_components/crypto-js-lib/rollups/aes',
        videojs: 'https://vjs.zencdn.net/5.11.6/video',
        jquery: '../bower_components/jquery/dist/jquery',
        underscore: '../bower_components/underscore/underscore',
        backbone: '../bower_components/backbone/backbone',
        handlebars: '../bower_components/handlebars/handlebars',
        quickblox: 'https://cdnjs.cloudflare.com/ajax/libs/quickblox/2.5.0/quickblox.min',
        progressbar: '../bower_components/progressbar.js/lib/control/progressbar',
        loadImage: '../bower_components/blueimp-load-image/js/load-image',
        canvasToBlob: '../bower_components/blueimp-canvas-to-blob/js/canvas-to-blob',
        mCustomScrollbar: '../bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar',
        mousewheel: '../bower_components/jquery-mousewheel/jquery.mousewheel',
        timeago: '../bower_components/jquery-timeago/jquery.timeago',
        minEmoji: '../vendor/emoji/js/minEmoji',
        nicescroll: '../bower_components/jquery.nicescroll/jquery.nicescroll.min',
        perfectscrollbar: '../bower_components/perfect-scrollbar/js/perfect-scrollbar.min',
        QBNotification: '../bower_components/web-notifications/qbNotification',

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
        Entities: 'entities'
    }
});

requirejs([
    'jquery',
    'facebook',
    'config',
    'minEmoji',
    'MainModule',
    'backbone',
    'QBNotification',
    'Helpers',
    'digits'
], function(
    $,
    FB,
    QMCONFIG,
    minEmoji,
    QM,
    Backbone,
    QBNotification,
    Helpers,
    Digits
) {
    var APP;

    // Application initialization
    $(function() {
        // set Q-MUNICATE version
        $('.j-appVersion').html('v. 1.10.0');

        // facebook sdk
        FB.init({
            appId: QMCONFIG.fbAccount.appId,
            version: 'v2.7'
        });

        // twitter digits sdk
        Digits.init({
                consumerKey: 'KCcPaHrIgJ44gs3kwJuIbLaad'
            })
            .done(function() {
                Helpers.log('Digits initialized.');
            }).fail(function(error) {
                Helpers.log('Digits failed to initialize: ', error);
            });

        $.ajaxSetup({
            cache: true
        });

        /* Materialize sdk
         *
         * Not included in requirejs dependencies as required hammer.js,
         * which often creates problems when loading
         */
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.6/js/materialize.min.js', function() {
            Helpers.log('Materialize connected');
        });

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

        $.getScript('https://cdn.flurry.com/js/flurry.js', function() {
            FlurryAgent.startSession('P8NWM9PBFCK2CWC8KZ59');
        });
    });

});
