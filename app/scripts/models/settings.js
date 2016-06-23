/*
 *
 * Q-MUNICATE settings models Module
 *
 */
define([], function() {
    'use strict';

    function Settings(app) {
        var options;

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
            localStorage.setItem('QM.settings', JSON.stringify(options));
        };

        function sync() {
            if (!localStorage['QM.settings']) {
                this.save();

                return false;
            } else {
                options = JSON.parse(localStorage['QM.settings']);
            }
        }
    }

    return Settings;
});
