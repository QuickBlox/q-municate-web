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

    var qmSettings;

    function Settings(app) {
        this.app = app;
        qmSettings = this;

        qmSettings = {
            'messages_notify': false,
            'calls_notify':    false,
            'sounds_notify':   false
        };
    }

    Settings.prototype = {

        setUp: function() {
            if (!localStorage['QM.settings']) {
                localStorage.setItem('QM.settings', JSON.stringify(qmSettings));

                return false;
            }

            var storageObj = JSON.parse(localStorage['QM.settings']);

            // qmSettings = {
            //     'messages_notify': storageObj.massages_notify || true,
            //     'calls_notify':    storageObj.calls_notify    || true,
            //     'sounds_notify':   storageObj.sounds_notify   || true
            // };

            // qmSettings.messages_notify = storageObj.massages_notify || true;
            // qmSettings.calls_notify    = storageObj.calls_notify    || false;
            // qmSettings.sounds_notify   = storageObj.sounds_notify   || true;

            for (var key in storageObj) {
                console.info(key, $('#' + key)[0].checked);
                $('#' + key)[0].checked = storageObj[key];
            }
        },

        update: function(newStatus) {
            qmSettings[newStatus.id] = newStatus.checked;

console.info(newStatus.id, newStatus.checked);
console.info(qmSettings);
// localStorage.setItem('QM.settings', JSON.stringify(qmSettings));
        },

    };

    return Settings;
});
