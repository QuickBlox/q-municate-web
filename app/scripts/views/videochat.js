// TODO
// Есть проблемы при сохранинии сессии - при входящем меняется местами callee и caller

/*
 * Q-municate chat application
 *
 * VideoChat View Module
 *
 */
define([
    'jquery',
    'Entities',
    'config',
    'Helpers',
    'QBNotification',
    'QMHtml'
], function(
    $,
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
        Dialog = this.app.models.Dialog;
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
                    isGroupCall = ($this.data('type') === 2),
                    activeDialog = Dialog.app.entities.active,
                    activeDialogDetailed = DialogView.app.entities.Collections.dialogs.get(activeDialog),
                    className = $this.attr('class'),
                    userId = $this.data('id'),
                    $dialogItem = $('.j-dialogItem[data-dialog="' + activeDialog + '"]'),
                    limitOccupants = QMCONFIG.QBconf.webrtc.maxOccupantsGroupCall,
                    dialogId,
                    tplParams;

                if (isGroupCall && activeDialogDetailed.attributes.occupants_ids.length >= limitOccupants) {

                    tplParams = {
                        groupAvatar: activeDialogDetailed.attributes.room_photo || QMCONFIG.defAvatar.group_url,
                        limitOccupants: limitOccupants
                    };

                    htmlTpl = QMHtml.VideoChat.exceededOccupangsCallTpl(tplParams);
                    $('#popupIncoming').find('.mCSB_container').prepend(htmlTpl);
                    openPopup($('#popupIncoming'));
                    
                    return false;
                }

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
                saveCurSession(curSession, { dialogId: dialogId });
                Helpers.Dialogs.moveDialogToTop(dialogId);
            }

            return false;
        });

        $('#popupIncoming').on('click', '.btn_decline', function() {
            var $self = $(this),
                $incomingCall = $self.parents('.incoming-call'),
                dialogId = $self.data('dialog'),
                callType = $self.data('calltype'),
                audioSignal = document.getElementById('ringtoneSignal');

            if (!isGroupChat(curSession)) {
                var opponentId = $self.data('id');
                VideoChat.sendMessage(opponentId, '2', null, dialogId, callType);
                curSession.stop({});
            } else {
                console.dir(QB.webrtc);
                curSession.reject({});
                // var user = User.contact.id;
                // curSession.closeConnection();
                // curSession.destroy();
                console.dir(QB.webrtc);
                // QB.webrtc.destroy();
            }

            // clearCurSession();
            $incomingCall.remove();
            
            if ($('#popupIncoming .mCSB_container').children().length === 0) {
                closePopup();
                if (Settings.get('sounds_notify')) {
                    audioSignal.pause();
                }
            }
            
            return false;
        });

        $('#popupIncoming').on('click', '.btn_accept_exceed', function() {
            $('#popupIncoming').find('.mCSB_container').empty();
            closePopup();
        });

        $('#popupIncoming').on('click', '.btn_accept', function() {
            self.cancelCurrentCalls();

            clearTimeout(sendAutoReject);
            sendAutoReject = undefined;

            var $self = $(this),
                id = VideoChat.currentDialogId,
                $dialogItem = $('.dialog-item[data-dialog="' + id + '"]');
            
            DialogView.htmlBuild($dialogItem);

            var dialogId = $self.data('dialog'),
                sessionId = $self.data('session'),
                callType = $self.data('calltype'),
                audioSignal = $('#ringtoneSignal')[0],
                params = self.build(dialogId, callType),
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
                    alert(err);
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
                // opponentId = $self.data('id'),
                // dialogId = $self.data('dialog'),
                // callType = curSession.callType === 1 ? 'video' : 'audio',
                duration = $self.parents('.mediacall').find('.mediacall-info-duration').text(),
                callingSignal = $('#callingSignal')[0],
                endCallSignal = $('#endCallSignal')[0],
                isErrorMessage = $self.data('errorMessage');
            
            clearTimeout(callTimer);

            if (Settings.get('sounds_notify') && SyncTabs.get()) {
                callingSignal.pause();
                endCallSignal.play();
            }
            
            // Если трубку положил инициатор и звонок не начался, завершаю сессию
            if (User.contact.id === VideoChat.caller && duration === 'connect...') {
                curSession.stop({});
                // TODO: отправка сообщения работает не верно
                // VideoChat.sendMessage(opponentId, '1', null, dialogId, callType);
                $self.removeAttr('data-errorMessage');
            } else {
                curSession.reject({});
            }

            clearCurSession();
            restoreChat($chat);
            // addCallTypeIcon(dialogId, null);

            return false;
        });

        $('body').on('click', '.btn_camera_off, .btn_mic_off', switchOffDevice);

        // full-screen-mode
        $('body').on('click', '.btn_full-mode', function() {
            console.log('Roma => click .btn_full-mode');
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
        var dialogId = extension.dialogId,
        isGroupCall = isGroupChat(session);
        
        saveCurSession(session, extension);

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
            callTypeUС = capitaliseFirstLetter(callType),
            userName = contact.full_name || extension.full_name,
            userAvatar = contact.avatar_url || extension.avatar,
            dialogs = Dialog.app.entities.Collections.dialogs,
            activeDialogDetailed = dialogs.get(dialogId),
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
                avatar: isGroupCall ? activeDialogDetailed.attributes.room_photo || QMCONFIG.defAvatar.group_url : userAvatar ,
                callType: callType,
                callTypeUС: callTypeUС,
                callSignature: isGroupCall ? "Group " + callTypeUС + " Call from<br>" + activeDialogDetailed.attributes.room_name : callTypeUС + " Call from " + userName,
                dialogId: dialogId,
                sessionId: session.ID,
                userId: id
            };

            htmlTpl = QMHtml.VideoChat.onCallTpl(tplParams);

            $incomings.find('.mCSB_container').prepend(htmlTpl);
            openPopup($incomings);

            Helpers.pauseAllMedia();

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
        console.dir(QB.webrtc);
        // alert('onignored');
        // if (!areCurSession()) return false;

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
            callType = self.type;

        // Если групповой аудио звонок убираю прозрачность аватарки юзера
        if (isGroupChat(session) && callType === 'audio') {
            showAvatar(id);
            showUsrName(id);
        }

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
        
        // if (!areCurSession()) return;

        console.group('OnReject');

        var peerConnection = curSession.peerConnections;
        var peerConnection1 = curSession.peerConnections[id];

        console.log(curSession.peerConnections);
        peerConnection1.release();
        console.log(curSession.peerConnections);

        console.dir(session);

        curSession.closeConnection(id);
        console.dir(session);
        console.groupEnd();

        if (!isGroupChat(session)) {
            $('.btn_hangup').click();
            return false;
        }

        // var dialogId = $('li.list-item.dialog-item[data-id="' + id + '"]').data('dialog'),
        //     $chat = $('.l-chat[data-dialog="' + dialogId + '"]'),
        //     isCurrentUser = User.contact.id === id;

        // if (Settings.get('sounds_notify')) {
        //     document.getElementById('callingSignal').pause();
        // }

        // Удаляю оппонента, который положил трубку из списка оппонентов
        // removeOpponent(id);
        removeAvatar(id);
        removeUsrName(id);

        // if (isCurrentUser) {
        //     stopIncomingCall(session.initiatorID);
        // }

        // Если не осталось оппонентов - завершаю текущий звонок
        // if (!areOpponents()) {
        //     clearCurSession();
        //     $chat.parent('.chatView').removeClass('j-mediacall');
        //     $chat.find('.mediacall-info-duration').text('');
        //     $chat.find('.mediacall').remove();
        //     $chat.find('.l-chat-header').show();
        //     $chat.find('.l-chat-content').css({
        //         height: 'calc(100% - 140px)'
        //     });
    
        //      addCallTypeIcon(id, null);
        // }
    };

    VideoChatView.prototype.onStop = function(session, id, extension) {
        // alert('onstop');
        closeStreamScreen(id);
        clearCurSession();
    };

    VideoChatView.prototype.onUpdateCall = function(session, id, extension) {
        alert('onUpdateCall');
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

    VideoChatView.prototype.onSessionConnectionStateChangedListener = function(session, userID, connectionState) {
        // Это только для браузера Firefox, дополнительно завершается сессия
        if (is_firefox && (connectionState === 3)) {
            curSession.closeConnection(userID);
            $('.btn_hangup').click();
        }
    };

    VideoChatView.prototype.onSessionCloseListener = function(session) {
        // alert('close session');
        // if (!areCurSession()) return;

        // // TODO: тут закрывается видеозвонок для одного, для группового возможно неверно работает
        var opponentId = User.contact.id === VideoChat.callee ? VideoChat.caller : VideoChat.callee;
        // $('.btn_hangup').click();
        // closeStreamScreen(opponentId);
    };

    VideoChatView.prototype.onUserNotAnswerListener = function(session, userId) {
        alert('onUserNotAnswerListener');
        $('.btn_hangup').click();
    };

    VideoChatView.prototype.startCall = function(className, dialogId) {
        var audioSignal = document.getElementById('callingSignal'),
            callType = !!className.match(/audioCall/) ? 'audio' : 'video',
            params = self.build(dialogId, callType),
            $chat = $('.l-chat:visible'),
            id = $chat.data('id');

        VideoChat.getUserMedia(params, callType, function(err, res) {
            // Тут возвращается медиастрим
            fixScroll();
            if (err) {
                $chat.find('.mediacall .btn_hangup').click();
                QMHtml.VideoChat.showError();
                return true;
            } else {
                // TODO: пуш-нотификации не работают
                // QBApiCalls.sendPushNotification(calleeId, fullName);
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
    
    VideoChatView.prototype.build = function(id, callType) {
        var $chat = id ? $('.j-chatItem[data-dialog="' + id + '"]') : $('.j-chatItem:visible'),
            isGroupCall = $chat.data('type') === 2,
            activeDialogDetailed = this.app.entities.Collections.dialogs.get(id),
            contactId = activeDialogDetailed.attributes.occupants_ids,
            contact = ContactList.contacts[contactId];
            
            options = {
                isGroupCall: isGroupCall,
                callType: callType,
                contacts: ContactList.contacts,
                contact: contact,
                contactId: contactId,
                dialogId: id,
                activeDialogDetailed: activeDialogDetailed
            };

        htmlTpl = getHtmlTpl.call(options);

        $chat.parent('.chatView').addClass('j-mediacall');
        $chat.prepend(htmlTpl);
        $chat.find('.l-chat-header').hide();
        $chat.find('.l-chat-content').css({
            height: 'calc(50% - 90px)'
        });

        setScreenStyle();

        return {
            opponentId: contactId,
            dialogId: id
        };
    };

    VideoChatView.prototype.mute = function(callType) {
        console.log('Roma => VideoChatView.prototype.mute');
        curSession.mute(callType);
        if (callType === 'video') {
            $('#localStream').addClass('is-hidden');
            $('#localUser').removeClass('is-hidden');
        }
    };

    VideoChatView.prototype.unmute = function(callType) {
        console.log('Roma => VideoChatView.prototype.unmute');
        curSession.unmute(callType);
        if (callType === 'video') {
            $('#localStream').removeClass('is-hidden');
            $('#localUser').addClass('is-hidden');
        }
    };

    /* Private
    --------------------------------------------------------------------------*/
    function closeStreamScreen(id) {
        var dialogId = getSessionDialogId(),
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
            videoStreamTime = null;
            VoiceMessage.resetRecord();
            restoreChat($chat);

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

        addCallTypeIcon(dialogId, null);
    }

    function switchOffDevice(event) {
        console.log('Roma => switchOffDevice(event)');
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
        console.log('Roma => createAndShowNotification(paramsObg)');
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
        // TODO: здесь исправить id на группу
        // var $status = $('li.dialog-item[data-id="' + id + '"]').find('span.status');
        var $status = $('li.dialog-item[data-dialog="' + id + '"]').find('span.status');

        if (callType === 'video') {
            $status.addClass('icon_videocall');
        } else if (callType === 'audio') {
            $status.addClass('icon_audiocall');
        } else {
            $status.hasClass('icon_videocall') ? $status.removeClass('icon_videocall') : $status.removeClass('icon_audiocall');
        }
    }

    function stopIncomingCall(id) {
        alert('stopIncomingCall');
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

        clearCurSession();

        return false;
    }

    function openPopup($objDom) {
        console.log('Roma => openPopup($objDom)');
        $objDom.add('.popups').addClass('is-overlay');
    }

    function closePopup() {
        console.log('Roma => closePopup()');
        $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
        $('.temp-box').remove();

        if ($('.attach-video video')[0]) {
            $('.attach-video video')[0].pause();
        }
    }

    function setDuration(currentTime) {
        console.log('Roma => setDuration(currentTime)');
        var c = currentTime || 0;
        $('.mediacall-info-duration').text(getTimer(c));
        callTimer = setTimeout(function() {
            c++;
            setDuration(c);
        }, 1000);
    }

    function getTimer(time) {
        console.log('Roma => getTimer(time)');
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

    function getHtmlTpl() {
        var tplParams,
            htmlTpl;

        if (this.callType === 'audio' && this.isGroupCall === false) {
            tplParams = {
                callType: this.callType,
                callTypeUС: capitaliseFirstLetter(this.callType),
                userId: User.contact.id,
                userName: User.contact.full_name,
                userAvatar: User.contact.avatar_url,
                contactName: this.contact.full_name,
                contactAvatar: this.contact.avatar_url,
                dialogId: this.dialogId
            };

            htmlTpl = QMHtml.VideoChat.outSingleAudioCallTpl(tplParams);

        } else if (this.callType === 'audio' && this.isGroupCall === true) {
            var contacts = this.contacts,
                occupantsTpl = "",
                occupantName = this.contacts,
                avataUrl;

            this.activeDialogDetailed.attributes.occupants_ids.forEach(function(occupant) {
                avataUrl = contacts[occupant].avatar_url || QMCONFIG.defAvatar.url_png;
                occupantName = contacts[occupant].full_name ;
                occupantsTpl +=
                '<div class ="usrBox">' +
                '<img id="remoteUser-' + occupant + '" class="hidden-avatar mediacall-global-avatar" src="' + avataUrl + '"alt="avatar">' +
                '<div id="usrName-' +  occupant + '" class ="hidden-usrName usrW">' + '<h5>'+ occupantName +'</h5>' + '</div>' + '</div>';
            });

            tplParams = {
                callType: this.callType,
                callTypeUС: capitaliseFirstLetter(this.callType),
                userId: User.contact.id,
                userName: User.contact.full_name,
                userAvatar: User.contact.avatar_url,
                contactName: this.activeDialogDetailed.attributes.room_name,
                contactAvatar: this.activeDialogDetailed.attributes.room_photo || QMCONFIG.defAvatar.group_url,
                dialogId: this.dialogId,
                occupantsTpl: occupantsTpl,
            };

            htmlTpl = QMHtml.VideoChat.outGroupAudioCallTpl(tplParams);

        } else if (this.callType === 'video' && this.isGroupCall === false) {

            tplParams = {
                callType: this.callType,
                callTypeUС: capitaliseFirstLetter(this.callType),
                userId: User.contact.id,
                userName: User.contact.full_name,
                userAvatar: User.contact.avatar_url,
                contactName: this.contact.full_name,
                contactAvatar: this.contact.avatar_url,
                dialogId: this.dialogId
            };

            htmlTpl = QMHtml.VideoChat.outSingleVideoCallTpl(tplParams);            
            
        // tplParams = {
        //     type: type,
        // userName: !isGroupCall ? userName : "Group call " + currentDialogId,
        //     userAvatar: !isGroupCall ? userAvatar : QMCONFIG.defAvatar.group_url,
        //     callTypeUС: capitaliseFirstLetter(callType),
        //     userAvatar: User.contact.avatar_url,
        //     contactAvatar: (type === '3') ? contact.avatar_url : QMCONFIG.defAvatar.group_url,
        //     contactName: (type === '3') ? contact.full_name : activeDialogName,
        //     dialogId: dialogId,
        //     userId: userId
        // };              

        } else if (this.callType === 'video' && this.isGroupCall === true) {
            tplParams = {
                callType: this.callType,
                callTypeUС: capitaliseFirstLetter(this.callType),
                userId: User.contact.id,
                userName: User.contact.full_name,
                userAvatar: User.contact.avatar_url,
                contactName: this.activeDialogDetailed.attributes.room_name,
                contactAvatar: User.contact.avatar_url,
                dialogId: this.dialogId
            };
        
            htmlTpl = QMHtml.VideoChat.outGroupVideoCallTpl(tplParams);
        }

        return htmlTpl;
    }

    function isGroupChat(session) {
        return session.opponentsIDs.length > 1;
    }
    
    function showAvatar(id) {
        $( '#remoteUser-' + id ).removeClass('hidden-avatar');
    }
    
    function removeAvatar(id) {
        var t = $( '#remoteUser-' + id );
        $( '#remoteUser-' + id ).remove();   
    }
    function showUsrName(id) {
        $( '#usrName-' + id ).removeClass('hidden-usrName');
    }
    function removeUsrName(id) {
        var t = $( '#usrName-' + id );
        $( '#usrName-' + id ).remove();
    }

    function getSessionDialogId() {
        return VideoChat.currentDialogId || null;
    }

    // function getSessionOpponents() {
    //     let opponents = VideoChat.callee;
    //     opponents.push(VideoChat.caller);
    //     opponents = opponents.filter(function(opponent) { return opponent !== User.contact.id; });
    //     return opponents;
    // }

    // function removeOpponent(id) {
    //     if (VideoChat.callee) {
    //         VideoChat.callee = VideoChat.callee.filter(function(opponent) { return opponent !== id; });
    //     }
    // }

    // function areOpponents() {
    //     return VideoChat.callee.length > 0;
    // }

    function saveCurSession(session, extension) {
        curSession = VideoChat.session;
        VideoChat.currentDialogId = extension.dialogId;
        self.type = session.callType;
    }

    function clearCurSession() {
        curSession = {};
        VideoChat.session = null;
        VideoChat.caller = null;
        VideoChat.callee = null;
        self.type = null;
    }

    function areCurSession() {
        return Object.keys(curSession).length !== 0;
    }

    function restoreChat($chat) {
        $chat.parent('.chatView').removeClass('j-mediacall');
        $chat.find('.mediacall-info-duration').text('');
        $chat.find('.mediacall').remove();
        $chat.find('.l-chat-header').show();
        $chat.find('.l-chat-content').css({
            height: 'calc(100% - 140px)'
        });
    }

    return VideoChatView;
});
