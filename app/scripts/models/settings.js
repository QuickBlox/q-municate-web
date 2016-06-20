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
        
        // default users settings
        globalSettings = {
            'messages_notify': true,
            'calls_notify':    true,
            'sounds_notify':   true
        };
    }

    Settings.prototype = {

        // set users settings from localStorage or create default (default - all is ON)
        setUp: function() {
            // sets default settings if they are not there in the localStorage
            if (!localStorage['QM.settings']) {
                localStorage.setItem('QM.settings', JSON.stringify(globalSettings));

                return false;
            }

            var storageSettings = JSON.parse(localStorage['QM.settings']);

            // copy settings from the localStorage['QM.settings']
            globalSettings.messages_notify = storageSettings.massages_notify;
            globalSettings.calls_notify    = storageSettings.calls_notify;
            globalSettings.sounds_notify   = storageSettings.sounds_notify;

            // set checkbox position
            for (var key in storageSettings) {
                $('#' + key)[0].checked = storageSettings[key];
            }
        },

        // update users settings
        update: function(newStatus) {
            globalSettings[newStatus.id] = newStatus.checked;
            localStorage.setItem('QM.settings', JSON.stringify(globalSettings));
        },

    };

    return Settings;
});
