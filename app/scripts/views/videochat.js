/*
 * Q-municate chat application
 *
 * VideoChat View Module
 *
 */
define([
    'jquery',
    'quickblox',
    'Entities',
    'config',
    'Helpers',
    'QBNotification',
    'QMHtml'
], function(
    $,
    QB,
    Entities,
    QMCONFIG,
    Helpers,
    QBNotification,
    QMHtml
) {
    var self,
        User,
        Settings,
        VideoChat,
        VoiceMessage,
        ContactList,
        SyncTabs,
        callTimer,
        stopStreamFF,
        sendAutoReject,
        videoStreamTime,
        network = {},
        curSession = {},
        is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    function VideoChatView(app) {
        this.app = app;
        self = this;
        Settings = this.app.models.Settings;
        SyncTabs = this.app.models.SyncTabs;
        User = this.app.models.User;
        ContactList = this.app.models.ContactList;
        VideoChat = this.app.models.VideoChat;
        VoiceMessage = this.app.models.VoiceMessage;
    }

    VideoChatView.prototype.cancelCurrentCalls = function() {
        var $mediacall = $('.mediacall');

        if ($mediacall.length > 0) {
            $mediacall.find('.btn_hangup').click();
        }
    };

    VideoChatView.prototype.clearChat = function() {
        var $chatView = $('.chatView');

        if ($chatView.length > 1) {
            $chatView.first().remove();
        }
    };

    VideoChatView.prototype.init = function() {
        var DialogView = this.app.views.Dialog,
            Dialog = this.app.models.Dialog;

        $('body').on('click', '.videoCall, .audioCall', function() {
            if (QB.webrtc) {
                var $this = $(this),
                    className = $this.attr('class'),
                    userId = $this.data('id'),
                    $dialogItem = $('.j-dialogItem[data-id="' + userId + '"]'),
                    dialogId;

                if ($dialogItem.length) {
                    dialogId = $dialogItem.data('dialog');
                    openChatAndStartCall(dialogId);
                } else {
                    Dialog.restorePrivateDialog(userId, function(dialog) {
                        dialogId = dialog.get('id');
                        openChatAndStartCall(dialogId);
                    });
                }
            } else {
                QMHtml.VideoChat.noWebRTC();
            }

            // remove contextmenus after start call
            $('.is-contextmenu').removeClass('is-contextmenu');
            $('.j-listActionsContacts').remove();

            function openChatAndStartCall(dialogId) {
                DialogView.htmlBuild(dialogId);
                self.cancelCurrentCalls();
                self.startCall(className, dialogId);
                curSession = self.app.models.VideoChat.session;
            }

            return false;
        });

        $('#popupIncoming').on('click', '.btn_decline', function() {
            var $self = $(this),
                $incomingCall = $self.parents('.incoming-call'),
                opponentId = $self.data('id'),
                dialogId = $self.data('dialog'),
                callType = $self.data('calltype'),
                audioSignal = document.getElementById('ringtoneSignal');

            curSession.reject({});

            VideoChat.sendMessage(opponentId, '2', null, dialogId, callType);

            $incomingCall.remove();

            if ($('#popupIncoming .mCSB_container').children().length === 0) {
                closePopup();
                if (Settings.get('sounds_notify')) {
                    audioSignal.pause();
                }
            }

            return false;
        });

        $('#popupIncoming').on('click', '.btn_accept', function() {
            self.cancelCurrentCalls();

            clearTimeout(sendAutoReject);
            sendAutoReject = undefined;

            var $self = $(this),
                id = $self.data('id'),
                $dialogItem = $('.dialog-item[data-id="' + id + '"]');

            DialogView.htmlBuild($dialogItem);

            var dialogId = $self.data('dialog'),
                sessionId = $self.data('session'),
                callType = $self.data('calltype'),
                audioSignal = $('#ringtoneSignal')[0],
                params = self.build(dialogId),
                $chat = $('.l-chat[data-dialog="' + dialogId + '"]');

            $self.parents('.incoming-call').remove();
            $('#popupIncoming .mCSB_container').children().each(function() {
                $self.find('.btn_decline').click();
            });

            closePopup();

            if (Settings.get('sounds_notify')) {
                audioSignal.pause();
            }

            params.isCallee = true;

            VideoChat.getUserMedia(params, callType, function(err, res) {
                if (err) {
                    $chat.find('.mediacall .btn_hangup').data('errorMessage', 1);
                    $chat.find('.mediacall .btn_hangup').click();
                    fixScroll();
                    return true;
                }

                VoiceMessage.resetRecord();
                VoiceMessage.blockRecorder('during a call');

                if (callType === 'audio') {
                    self.type = 'audio';
                    $('.btn_camera_off').click();
                } else {
                    self.type = 'video';
                    self.unmute('video');
                }

                self.sessionID = sessionId;
                addCallTypeIcon(id, callType);
            });

            return false;
        });

        $('body').on('click', '.btn_hangup', function() {
            self.clearChat();

            var $self = $(this),
                $chat = $self.parents('.l-chat'),
                opponentId = $self.data('id'),
                dialogId = $self.data('dialog'),
                callType = curSession.callType === 1 ? 'video' : 'audio',
                duration = $self.parents('.mediacall').find('.mediacall-info-duration').text(),
                callingSignal = $('#callingSignal')[0],
                endCallSignal = $('#endCallSignal')[0],
                isErrorMessage = $self.data('errorMessage');

            if (VideoChat.caller) {
                if (!isErrorMessage && duration !== 'connect...') {
                    VideoChat.sendMessage(opponentId, '1', duration, dialogId, null, null, self.sessionID);
                } else {
                    VideoChat.sendMessage(opponentId, '1', null, dialogId, callType);
                    $self.removeAttr('data-errorMessage');
                }
            }

            if (Settings.get('sounds_notify') && SyncTabs.get()) {
                callingSignal.pause();
                endCallSignal.play();
            }

            clearTimeout(callTimer);

            curSession.stop({});

            self.type = null;
            $chat.find('.mediacall').remove();
            $chat.find('.l-chat-header').show();
            $chat.find('.l-chat-content').css({
                height: 'calc(100% - 140px)'
            });

            addCallTypeIcon(opponentId, null);

            return false;
        });

        $('body').on('click', '.btn_camera_off, .btn_mic_off', switchOffDevice);

        // full-screen-mode
        $('body').on('click', '.btn_full-mode', function() {
            var mediaScreen = document.getElementsByClassName("mediacall")[0],
                isFullScreen = false;

            if (mediaScreen.requestFullscreen) {
                if (document.fullScreenElement) {
                    document.cancelFullScreen();
                    isFullScreen = false;
                } else {
                    mediaScreen.requestFullscreen();
                    isFullScreen = true;
                }
            } else if (mediaScreen.mozRequestFullScreen) {
                if (document.mozFullScreenElement) {
                    document.mozCancelFullScreen();
                    isFullScreen = false;
                } else {
                    mediaScreen.mozRequestFullScreen();
                    isFullScreen = true;
                }
            } else if (mediaScreen.webkitRequestFullscreen) {
                if (document.webkitFullscreenElement) {
                    document.webkitCancelFullScreen();
                    isFullScreen = false;
                } else {
                    mediaScreen.webkitRequestFullscreen();
                    isFullScreen = true;
                }
            }

            if (isFullScreen) {
                $('#fullModeOn').hide();
                $('#fullModeOff').show();
            } else {
                $('#fullModeOn').show();
                $('#fullModeOff').hide();
            }

            return false;
        });

        $(window).on('resize', function() {
            setScreenStyle();
        });

    };

    VideoChatView.prototype.onCall = function(session, extension) {
        if (User.contact.id === session.initiatorID) {
            return false;
        }

        if ($('div.popups.is-overlay').length) {
            $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
        }

        var audioSignal = document.getElementById('ringtoneSignal'),
            $incomings = $('#popupIncoming'),
            id = session.initiatorID,
            contact = ContactList.contacts[id],
            callType = (session.callType === 1 ? 'video' : 'audio') || extension.call_type,
            userName = contact.full_name || extension.full_name,
            userAvatar = contact.avatar_url || extension.avatar,
            $dialogItem = $('.j-dialogItem[data-id="' + id + '"]'),
            dialogId = $dialogItem.length ? $dialogItem.data('dialog') : null,
            autoReject = QMCONFIG.QBconf.webrtc.answerTimeInterval * 1000,
            htmlTpl,
            tplParams;

        if (!dialogId && ContactList.roster[id]) {
            self.app.models.Dialog.restorePrivateDialog(id, function(dialog) {
                dialogId = dialog.get('id');
                incomingCall();
            });
        } else {
            incomingCall();
        }

        function incomingCall() {
            tplParams = {
                userAvatar: userAvatar,
                callTypeUС: capitaliseFirstLetter(callType),
                callType: callType,
                userName: userName,
                dialogId: dialogId,
                sessionId: session.ID,
                userId: id
            };

            htmlTpl = QMHtml.VideoChat.onCallTpl(tplParams);

            $incomings.find('.mCSB_container').prepend(htmlTpl);
            openPopup($incomings);

            if (Settings.get('sounds_notify') && SyncTabs.get()) {
                audioSignal.play();
            }

            VideoChat.session = session;
            curSession = VideoChat.session;

            createAndShowNotification({
                'id': id,
                'dialogId': dialogId,
                'callState': '4',
                'callType': callType
            });

            sendAutoReject = setTimeout(function() {
                $('.btn_decline').click();
            }, autoReject);
        }
    };

    VideoChatView.prototype.onIgnored = function(state, session, id, extension) {
        if ((state === 'onAccept') && (User.contact.id === id)) {
            stopIncomingCall(session.initiatorID);
        }
        if ((state === 'onStop') && (User.contact.id === id)) {
            closeStreamScreen(id);
        }
        // send message to caller that user is busy
        if ((state === 'onCall') && (User.contact.id !== id)) {
            var dialogId = $('li.list-item.dialog-item[data-id="' + id + '"]').data('dialog');
                callType = (extension.callType === '1' ? 'video' : 'audio') || extension.call_type;

            VideoChat.sendMessage(id, '2', null, dialogId, callType);
        }
    };

    VideoChatView.prototype.onAccept = function(session, id, extension) {
        var audioSignal = document.getElementById('callingSignal'),
            dialogId = $('li.list-item.dialog-item[data-id="' + id + '"]').data('dialog'),
            callType = self.type,
            isCurrentUser = (User.contact.id === id) ? true : false;

        if (Settings.get('sounds_notify')) {
            audioSignal.pause();
        }

        self.sessionID = session.ID;

        addCallTypeIcon(id, callType);

        createAndShowNotification({
            'id': id,
            'dialogId': dialogId,
            'callState': '5',
            'callType': callType
        });
    };

    VideoChatView.prototype.onRemoteStream = function(session, id, stream) {
        var video = document.getElementById('remoteStream');

        curSession.attachMediaStream('remoteStream', stream);
        $('.mediacall .btn_full-mode').prop('disabled', false);

        if (self.type === 'video') {
            video.addEventListener('timeupdate', function() {
                videoStreamTime = video.currentTime;
                var duration = getTimer(Math.floor(video.currentTime));
                $('.mediacall-info-duration').text(duration);
            });

            $('#remoteUser').addClass('is-hidden');
            $('#remoteStream').removeClass('is-hidden');
        } else {
            setTimeout(function() {
                setDuration();

                $('#remoteStream').addClass('is-hidden');
                $('#remoteUser').removeClass('is-hidden');
            }, 2700);
        }
    };

    VideoChatView.prototype.onReject = function(session, id, extension) {
        var audioSignal = document.getElementById('callingSignal'),
            dialogId = $('li.list-item.dialog-item[data-id="' + id + '"]').data('dialog'),
            $chat = $('.l-chat[data-dialog="' + dialogId + '"]'),
            isCurrentUser = (User.contact.id === id) ? true : false;

        if (Settings.get('sounds_notify')) {
            document.getElementById('callingSignal').pause();
        }

        if (isCurrentUser) {
            stopIncomingCall(session.initiatorID);
        }

        curSession = {};
        VideoChat.session = null;
        VideoChat.caller = null;
        VideoChat.callee = null;
        self.type = null;

        $chat.parent('.chatView').removeClass('j-mediacall');
        $chat.find('.mediacall-info-duration').text('');
        $chat.find('.mediacall').remove();
        $chat.find('.l-chat-header').show();
        $chat.find('.l-chat-content').css({
            height: 'calc(100% - 140px)'
        });

         addCallTypeIcon(id, null);
    };

    VideoChatView.prototype.onStop = function(session, id, extension) {
        closeStreamScreen(id);
    };

    VideoChatView.prototype.onUpdateCall = function(session, id, extension) {
        var dialogId = $('li.list-item.dialog-item[data-id="' + id + '"]').data('dialog'),
            $chat = $('.l-chat[data-dialog="' + dialogId + '"]');
        var $selector = $(window.document.body);

        if ($chat[0] && ($chat.find('.mediacall')[0])) {
            if (extension.mute === 'video') {
                $selector.find('#remoteStream').addClass('is-hidden');
                $selector.find('#remoteUser').removeClass('is-hidden');
            }
            if (extension.unmute === 'video') {
                $selector.find('#remoteStream').removeClass('is-hidden');
                $selector.find('#remoteUser').addClass('is-hidden');
            }
        }
    };

    VideoChatView.prototype.onCallStatsReport = function(session, userId, stats) {
        /**
         * Hack for Firefox
         * (https://bugzilla.mozilla.org/show_bug.cgi?id=852665)
         */
        if (is_firefox) {
            var inboundrtp = _.findWhere(stats, {
                type: 'inboundrtp'
            });

            if (!inboundrtp || !isBytesReceivedChanges(userId, inboundrtp)) {
                if (!stopStreamFF) {
                    stopStreamFF = setTimeout(function() {
                        console.warn("This is Firefox and user " + userId + " has lost his connection.");

                        if (!_.isEmpty(curSession)) {
                            curSession.closeConnection(userId);
                            $('.btn_hangup').click();
                        }
                    }, 30000);
                }
            } else {
                clearTimeout(stopStreamFF);
                stopStreamFF = undefined;
            }
        }
    };

    VideoChatView.prototype.onSessionCloseListener = function(session) {
        var opponentId = User.contact.id === VideoChat.callee ? VideoChat.caller : VideoChat.callee;

        closeStreamScreen(opponentId);
    };

    VideoChatView.prototype.onUserNotAnswerListener = function(session, userId) {
        $('.btn_hangup').click();
    };

    VideoChatView.prototype.startCall = function(className, dialogId) {
        var audioSignal = document.getElementById('callingSignal'),
            params = self.build(dialogId),
            $chat = $('.l-chat:visible'),
            callType = !!className.match(/audioCall/) ? 'audio' : 'video',
            QBApiCalls = this.app.service,
            calleeId = params.opponentId,
            fullName = User.contact.full_name,
            id = $chat.data('id');

        VideoChat.getUserMedia(params, callType, function(err, res) {
            fixScroll();
            if (err) {
                $chat.find('.mediacall .btn_hangup').click();
                QMHtml.VideoChat.showError();
                return true;
            } else {
                QBApiCalls.sendPushNotification(calleeId, fullName);
            }

            VoiceMessage.resetRecord();
            VoiceMessage.blockRecorder('during a call');

            if (Settings.get('sounds_notify')) {
                audioSignal.play();
            }

            if (callType === 'audio') {
                self.type = 'audio';
                $('.btn_camera_off').click();
            } else {
                self.type = 'video';
                self.unmute('video');
            }

            addCallTypeIcon(id, callType);
            $('.chatView').addClass('j-mediacall');
        });
    };

    VideoChatView.prototype.build = function(id) {
        var $chat = id ? $('.j-chatItem[data-dialog="' + id + '"]') : $('.j-chatItem:visible'),
            userId = $chat.data('id'),
            dialogId = $chat.data('dialog'),
            contact = ContactList.contacts[userId],
            htmlTpl,
            tplParams;

        tplParams = {
            userAvatar: User.contact.avatar_url,
            contactAvatar: contact.avatar_url,
            contactName: contact.full_name,
            dialogId: dialogId,
            userId: userId
        };

        htmlTpl = QMHtml.VideoChat.buildTpl(tplParams);

        $chat.parent('.chatView').addClass('j-mediacall');
        $chat.prepend(htmlTpl);
        $chat.find('.l-chat-header').hide();
        $chat.find('.l-chat-content').css({
            height: 'calc(50% - 90px)'
        });

        setScreenStyle();

        return {
            opponentId: userId,
            dialogId: dialogId
        };
    };

    VideoChatView.prototype.mute = function(callType) {
        curSession.mute(callType);
        if (callType === 'video') {
            $('#localStream').addClass('is-hidden');
            $('#localUser').removeClass('is-hidden');
        }
    };

    VideoChatView.prototype.unmute = function(callType) {
        curSession.unmute(callType);
        if (callType === 'video') {
            $('#localStream').removeClass('is-hidden');
            $('#localUser').addClass('is-hidden');
        }
    };

    /* Private
    --------------------------------------------------------------------------*/
    function closeStreamScreen(id) {
        var dialogId = $('li.list-item.dialog-item[data-id="' + id + '"]').data('dialog'),
            $chat = $('.l-chat[data-dialog="' + dialogId + '"]'),
            $declineButton = $('.btn_decline[data-dialog="' + dialogId + '"]'),
            callingSignal = document.getElementById('callingSignal'),
            endCallSignal = document.getElementById('endCallSignal'),
            ringtoneSignal = document.getElementById('ringtoneSignal'),
            incomingCall;

        if ($chat[0] && ($chat.find('.mediacall')[0])) {
            if (Settings.get('sounds_notify') && SyncTabs.get()) {
                callingSignal.pause();
                endCallSignal.play();
            }
            clearTimeout(callTimer);
            curSession = {};
            VideoChat.session = null;
            VideoChat.caller = null;
            VideoChat.callee = null;
            self.type = null;
            videoStreamTime = null;

            VoiceMessage.resetRecord();

            $chat.parent('.chatView').removeClass('j-mediacall');
            $chat.find('.mediacall').remove();
            $chat.find('.l-chat-header').show();
            $chat.find('.l-chat-content').css({
                height: 'calc(100% - 140px)'
            });
        } else if ($declineButton[0]) {
            incomingCall = $declineButton.parents('.incoming-call');
            incomingCall.remove();

            if ($('#popupIncoming .mCSB_container').children().length === 0) {
                closePopup();
                if (Settings.get('sounds_notify')) {
                    ringtoneSignal.pause();
                }
            }
        }

        addCallTypeIcon(id, null);
    }

    function switchOffDevice(event) {
        var $obj = $(event.target).data('id') ? $(event.target) : $(event.target).parent(),
            opponentId = $obj.data('id'),
            dialogId = $obj.data('dialog'),
            deviceType = !!$obj.attr('class').match(/btn_camera_off/) ? 'video' : 'audio',
            msg = deviceType === 'video' ? 'Camera' : 'Mic';

        if (self.type !== deviceType && self.type === 'audio') {
            $obj.addClass('off');
            $obj.attr('title', msg + ' is off');
            return true;
        }

        if ($obj.is('.off')) {
            self.unmute(deviceType);
            if (deviceType === 'video')
            curSession.update({
                dialog_id: dialogId,
                unmute: deviceType
            });
            $obj.removeClass('off');
            $obj.removeAttr('title');
        } else {
            self.mute(deviceType);
            if (deviceType === 'video')
            curSession.update({
                dialog_id: dialogId,
                mute: deviceType
            });
            $obj.addClass('off');
            $obj.attr('title', msg + ' is off');
        }

        return false;
    }

    function createAndShowNotification(paramsObg) {
        var cancelNotify  = !Settings.get('calls_notify'),
            isNotMainTab  = !SyncTabs.get();

        if (cancelNotify || isNotMainTab) {
            return false;
        }

        var msg = {
            'callState': paramsObg.callState,
            'dialog_id': paramsObg.dialogId,
            'sender_id': paramsObg.id,
            'caller': paramsObg.id,
            'type': 'chat',
            'callType': capitaliseFirstLetter(paramsObg.callType)
        };

        var params = {
            'user': User,
            'dialogs': Entities.Collections.dialogs,
            'contacts': ContactList.contacts
        };

        var title = Helpers.Notifications.getTitle(msg, params),
            options = Helpers.Notifications.getOptions(msg, params);

        if (QMCONFIG.notification && QBNotification.isSupported() && !window.isQMAppActive) {
            if (!QBNotification.needsPermission()) {
                Helpers.Notifications.show(title, options);
            } else {
                QBNotification.requestPermission(function(state) {
                    if (state === "granted") {
                        Helpers.Notifications.show(title, options);
                    }
                });
            }
        }
    }

    function addCallTypeIcon(id, callType) {
        var $status = $('li.dialog-item[data-id="' + id + '"]').find('span.status');

        if (callType === 'video') {
            $status.addClass('icon_videocall');
        } else if (callType === 'audio') {
            $status.addClass('icon_audiocall');
        } else {
            $status.hasClass('icon_videocall') ? $status.removeClass('icon_videocall') : $status.removeClass('icon_audiocall');
        }
    }

    function isBytesReceivedChanges(userId, inboundrtp) {
        var res = true,
            inbBytesRec = inboundrtp.bytesReceived;

        if (network[userId] === undefined) {
            network[userId] = {
                'bytesReceived': inbBytesRec
            };
        } else {
            if (network[userId].bytesReceived === inbBytesRec) {
                res = false;
            } else {
                network[userId] = {
                    'bytesReceived': inbBytesRec
                };
            }
        }

        return res;
    }

    function stopIncomingCall(id) {
        var dialogId = $('li.list-item.dialog-item[data-id="' + id + '"]').data('dialog'),
            $declineButton = $('.btn_decline[data-dialog="' + dialogId + '"]');

        clearTimeout(sendAutoReject);
        sendAutoReject = undefined;

        $declineButton.parents('.incoming-call').remove();

        if ($('#popupIncoming .mCSB_container').children().length === 0) {
            closePopup();
            if (Settings.get('sounds_notify')) {
                document.getElementById('ringtoneSignal').pause();
            }
        }

        curSession = {};
        VideoChat.session = null;
        VideoChat.caller = null;
        VideoChat.callee = null;
        self.type = null;

        return false;
    }

    function openPopup($objDom) {
        $objDom.add('.popups').addClass('is-overlay');
    }

    function closePopup() {
        $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
        $('.temp-box').remove();

        if ($('.attach-video video')[0]) {
            $('.attach-video video')[0].pause();
        }
    }

    function setDuration(currentTime) {
        var c = currentTime || 0;
        $('.mediacall-info-duration').text(getTimer(c));
        callTimer = setTimeout(function() {
            c++;
            setDuration(c);
        }, 1000);
    }

    function getTimer(time) {
        var h, min, sec;

        h = Math.floor(time / 3600);
        h = h >= 10 ? h : '0' + h;
        min = Math.floor(time / 60);
        min = min >= 10 ? min : '0' + min;
        sec = Math.floor(time % 60);
        sec = sec >= 10 ? sec : '0' + sec;

        return h + ':' + min + ':' + sec;
    }

    function fixScroll() {
        var $chat = $('.l-chat:visible'),
            containerHeight = $chat.find('.l-chat-content .mCSB_container').height(),
            chatContentHeight = $chat.find('.l-chat-content').height(),
            draggerContainerHeight = $chat.find('.l-chat-content .mCSB_draggerContainer').height(),
            draggerHeight = $chat.find('.l-chat-content .mCSB_dragger').height();

        $chat.find('.l-chat-content .mCSB_container').css({
            top: chatContentHeight - containerHeight + 'px'
        });
        $chat.find('.l-chat-content .mCSB_dragger').css({
            top: draggerContainerHeight - draggerHeight + 'px'
        });
    }

    function capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function setScreenStyle() {
        if ($('.mediacall').outerHeight() <= 260) {
            $('.mediacall').addClass('small_screen');
        } else {
            $('.mediacall').removeClass('small_screen');
        }
    }

    return VideoChatView;
});
