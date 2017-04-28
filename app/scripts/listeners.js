'use strict';

define([
    'underscore',
    'jquery',
    'config',
    'quickblox',
    'Helpers',
    'perfectscrollbar'
], function(
    _,
    $,
    QMCONFIG,
    QB,
    Helpers,
    Ps
) {
    var self;

    function Listeners(app) {
        self = this;
        self.app = app;
        self.blockChatViewPosition = false;
        self.stateActive = null;
        self.disconnected = false;
        self.offline = false;

        var chatConnection = navigator.onLine;
        var position = 0;

        self.setChatState = function(state) {
            if (typeof state === 'boolean') {
                chatConnection = state;
            } else {
                chatConnection = navigator.onLine;
                self.offline = false;
            }
        };

        self.getChatState = function() {
            return chatConnection;
        };

        self.setChatViewPosition = function(value) {
            if (!self.blockChatViewPosition) {
                position = value;
            }

            self.blockChatViewPosition = false;
        };

        self.getChatViewPosition = function() {
            var direction = '',
                value = 0;

            if (position < 0) {
                direction = '-=';
                value -= position;
            } else {
                direction = '+=';
                value += position;
            }

            return (direction + value);
        };
    }

    Listeners.prototype = {

        init: function() {
            window.addEventListener('online', self._onNetworkStatusListener);
            window.addEventListener('offline', self._onNetworkStatusListener);

            document.addEventListener('webkitfullscreenchange', self.onFullScreenChange);
            document.addEventListener('mozfullscreenchange', self.onFullScreenChange);
            document.addEventListener('fullscreenchange', self.onFullScreenChange);
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

        listenToMediaElement: function(selector) {
            document.querySelector(selector).onplaying = function(event) {
                // pause all media sources except started one
                document.querySelectorAll('.j-audioPlayer, .j-videoPlayer').forEach(function(element) {
                    if (element !== event.target) {
                        element.pause();
                        element.currentTime = 0;
                    }
                });
            };
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
            if (self.stateActive) {
                self.updateDialogs(false);
                self.setChatState(false);
                _switchToOfflineMode();
            }
        },

        onReconnected: function() {
            self.updateDialogs(true);
            self.setChatState(true);
            _switchToOnlineMode();
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

        updateDialogs: function(reconnected) {
            var DialogView = self.app.views.Dialog,
                dialogsCollection = self.app.entities.Collections.dialogs;

            if (reconnected) {
                DialogView.downloadDialogs();
            } else {
                dialogsCollection.forEach(function(dialog) {
                    if (dialog.get('type') === 2) {
                        dialog.set({
                            'joined': false,
                            'opened': false
                        });
                    }
                });
            }
        },

        onNetworkStatus: function(status) {
            if (self.getChatState()) {
                if (status === 'online') {
                    self.updateDialogs(true);
                    _switchToOnlineMode();
                } else {
                    _switchToOfflineMode();
                }
            }
        },

        onFullScreenChange: function(event) {
            var fullscreenElement = document.fullscreenElement ||
                                    document.mozFullscreenElement ||
                                    document.webkitFullscreenElement,
                fullscreenEnabled = document.fullscreenEnabled ||
                                    document.mozFullscreenEnabled ||
                                    document.webkitFullscreenEnabled,
                isVideoElementTag = event.target.tagName === 'VIDEO';

            if (fullscreenEnabled && isVideoElementTag) {
                var $scroll = $('.j-chatItem:visible').find('.j-scrollbar_message');

                if (fullscreenElement) {
                    self.blockChatViewPosition = true;
                } else {
                    $scroll.mCustomScrollbar('scrollTo', self.getChatViewPosition());
                }
            }
        }
    };

    return Listeners;

    //
    // Private functions
    //
    function _switchToOfflineMode() {
        if (!self.disconnected) {
            document.querySelector('.j-overlay').classList.add('is-disconnect');
            document.querySelector('.j-overlay').disabled = true;
            document.querySelector('.j-disconnect').classList.add('disconnected');
            self.disconnected = true;
        }
    }

    function _switchToOnlineMode() {
        if (self.disconnected) {
            document.querySelector('.j-overlay').classList.remove('is-disconnect');
            document.querySelector('.j-overlay').disabled = false;
            document.querySelector('.j-disconnect').classList.remove('disconnected');
            self.disconnected = false;
        }
    }
});
