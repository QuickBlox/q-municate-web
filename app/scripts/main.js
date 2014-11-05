/*global require*/
'use strict';

require.config({
  shim: {

  },
  packages: [

  ],
  paths: {
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min',
    cryptojs: '//crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes',
    videojs: '//vjs.zencdn.net/4.6/video',

    underscore: '../bower_components/underscore/underscore',
    // lodash: '../bower_components/lodash/dist/lodash',
    backbone: '../bower_components/backbone/backbone',
    handlebars: '../bower_components/handlebars/handlebars',

    quickblox: '../bower_components/quickblox-javascript-sdk/quickblox',
    
    progressbar: '../bower_components/progressbar.js/lib/control/progressbar',
    loadImage: '../bower_components/blueimp-load-image/js/load-image',
    canvasToBlob: '../bower_components/blueimp-canvas-to-blob/js/canvas-to-blob',
    
    mCustomScrollbar: '../bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar',
    nicescroll: '../bower_components/jquery.nicescroll/jquery.nicescroll',
    
    timeago: '../bower_components/jquery-timeago/jquery.timeago',
    minEmoji: '../vendor/emoji/js/minEmoji',
    chromaHash: '../bower_components/Chroma-Hash/jquery.chroma-hash',
    onlinejs: '../bower_components/OnlineJS/src/online'    
  }
});

require([
  'backbone'
], function (Backbone) {
  Backbone.history.start();
});
