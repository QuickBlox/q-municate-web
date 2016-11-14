/*
 * Q-municate chat application
 *
 * Dialog Module
 *
 */
define([
    'config',
    'quickblox',
    'underscore',
    'Helpers',
    'Entities'
], function(
    QMCONFIG,
    QB,
    _,
    Helpers,
    Entities
) {

    function Dialog(app) {
        this.app = app;
    }

    Dialog.prototype = {

        download: function(callback) {
            var QBApiCalls = this.app.service;

            QBApiCalls.listDialogs({
                sort_desc: 'last_message_date_sent'
            }, function(dialogs) {
                callback(dialogs);
            });
        },

        create: function(params) {
            var User = this.app.models.User,
                time = Math.floor(Date.now() / 1000),
                // exclude current user from dialog occupants that he doesn't hit to yourself in Contact List
                occupants_ids = _.chain(params.occupants_ids)
                                .without(params.occupants_ids, User.contact.id)
                                .uniq(occupants_ids)
                                .value(),
                dialog = {
                    id: params._id,
                    type: params.type,
                    room_jid: params.xmpp_room_jid || null,
                    room_name: params.name || null,
                    room_photo: params.photo && params.photo.replace('http://', 'https://') || '',
                    occupants_ids: occupants_ids,
                    last_message: params.last_message || ((params.type === 2) ? 'Notification message' : 'Contact request'),
                    last_message_date_sent: params.last_message_date_sent || time,
                    room_updated_date: Date.parse(params.updated_at) || params.room_updated_date || time,
                    unread_count: params.unread_messages_count || '',
                    unread_messages: new Entities.Collections.UnreadMessages(),
                    messages: new Entities.Collections.Messages(),
                    opened: params.opened || false
                };

            new Entities.Models.Dialog(dialog);

            return dialog.id;
        },

        createPrivate: function(jid, isNew, dialog_id) {
            var QBApiCalls = this.app.service,
                DialogView = this.app.views.Dialog,
                ContactList = this.app.models.ContactList,
                User = this.app.models.User,
                id = QB.chat.helpers.getIdFromNode(jid),
                self = this;

            if (dialog_id) {
                QB.chat.dialog.list({ _id: dialog_id }, function(err, resDialogs) {
                    addContactRequestDialogItem(resDialogs.items[0]);
                });
            } else {
                QBApiCalls.createDialog({
                    type: 3,
                    occupants_ids: id
                }, function(res) {
                    addContactRequestDialogItem(res, true);
                });
            }

            function addContactRequestDialogItem(objDialog, isClick) {
                var dialogId = self.create(objDialog),
                    dialogs = Entities.Collections.dialogs,
                    dialog = dialogs.get(dialogId).toJSON();

                Helpers.log('Dialog', dialog);

                // send notification about subscribe
                if (isClick) {
                    QB.chat.send(jid, {
                        type: 'chat',
                        body: 'Contact request',
                        extension: {
                            recipient_id: id,
                            date_sent: Math.floor(Date.now() / 1000),
                            dialog_id: dialog.id,
                            save_to_history: 1,
                            notification_type: '4'
                        }
                    });
                }

                ContactList.add(dialog.occupants_ids, null, function() {
                    DialogView.addDialogItem(dialog, null, isNew);
                });
            }
        },

        createGroup: function(occupants_names, params, callback) {
            var QBApiCalls = this.app.service,
                DialogView = this.app.views.Dialog,
                ContactList = this.app.models.ContactList,
                contacts = ContactList.contacts,
                User = this.app.models.User,
                self = this;

            QBApiCalls.createDialog(params, function(res) {
                var dialogId = self.create(res),
                    dialogs = Entities.Collections.dialogs,
                    dialog = dialogs.get(dialogId).toJSON();

                Helpers.log('Dialog', dialog);

                QB.chat.muc.join(dialog.room_jid, function() {
                    var msgId = QB.chat.helpers.getBsonObjectId(),
                        time = Math.floor(Date.now() / 1000);

                    QB.chat.addListener({
                        name: 'message',
                        type: 'groupchat',
                        id: msgId
                    }, function() {
                        DialogView.addDialogItem(dialog);
                        callback(dialog);

                        // send invites for all occupants
                        for (var i = 0, len = dialog.occupants_ids.length, id; i < len; i++) {
                            id = dialog.occupants_ids[i];
                            QB.chat.sendSystemMessage(contacts[id].user_jid, {
                                body: 'Notification message',
                                extension: {
                                    date_sent: time,
                                    notification_type: '1',
                                    dialog_id: dialog.id,
                                    room_name: dialog.room_name,
                                    room_updated_date: time,
                                    current_occupant_ids: res.occupants_ids.join(),
                                    type: 2
                                }
                            });
                        }
                    });

                    // send message about added people for history
                    QB.chat.send(dialog.room_jid, {
                        id: msgId,
                        type: 'groupchat',
                        body: 'Notification message',
                        extension: {
                            message_id: msgId,
                            date_sent: time,
                            save_to_history: 1,
                            notification_type: '2',
                            dialog_id: dialog.id,
                            room_updated_date: time,
                            current_occupant_ids: res.occupants_ids.join(),
                            added_occupant_ids: params.occupants_ids,
                            dialog_update_info: 3
                        }
                    });

                });

            });
        },

        updateGroup: function(occupants_names, params, callback) {
            var QBApiCalls = this.app.service,
                DialogView = this.app.views.Dialog,
                ContactList = this.app.models.ContactList,
                contacts = ContactList.contacts,
                User = this.app.models.User,
                self = this;

            QBApiCalls.updateDialog(params.dialog_id, {
                push_all: {
                    occupants_ids: [params.occupants_ids]
                }
            }, function(res) {
                var dialogId = self.create(res),
                    dialogs = Entities.Collections.dialogs,
                    dialog = dialogs.get(dialogId).toJSON();

                Helpers.log('Dialog', dialog);

                var msgId = QB.chat.helpers.getBsonObjectId();

                QB.chat.addListener({
                    name: 'message',
                    type: 'groupchat',
                    id: msgId
                }, function() {
                    callback(dialog);

                    // send invites for all new occupants
                    for (var i = 0, len = params.new_ids.length, id; i < len; i++) {
                        id = params.new_ids[i];
                        QB.chat.sendSystemMessage(contacts[id].user_jid, {
                            body: 'Notification message',
                            extension: {
                                date_sent: Math.floor(Date.now() / 1000),
                                notification_type: '1',
                                dialog_id: dialog.id,
                                room_name: dialog.room_name,
                                room_photo: dialog.room_photo,
                                room_updated_date: Math.floor(Date.now() / 1000),
                                current_occupant_ids: res.occupants_ids.join(),
                                type: 2
                            }
                        });
                    }
                });

                // send message about added people for history
                QB.chat.send(dialog.room_jid, {
                    id: msgId,
                    type: 'groupchat',
                    body: 'Notification message',
                    extension: {
                        date_sent: Math.floor(Date.now() / 1000),
                        save_to_history: 1,
                        notification_type: '2',
                        current_occupant_ids: res.occupants_ids.join(),
                        added_occupant_ids: params.new_ids.join(),
                        dialog_id: dialog.id,
                        room_updated_date: dialog.room_updated_date,
                        dialog_update_info: 3
                    }
                });

            });
        },

        changeName: function(dialog_id, name) {
            var QBApiCalls = this.app.service,
                ContactList = this.app.models.ContactList,
                self = this;

            QBApiCalls.updateDialog(dialog_id, {
                name: name
            }, function(res) {
                var dialogId = self.create(res),
                    dialogs = Entities.Collections.dialogs,
                    dialog = dialogs.get(dialogId).toJSON();

                Helpers.log('Dialog', dialog);

                // send notification about updating room
                QB.chat.send(dialog.room_jid, {
                    type: 'groupchat',
                    body: 'Notification message',
                    extension: {
                        date_sent: Math.floor(Date.now() / 1000),
                        save_to_history: 1,
                        notification_type: '2',
                        room_name: name,
                        dialog_id: dialog.id,
                        room_updated_date: dialog.room_updated_date,
                        dialog_update_info: 2
                    }
                });
            });
        },

        changeAvatar: function(dialog_id, objDom, callback) {
            var QBApiCalls = this.app.service,
                ContactList = this.app.models.ContactList,
                Attach = this.app.models.Attach,
                AttachView = this.app.views.Attach,
                file = objDom[0].files[0] || null,
                self = this,
                errMsg;

            if (file) {
                if (file.type.indexOf('image/') === -1) {
                    errMsg = QMCONFIG.errors.avatarType;
                } else if (file.name.length > 100) {
                    errMsg = QMCONFIG.errors.fileName;
                }

                if (errMsg) {
                    Helpers.log('Error', errMsg);
                    AttachView.pastErrorMessage(errMsg, objDom, $('.l-chat:visible .l-chat-content .mCSB_container'));
                    callback(false);
                } else {
                    Attach.crop(file, {
                        w: 1000,
                        h: 1000
                    }, function(avatar) {
                        Attach.upload(avatar, function(blob) {
                            var imgUrl = QB.content.publicUrl(blob.uid);

                            QBApiCalls.updateDialog(dialog_id, {
                                photo: imgUrl
                            }, function(res) {
                                var dialogId = self.create(res),
                                    dialogs = Entities.Collections.dialogs,
                                    dialog = dialogs.get(dialogId).toJSON();

                                Helpers.log('Dialog', dialog);

                                // send notification about updating room
                                QB.chat.send(dialog.room_jid, {
                                    type: 'groupchat',
                                    body: 'Notification message',
                                    extension: {
                                        date_sent: Math.floor(Date.now() / 1000),
                                        save_to_history: 1,
                                        notification_type: '2',
                                        room_photo: imgUrl,
                                        dialog_id: dialog.id,
                                        room_updated_date: dialog.room_updated_date,
                                        dialog_update_info: 1
                                    }
                                });

                                callback(imgUrl);
                            });
                        });
                    });

                }
            } else {
                callback(false);
            }
        },

        leaveChat: function(dialog, callback) {
            var QBApiCalls = this.app.service,
                User = this.app.models.User,
                self = this;

            // send notification about leave
            QB.chat.send(dialog.room_jid, {
                type: 'groupchat',
                body: 'Notification message',
                extension: {
                    date_sent: Math.floor(Date.now() / 1000),
                    save_to_history: 1,
                    notification_type: '2',
                    current_occupant_ids: dialog.occupants_ids.join(),
                    deleted_occupant_ids: User.contact.id,
                    dialog_id: dialog.id,
                    room_updated_date: '',
                    dialog_update_info: 3
                }
            });

            QBApiCalls.updateDialog(dialog.id, {
                pull_all: {
                    occupants_ids: [User.contact.id]
                }
            }, function() {
                // QB.chat.muc.leave(dialog.room_jid, function() {});
            });

            callback();
        }

    };

    return Dialog;

});
