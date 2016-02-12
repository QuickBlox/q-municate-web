/*global require*/
'use strict';

requirejs.config({
  baseUrl: 'scripts',
  shim: {
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
    cryptojs: 'https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes',
    videojs: '//vjs.zencdn.net/4.6/video',
    jquery: '../bower_components/jquery/dist/jquery',
    underscore: '../bower_components/underscore/underscore',
    // lodash: '../bower_components/lodash/dist/lodash',
    backbone: '../bower_components/backbone/backbone',
    handlebars: '../bower_components/handlebars/handlebars',
    quickblox: '../bower_components/quickblox/quickblox.min',
    progressbar: '../bower_components/progressbar.js/lib/control/progressbar',
    loadImage: '../bower_components/blueimp-load-image/js/load-image',
    canvasToBlob: '../bower_components/blueimp-canvas-to-blob/js/canvas-to-blob',
    mCustomScrollbar: '../bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar',
    nicescroll: '../bower_components/jquery.nicescroll/jquery.nicescroll',
    mousewheel: '../bower_components/jquery-mousewheel/jquery.mousewheel',
    timeago: '../bower_components/jquery-timeago/jquery.timeago',
    minEmoji: '../vendor/emoji/js/minEmoji',
    chromaHash: '../bower_components/Chroma-Hash/jquery.chroma-hash',

    // Q-municate application
    config: '../config',
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
    // events
    Events: 'events',
    QBApiCalls: 'qbApiCalls'
  }
});

requirejs([
  'jquery', 'config',
  'minEmoji', 'MainModule',
  'backbone',
], function ($, QMCONFIG, minEmoji, QM, Backbone) {
  var APP;

  // Application initialization
  $(document).ready(function() {
    $.ajaxSetup({ cache: true });
    $.getScript('https://connect.facebook.net/en_US/sdk.js', function() {
      FB.init({
        appId: QMCONFIG.fbAccount.appId,
        version: 'v2.1'
      });
      if (QMCONFIG.debug) console.log('FB init', FB);

      // emoji smiles run
      $('.smiles-group').each(function() {
        var obj = $(this);
        obj.html(minEmoji(obj.text()));
      });

      APP = new QM();
      APP.init();
    });
  });

});
