/*
 * Q-municate chat application
 *
 * Attach View Module
 *
 */
define([
    'jquery',
    'config',
    'quickblox',
    'Helpers',
    'QMHtml',
    'LocationView',
    'underscore',
    'progressbar'
], function(
    $,
    QMCONFIG,
    QB,
    Helpers,
    QMHtml,
    Location,
    _,
    ProgressBar
) {

    var self;

    var User,
        Message,
        Attach;

    function AttachView(app) {
        this.app = app;

        User = this.app.models.User;
        Message = this.app.models.Message;
        Attach = this.app.models.Attach;
        self = this;
    }

    AttachView.prototype = {

        changeInput: function(objDom) {
            var file = objDom[0].files[0] || null,
                chat = $('.l-chat:visible .l-chat-content .mCSB_container'),
                id = _.uniqueId(),
                fileSize = file.size,
                fileSizeCrop = fileSize > (1024 * 1024) ? (fileSize / (1024 * 1024)).toFixed(1) : (fileSize / 1024).toFixed(1),
                fileSizeUnit = fileSize > (1024 * 1024) ? 'MB' : 'KB',
                type = file.type.indexOf('image/') === 0 ? 'image' :
                    file.type.indexOf('audio/') === 0 ? 'audio' :
                    file.type.indexOf('video/') === 0 ? 'video' : 'photo',
                maxSize = ((type === 'video') ? QMCONFIG.maxVideoSize :
                    QMCONFIG.maxLimitFile) * 1024 * 1024,
                errMsg,
                html;

            if (file) {
                if (file.name.length > 100) {
                    errMsg = QMCONFIG.errors.fileName;
                } else if (file.size > maxSize) {
                    if (type === 'video') {
                        errMsg = QMCONFIG.errors.videoSize;
                    } else {
                        errMsg = QMCONFIG.errors.fileSize;
                    }
                }

                if (errMsg) {
                    self.pastErrorMessage(errMsg, objDom, chat);
                } else {
                    html = QMHtml.Attach.attach({
                        'fileName': file.name,
                        'fileSizeCrop': fileSizeCrop,
                        'fileSizeUnit': fileSizeUnit,
                        'id': id
                    });
                }

                chat.append(html);
                objDom.val('');
                fixScroll();
                if (file.type.indexOf('image') > -1) {
                    Attach.crop(file, {
                        w: 1000,
                        h: 1000
                    }, function(blob) {
                        self.createProgressBar(id, fileSizeCrop, fileSize, blob);
                    });
                } else {
                    self.createProgressBar(id, fileSizeCrop, fileSize, file);
                }
            }
        },

        pastErrorMessage: function(errMsg, objDom, chat) {
            var html = QMHtml.Attach.error({
                'errMsg': errMsg
            });

            chat.append(html);
            objDom.val('');

            fixScroll();

            return false;
        },

        createProgressBar: function(id, fileSizeCrop, fileSize, file) {
            var progressBar = new ProgressBar('progress_' + id),
                $chatItem = $('.j-chatItem'),
                percent = 5,
                isUpload = false,
                part,
                time;

            if (fileSize <= 5 * 1024 * 1024) {
                time = 50;
            } else if (fileSize > 5 * 1024 * 1024) {
                time = 60;
            } else if (fileSize > 6 * 1024 * 1024) {
                time = 70;
            } else if (fileSize > 7 * 1024 * 1024) {
                time = 80;
            } else if (fileSize > 8 * 1024 * 1024) {
                time = 90;
            } else if (fileSize > 9 * 1024 * 1024) {
                time = 100;
            }

            setPercent();

            Helpers.log('File:', file);

            Attach.upload(file, function(blob) {
                Helpers.log('Blob:', blob);

                self.sendMessage($chatItem, blob, fileSize);
                isUpload = true;

                if ($('#progress_' + id).length > 0) {
                    setPercent();
                }
            });

            function setPercent() {
                if (isUpload) {
                    progressBar.setPercent(100);
                    part = fileSizeCrop;
                    $('.attach-part_' + id).text(part);

                    setTimeout(function() {
                        $('.attach-part_' + id).parents('article').remove();
                    }, 50);

                } else {
                    progressBar.setPercent(percent);
                    part = (fileSizeCrop * percent / 100).toFixed(1);
                    $('.attach-part_' + id).text(part);
                    percent += 5;
                    if (percent > 95) return false;
                    setTimeout(setPercent, time);
                }
            }
        },

        cancel: function(objDom) {
            objDom.parents('article').remove();
        },

        sendMessage: function(chat, blob, size, mapCoords) {
            var MessageView = this.app.views.Message,
                jid = chat.data('jid'),
                id = chat.data('id'),
                dialog_id = chat.data('dialog'),
                type = chat.is('.is-group') ? 'groupchat' : 'chat',
                time = Math.floor(Date.now() / 1000),
                dialogItem = type === 'groupchat' ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="' + dialog_id + '"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="' + id + '"]'),
                locationIsActive = $('.j-send_location').hasClass('btn_active'),
                copyDialogItem,
                lastMessage,
                message,
                attach,
                msg;

            if (mapCoords) {
                attach = {
                    'type': 'location',
                    'data': mapCoords
                };
            } else {
                attach = Attach.create(blob, size);
            }

            msg = {
                'type': type,
                'body': attach.type === 'location' ? 'Location' : 'Attachment',
                'extension': {
                    'save_to_history': 1,
                    'dialog_id': dialog_id,
                    'date_sent': time,
                    'attachments': [
                        attach
                    ]
                },
                'markable': 1
            };

            if (locationIsActive) {
                msg.extension.latitude = localStorage['QM.latitude'];
                msg.extension.longitude = localStorage['QM.longitude'];
            }

            msg.id = QB.chat.send(jid, msg);

            message = Message.create({
                'body': msg.body,
                'chat_dialog_id': dialog_id,
                'date_sent': time,
                'attachment': attach,
                'sender_id': User.contact.id,
                'latitude': localStorage['QM.latitude'] || null,
                'longitude': localStorage['QM.longitude'] || null,
                '_id': msg.id,
                'online': true
            });

            Helpers.log(message);
            if (type === 'chat') {
                lastMessage = chat.find('article[data-type="message"]').last();

                message.stack = Message.isStack(true, message, lastMessage);
                MessageView.addItem(message, true, true);
            }

            if (dialogItem.length > 0) {
                copyDialogItem = dialogItem.clone();
                dialogItem.remove();
                $('#recentList ul').prepend(copyDialogItem);
                if (!$('#searchList').is(':visible')) {
                    $('#recentList').removeClass('is-hidden');
                    Helpers.Dialogs.isSectionEmpty($('#recentList ul'));
                }
            }
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function fixScroll() {
        $('.l-chat:visible .j-scrollbar_message').mCustomScrollbar('scrollTo', 'bottom');
    }

    return AttachView;

});
