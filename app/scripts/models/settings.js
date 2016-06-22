/*
 *
 * Q-MUNICATE settings models Module
 *
 */
define([], function() {
    'use strict';

    var self;

    function Settings(app) {
        this.app = app;
        self = this;
    }

    Settings.prototype = {

        init: function() {
            self.settingsParams = {
                'messages_notify': true,
                'calls_notify': true,
                'sounds_notify': true
            };

            self.sync();
        },

        set: function(params) {
            for (var key in params) {
                self.settingsParams[key] = params[key];
            }
        },

        save: function() {
            localStorage.setItem('QM.settings', JSON.stringify(self.settingsParams));
        },

        get: function() {
            return JSON.parse(localStorage['QM.settings']);
        },

        sync: function() {
            if (!localStorage['QM.settings']) {
                self.save();

                return false;
            } else {
                self.settingsParams = self.get();
            }
        }

    };

    return Settings;
});
