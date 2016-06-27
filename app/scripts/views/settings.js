/*
 *
 * Q-MUNICATE settings views Module
 *
 */
define(['jquery'], function($) {
    'use strict';

    var Settings;

    function SettingsView(app) {
        this.app = app;
        Settings = this.app.models.Settings;
    }

    SettingsView.prototype = {

        // set users settings from localStorage or create default (default - all is ON)
        setUp: function(userId) {
            Settings.init(userId);

            var storageSettings = JSON.parse(localStorage['QM.settings-' + userId]);
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
