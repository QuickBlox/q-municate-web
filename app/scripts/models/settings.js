/*
 *
 * Q-MUNICATE settings Module
 *
 */
define([
    'jquery',
    'config'
], function($, Backbone, QMCONFIG) {
    'use strict';

    var globalSettings;

    function Settings(app) {
        this.app = app;
        globalSettings = this;
        globalSettings = {
            'messages_notify': true,
            'calls_notify':    true,
            'sounds_notify':   true
        };
    }

    Settings.prototype = {

        setUp: function() {
            if (!localStorage['QM.settings']) {
                localStorage.setItem('QM.settings', JSON.stringify(globalSettings));

                return false;
            }

            var storageSettings = JSON.parse(localStorage['QM.settings']);

            globalSettings.messages_notify = storageSettings.massages_notify;
            globalSettings.calls_notify    = storageSettings.calls_notify;
            globalSettings.sounds_notify   = storageSettings.sounds_notify;

            for (var key in storageSettings) {
                $('#' + key)[0].checked = storageSettings[key];
                console.info(key, $('#' + key)[0].checked);
            }
        },

        update: function(newStatus) {
            globalSettings[newStatus.id] = newStatus.checked;
            localStorage.setItem('QM.settings', JSON.stringify(globalSettings));
        },

    };

    return Settings;
});
