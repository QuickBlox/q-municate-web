/*
 * Q-municate chat application
 *
 * VideoChat Module
 *
 */
define([
    'jquery',
    'config',
    'quickblox',
    'Helpers'
], function(
    $,
    QMCONFIG,
    QB,
    Helpers
) {

    var curSession,
        self;

    function VideoChat(app) {
        this.app = app;
        this.session = {};
        self = this;
    }

    VideoChat.prototype.getUserMedia = function(options, callType, callback) {
        var User = this.app.models.User;
        var params = {
            audio: true,
            video: callType === 'video' ? true : false,
            elemId: 'localStream',
            options: {
                muted: true,
                mirror: true
            }
        };

        if (!options.isCallee) {
            if (callType === 'video') {
                self.session = QB.webrtc.createNewSession([options.opponentId], QB.webrtc.CallType.VIDEO);
            } else {
                self.session = QB.webrtc.createNewSession([options.opponentId], QB.webrtc.CallType.AUDIO);
            }
        }

        curSession = self.session;

        curSession.getUserMedia(params, function(err, stream) {
            if (err) {
                Helpers.log('Error', err);
                if (!options.isCallee) {
                    callback(err, null);
                } else {
                    self.sendMessage(options.opponentId, '3', null, options.dialogId, callType, true);
                    callback(err, null);
                }
            } else {
                Helpers.log('Stream', stream);

                if (!$('.l-chat[data-dialog="' + options.dialogId + '"]').find('.mediacall')[0]) {
                    stream.stop({});
                    return true;
                }

                if (options.isCallee) {
                    curSession.accept({});
                    self.caller = options.opponentId;
                    self.callee = User.contact.id;
                } else {
                    curSession.call({});
                    self.caller = User.contact.id;
                    self.callee = options.opponentId;
                }
                callback(null, stream);
            }
        });
    };

    VideoChat.prototype.sendMessage = function(userId, state, callDuration, dialogId, callType, isErrorMessage, sessionID) {
        var jid = QB.chat.helpers.getUserJid(userId, QMCONFIG.qbAccount.appId),
            User = this.app.models.User,
            Message = this.app.models.Message,
            MessageView = this.app.views.Message,
            VideoChatView = this.app.views.VideoChat,
            DialogView = this.app.views.Dialog,
            time = Math.floor(Date.now() / 1000),
            $dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="' + dialogId + '"]'),
            selected = $('[data-dialog = ' + dialogId + ']').is('.is-selected'),
            unread = parseInt($dialogItem.length > 0 &&
                $dialogItem.find('.unread').text().length > 0 ?
                $dialogItem.find('.unread').text() : 0),
            extension,
            message,
            msg;

        if (!isErrorMessage) {
            extension = {
                save_to_history: 1,
                date_sent: time,
                callType: state === '2' ? (callType === 'video' ? '2' : '1') : (VideoChatView.type === 'video' ? '2' : '1'),
                callState: state === '1' && !callDuration ? '2' : state,
                caller: state === '2' ? userId : self.caller,
                callee: state === '2' ? User.contact.id : self.callee
            };

            if (callDuration) extension.callDuration = Helpers.getDuration(null, callDuration);
        } else {
            extension = {
                save_to_history: 1,
                date_sent: time,
                callType: callType === 'video' ? '2' : '1',
                callState: state,
                caller: userId,
                callee: User.contact.id
            };
        }

        if (sessionID) {
            extension.sessionID = sessionID;
        }

        msg = {
            chat_dialog_id: dialogId,
            date_sent: time,
            sender_id: User.contact.id,
            callType: extension.callType,
            callState: extension.callState,
            caller: extension.caller,
            callee: extension.callee,
            callDuration: extension.callDuration || null,
            sessionID: extension.sessionID || null,
            'online': true
        };

        msg.id = QB.chat.send(jid, {
            type: 'chat',
            body: 'Call notification',
            extension: extension
        });

        message = Message.create(msg);
        Helpers.log(message);
        MessageView.addItem(message, true, true);

        // show counter on dialog item about missed calls
        if (!selected) {
            unread++;
            $dialogItem.find('.unread').text(unread);
            DialogView.getUnreadCounter(dialogId);
        }

        Helpers.Dialogs.moveDialogToTop(dialogId);
    };

    /* Private
    ---------------------------------------------------------------------- */

    return VideoChat;

});
