/*
 *
 * Q-MUNICATE settings models Module
 *
 */
define([], function() {
    'use strict';

    var options = {};

    function Settings(app) {
        this.app = app;
    }

    Settings.prototype = {

        init: function() {
            options = {
                'messages_notify': true,
                'calls_notify':    true,
                'sounds_notify':   true
            };

            this.sync();
        },

        set: function(params) {
            for (var key in params) {
                options[key] = params[key];
            }
        },

        get: function(option) {
            return options[option];
        },

        save: function() {
            localStorage.setItem('QM.settings', JSON.stringify(options));
        },

        sync: function() {
            if (!localStorage['QM.settings']) {
                this.save();

                return false;
            } else {
                options = JSON.parse(localStorage['QM.settings']);
            }
        }

    };

    return Settings;
});
