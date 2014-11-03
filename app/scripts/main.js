/*global require*/
'use strict';

require.config({
    shim: {
        handlebars: {
            exports: 'Handlebars'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/dist/jquery.min',
        underscore: '../bower_components/lodash/dist/lodash.min',
        backbone: '../bower_components/backbone/backbone',        
        handlebars: '../bower_components/handlebars/handlebars.amd.min'
    }
});

require([
    'backbone'
], function (Backbone) {
    Backbone.history.start();
});
