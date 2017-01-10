'use strict';

define([
    'jquery',
    'config',
    'quickblox',
    'Helpers',
    'perfectscrollbar'
], function(
    $,
    QMCONFIG,
    QB,
    Helpers,
    Ps
) {
    var self;

    function Listeners(app) {
        self = this;
        this.app = app;

        var chatConnection = navigator.onLine;
        var active = false;

        this.setChatState = function(state) {
            if (typeof state === 'boolean') {
                chatConnection = state;
            } else {
                chatConnection = navigator.onLine;
            }
        };

        this.getChatState = function() {
            return chatConnection;
        };
    }

    Listeners.prototype = {

        init: function() {
            window.addEventListener('online', self._onNetworkStatusListener);
            window.addEventListener('offline', self._onNetworkStatusListener);
        },

        setQBHandlers: function() {
            var ContactListView = self.app.views.ContactList,
                MessageView     = self.app.views.Message,
                VideoChatView   = self.app.views.VideoChat;

            QB.chat.onMessageListener          = MessageView.onMessage;
            QB.chat.onMessageTypingListener    = MessageView.onMessageTyping;
            QB.chat.onSystemMessageListener    = MessageView.onSystemMessage;
            QB.chat.onDeliveredStatusListener  = MessageView.onDeliveredStatus;
            QB.chat.onReadStatusListener       = MessageView.onReadStatus;

            QB.chat.onContactListListener      = ContactListView.onPresence;
            QB.chat.onSubscribeListener        = ContactListView.onSubscribe;
            QB.chat.onConfirmSubscribeListener = ContactListView.onConfirm;
            QB.chat.onRejectSubscribeListener  = ContactListView.onReject;

            QB.chat.onDisconnectedListener     = self.onDisconnected;
            QB.chat.onReconnectListener        = self.onReconnected;
            QB.chat.onReconnectFailedListener  = self.onReconnectFailed;

            if (QB.webrtc) {
                QB.webrtc.onCallListener          = VideoChatView.onCall;
                QB.webrtc.onAcceptCallListener    = VideoChatView.onAccept;
                QB.webrtc.onRejectCallListener    = VideoChatView.onReject;
                QB.webrtc.onInvalidEventsListener = VideoChatView.onIgnored;
                QB.webrtc.onStopCallListener      = VideoChatView.onStop;
                QB.webrtc.onUpdateCallListener    = VideoChatView.onUpdateCall;
                QB.webrtc.onRemoteStreamListener  = VideoChatView.onRemoteStream;
                QB.webrtc.onCallStatsReport       = VideoChatView.onCallStatsReport;
                QB.webrtc.onSessionCloseListener  = VideoChatView.onSessionCloseListener;
                QB.webrtc.onUserNotAnswerListener = VideoChatView.onUserNotAnswerListener;
            }
        },

        listenToPsTotalEnd: function(onOrOff) {
            var scroll = document.querySelector('.j-scrollbar_aside');

            if (onOrOff) {
                scroll.addEventListener('ps-y-reach-end', self._onNextDilogsList);
            } else {
                scroll.removeEventListener('ps-y-reach-end', self._onNextDilogsList);
            }
        },

        onDisconnected: function() {
            _switchToOfflineMode();
            self.setChatState(false);
        },

        onReconnected: function() {
            _switchToOnlineMode();
            self.setChatState(true);
        },

        onReconnectFailed: function(error) {
            if (error) {
                self.app.service.reconnectChat();
                self.setChatState(false);
            }
        },

        _onNetworkStatusListener: function() {
            var condition = navigator.onLine ? 'online' : 'offline';

            if (typeof self.onNetworkStatus === 'function' && condition) {
                self.onNetworkStatus(condition);
            }
        },

        _onNextDilogsList: function() {
            if (self.activePsListener) {
                self.listenToPsTotalEnd(false);

                self.app.views.Dialog.showOldHistory(function(stopListener) {
                    self._onUpdatePerfectScroll();

                    if (!stopListener) {
                        self.listenToPsTotalEnd(true);
                    }
                });
            } else {
                self.activePsListener = true;
            }
        },

        _onUpdatePerfectScroll: function() {
            Ps.update(document.querySelector('.j-scrollbar_aside'));
        },

        onNetworkStatus: function(status) {
            if (self.getChatState()) {            
                if (status === 'online') {
                    _switchToOnlineMode();
                } else {
                    _switchToOfflineMode();
                }
            }
        }
    };

    return Listeners;

    //
    // Private functions
    //
    function _switchToOfflineMode() {
        if ('div.popups.is-overlay') {
            $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
        }

        $('.j-disconnect').addClass('is-overlay')
            .parent('.j-overlay').addClass('is-overlay');
    }

    function _switchToOnlineMode() {
        $('.j-disconnect').removeClass('is-overlay')
            .parent('.j-overlay').removeClass('is-overlay');
    }
});
