/**
 * Helper Module
 */

define([
    'jquery',
    'backbone',
    'config'
], function($, Backbone, QMCONFIG) {
    'use strict';

    var Settings = Backbone.Model.extend({
        defaults: {
            massages_notify: true,
            calls_notify: true,
            sounds: null
        },

        init: {

        }

    });

    return Settings;
});
