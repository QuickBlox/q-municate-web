/*
 *
 * Q-MUNICATE settings views Module
 *
 */
define(['jquery'], function($) {
    'use strict';

    var Settings,
        User;

    function SettingsView(app) {
        this.app = app;
        Settings = this.app.models.Settings;
        User = this.app.models.User;
    }

    SettingsView.prototype = {

        // set users settings from localStorage or create default (default - all is ON)
        setUp: function() {
            Settings.init();

            var storageSettings = JSON.parse(localStorage['QM.settings-' + User.id]);
            // set checkbox position
            for (var key in storageSettings) {
                $('#' + key)[0].checked = storageSettings[key];
            }
        },

        // update user's settings
        update: function(newStatus) {
            Settings.set(newStatus);
            Settings.save();
        },

    };

    return SettingsView;
});
