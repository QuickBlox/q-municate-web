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
    },
    chromaHash: ['jquery']
  },
  paths: {
    // libs
    googlemaps: '../bower_components/googlemaps-amd/src/googlemaps',
    async: '../bower_components/requirejs-plugins/src/async',
    gmaps: 'https://rawgit.com/HPNeo/gmaps/master/gmaps',
    cryptojs: '../bower_components/crypto-js-lib/rollups/aes',
    videojs: '//vjs.zencdn.net/4.6/video',
    jquery: '../bower_components/jquery/dist/jquery',
    underscore: '../bower_components/underscore/underscore',
    // lodash: '../bower_components/lodash/dist/lodash',
    backbone: '../bower_components/backbone/backbone',
    handlebars: '../bower_components/handlebars/handlebars',
    // quickblox: '../bower_components/quickblox/quickblox.min',
    quickblox: 'https://rawgit.com/QuickBlox/quickblox-javascript-sdk/develop/quickblox.min',
    progressbar: '../bower_components/progressbar.js/lib/control/progressbar',
    loadImage: '../bower_components/blueimp-load-image/js/load-image',
    canvasToBlob: '../bower_components/blueimp-canvas-to-blob/js/canvas-to-blob',
    mCustomScrollbar: '../bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar',
    nicescroll: '../bower_components/jquery.nicescroll/jquery.nicescroll.min',
    mousewheel: '../bower_components/jquery-mousewheel/jquery.mousewheel',
    timeago: '../bower_components/jquery-timeago/jquery.timeago',
    minEmoji: '../vendor/emoji/js/minEmoji',
    chromaHash: '../bower_components/Chroma-Hash/jquery.chroma-hash',
    QBNotification: '../bower_components/web-notifications/qbNotification',

    // Q-municate application
    config: '../configs/main_config',
    MainModule: 'app',
    // models
    UserModule: 'models/user',
    SessionModule: 'models/session',
    ContactModule: 'models/contact',
    DialogModule: 'models/dialog',
    MessageModule: 'models/message',
    AttachModule: 'models/attach',
    ContactListModule: 'models/contact_list',
    VideoChatModule: 'models/videochat',
    // views
    UserView: 'views/user',
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
    // templates
    QMHtml: 'qmhtml'
  }
});

requirejs([
  'jquery', 'config',
  'minEmoji', 'MainModule',
  'backbone', 'QBNotification',
  'Helpers'
], function ($, QMCONFIG, minEmoji, QM, Backbone, QBNotification, Helpers) {
  var APP;

  // Application initialization
  $(document).ready(function() {
    $.ajaxSetup({ cache: true });
    $.getScript('https://connect.facebook.net/en_US/sdk.js', function() {
      FB.init({
        appId: QMCONFIG.fbAccount.appId,
        version: 'v2.1'
      });
      Helpers.log('FB init', FB);

      // emoji smiles run
      $('.smiles-group').each(function() {
        var obj = $(this);
        obj.html(minEmoji(obj.text()));
      });

      if (QMCONFIG.notification && QBNotification.isSupported()) {
        QBNotification.requestPermission();
      }

      APP = new QM();
      APP.init();
    });

    $.getScript('https://cdn.flurry.com/js/flurry.js', function() {
      FlurryAgent.startSession('P8NWM9PBFCK2CWC8KZ59');
    });
  });

});
