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

        changeInput: function(objDom, recordedAudioFile) {
            var file = recordedAudioFile ? recordedAudioFile : objDom[0].files[0],
                chat = $('.l-chat:visible .l-chat-content .mCSB_container'),
                id = _.uniqueId(),
                fileSize = file.size,
                fileSizeCrop = fileSize > (1024 * 1024) ? (fileSize / (1024 * 1024)).toFixed(1) : (fileSize / 1024).toFixed(1),
                fileSizeUnit = fileSize > (1024 * 1024) ? 'MB' : 'KB',
                metadata = readMetadata(file),
                errMsg,
                html;

            if (file) {
                errMsg = self.validateFile(file);

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

                if (objDom) {
                    objDom.val('');
                }

                fixScroll();

                if (file.type.indexOf('image') > -1) {
                    Attach.crop(file, {
                        w: 1000,
                        h: 1000
                    }, function(blob) {
                        self.createProgressBar(id, fileSizeCrop, metadata, blob);
                    });
                } else {
                    self.createProgressBar(id, fileSizeCrop, metadata, file);
                }
            }
        },

        pastErrorMessage: function(errMsg, objDom, chat) {
            var html = QMHtml.Attach.error({
                'errMsg': errMsg
            });

            chat.append(html);

            if (objDom) {
                objDom.val('');
            }

            fixScroll();

            return false;
        },

        createProgressBar: function(id, fileSizeCrop, metadata, file) {
            var progressBar = new ProgressBar('progress_' + id),
                dialogId = self.app.entities.active,
                $chatItem = $('.j-chatItem[data-dialog="' + dialogId + '"]'),
                fileSize = file.size || metadata.size,
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

            Attach.upload(file, function(blob) {
                Helpers.log('Blob:', blob);

                if (!blob.size) {
                    blob.size = file.size || metadata.size;
                }

                self.sendMessage($chatItem, blob, metadata);

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

        sendMessage: function(chat, blob, metadata, mapCoords) {
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
                attach = Attach.create(blob, metadata);
            }

            msg = {
                'type': type,
                'body': getAttachmentText(),
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

            function getAttachmentText() {
                var text;

                switch (attach.type) {
                    case 'location':
                        text = 'Location';
                        break;

                    case 'image':
                        text = 'Image attachment';
                        break;

                    case 'audio':
                        text = 'Audio attachment';
                        break;

                    case 'video':
                        text = 'Video attachment';
                        break;

                    default:
                        text = 'Attachment';
                        break;
                }

                return text;
            }
        },

        validateFile: function(file) {
            var errMsg,
                maxSize,
                fullType,
                type;

            fullType = file.type;
            type = file.type.indexOf('image/') === 0 ? 'image' :
                   file.type.indexOf('audio/') === 0 ? 'audio' :
                   file.type.indexOf('video/') === 0 ? 'video' : 'file';

            if (type === 'video' || type === 'audio') {
                maxSize = QMCONFIG.maxLimitMediaFile * 1024 * 1024;
            } else {
                maxSize = QMCONFIG.maxLimitFile * 1024 * 1024;
            }

            if (file.name.length > 100) {
                errMsg = QMCONFIG.errors.fileName;
            } else if (file.size > maxSize) {
                if (type === 'video') {
                    errMsg = QMCONFIG.errors.videoSize;
                } else {
                    errMsg = QMCONFIG.errors.fileSize;
                }
            }

            if (type === 'video' && fullType !== 'video/mp4') {
                errMsg = 'This video format is not supported, only *.mp4';
            } else if (type === 'audio' && fullType !== 'audio/mp3') {
                if (fullType !== 'audio/mpeg') {
                    errMsg = 'This audio format is not supported, only *.mp3';
                }
            } else if (type === 'file') {
                errMsg = 'This file format isn\'t supported';
            }

            return errMsg;
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function fixScroll() {
        $('.l-chat:visible .j-scrollbar_message').mCustomScrollbar('scrollTo', 'bottom');
    }

    function readMetadata(file) {
        var _URL = window.URL || window.webkitURL,
            metadata = { 'size': file.size },
            type = file.type.indexOf('image/') === 0 ? 'image' :
                   file.type.indexOf('audio/') === 0 ? 'audio' :
                   file.type.indexOf('video/') === 0 ? 'video' : 'file';

        switch (type) {
            case 'image':
                var image = new Image();

                image.src = _URL.createObjectURL(file);
                image.onload = function() {
                    metadata.width = this.width;
                    metadata.height = this.height;
                };
                break;

            case 'audio':
                var audio = new Audio();

                audio.src = _URL.createObjectURL(file);
                audio.onloadedmetadata = function() {
                    metadata.duration = Math.floor(this.duration);
                };
                break;

            case 'video':
                var video = document.createElement('video');

                video.src = _URL.createObjectURL(file);
                video.onloadedmetadata = function() {
                    metadata.width = this.videoWidth;
                    metadata.height = this.videoHeight;
                    metadata.duration = Math.floor(this.duration);
                };
                break;

            default:
                break;
        }

        return metadata;
    }

    return AttachView;

});
