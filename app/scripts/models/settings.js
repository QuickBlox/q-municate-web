/*
 *
 * Q-MUNICATE settings models Module
 *
 */
define([], function() {
    'use strict';

    function Settings(app) {
        var userId,
            options,
            self = this;

        this.init = function(currentUserId) {
            userId = currentUserId;
            options = {
                'messages_notify': true,
                'calls_notify': true,
                'sounds_notify': true
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
            localStorage.setItem('QM.settings-' + userId, JSON.stringify(options));
        };

        function sync() {
            if (!localStorage['QM.settings-' + userId]) {
                self.save();

                return false;
            } else {
                options = JSON.parse(localStorage['QM.settings-' + userId]);
            }
        }
    }

    return Settings;
});
