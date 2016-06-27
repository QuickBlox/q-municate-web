/*
 *
 * Q-MUNICATE settings models Module
 *
 */
define([], function() {
    'use strict';

    function Settings(app) {
        this.app = app;

        var options,
            self = this;

        this.init = function() {
            options = {
                'messages_notify': true,
                'calls_notify':    true,
                'sounds_notify':   true
            };

            sync();
        };

        this.set = function(params) {
            for (var key in params) {
                options[key] = params[key];
            }
        };

        this.get = function(prop) {
            return options[prop];
        };

        this.save = function() {
            var user = self.app.models.User.contact.id;

            localStorage.setItem('QM.settings-' + user, JSON.stringify(options));
        };

        function sync() {
            var user = self.app.models.User.contact.id;

            if (!localStorage['QM.settings-' + user]) {
                self.save();

                return false;
            } else {
                options = JSON.parse(localStorage['QM.settings-' + user]);
            }
        }
    }

    return Settings;
});
