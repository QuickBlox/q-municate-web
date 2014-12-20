/*
 * Q-municate chat application
 *
 * Dialog Module
 *
 */

define(['config', 'quickblox', 'underscore'], function(QMCONFIG, QB, _) {

  function Dialog(app) {
    this.app = app;
  }

  Dialog.prototype = {

    download: function(callback) {
      var QBApiCalls = this.app.service;

      QBApiCalls.listDialogs({sort_desc: 'last_message_date_sent'}, function(dialogs) {
        callback(dialogs);
      });
    },

    create: function(params) {
      var User = this.app.models.User,
          // exclude current user from dialog occupants that he doesn't hit to yourself in Contact List
          occupants_ids = _.without(params.occupants_ids, User.contact.id);

      return {
        id: params._id,
        type: params.type,
        room_jid: params.xmpp_room_jid || null,
        room_name: params.name || null,
        room_photo: params.photo && params.photo.replace('http://', 'https://') || null,
        occupants_ids: occupants_ids,
        last_message_date_sent: params.last_message_date_sent || null,
        unread_count: params.unread_messages_count || ''
      };
    },

    createPrivate: function(jid, isNew) {
      var QBApiCalls = this.app.service,
          DialogView = this.app.views.Dialog,        
          ContactList = this.app.models.ContactList,
          User = this.app.models.User,
          id = QB.chat.helpers.getIdFromNode(jid),
          self = this,
          dialog;

      QBApiCalls.createDialog({type: 3, occupants_ids: id}, function(res) {
        dialog = self.create(res);
        ContactList.dialogs[dialog.id] = dialog;
        if (QMCONFIG.debug) console.log('Dialog', dialog);

        if (!localStorage['QM.dialog-' + dialog.id]) {
          localStorage.setItem('QM.dialog-' + dialog.id, JSON.stringify({ messages: [] }));
        }

        // send notification about subscribe
        QB.chat.send(jid, {
          type: 'chat',
          body: 'Contact request',
          extension: {
            save_to_history: 1,
            // dialog_id: dialog.id,
            date_sent: Math.floor(Date.now() / 1000),

            notification_type: '4'
          }
        });

        ContactList.add(dialog.occupants_ids, null, function() {
          DialogView.addDialogItem(dialog, null, isNew);
        });
      });
    },

    createGroup: function(occupants_names, params, callback) {
      var QBApiCalls = this.app.service,
          DialogView = this.app.views.Dialog,        
          ContactList = this.app.models.ContactList,
          contacts = ContactList.contacts,
          User = this.app.models.User,
          self = this,
          dialog;

      QBApiCalls.createDialog(params, function(res) {
        dialog = self.create(res);
        ContactList.dialogs[dialog.id] = dialog;
        if (QMCONFIG.debug) console.log('Dialog', dialog);

        if (!localStorage['QM.dialog-' + dialog.id]) {
          localStorage.setItem('QM.dialog-' + dialog.id, JSON.stringify({ messages: [] }));
        }

        QB.chat.muc.join(dialog.room_jid, function() {
          var msgId = QB.chat.helpers.getBsonObjectId();
          
          QB.chat.addListener({name: 'message', type: 'groupchat', id: msgId}, function() {
            DialogView.addDialogItem(dialog);
            callback(dialog);

            // send invites for all occupants
            for (var i = 0, len = dialog.occupants_ids.length, id; i < len; i++) {
              id = dialog.occupants_ids[i];
              QB.chat.send(contacts[id].user_jid, {type: 'chat', body: 'Notification message', extension: {
                dialog_id: dialog.id,
                date_sent: Math.floor(Date.now() / 1000),

                notification_type: '1',
                room_jid: dialog.room_jid,
                room_name: dialog.room_name,
                occupants_ids: res.occupants_ids.join()
              }});
            }
          });

          // send message about added people for history
          QB.chat.send(dialog.room_jid, {id: msgId, type: 'groupchat', body: 'Notification message', extension: {
            save_to_history: 1,
            // dialog_id: dialog.id,
            date_sent: Math.floor(Date.now() / 1000),

            notification_type: '1',
            occupants_ids: res.occupants_ids.join()
          }});          
        });

      });
    },

    updateGroup: function(occupants_names, params, callback) {
      var QBApiCalls = this.app.service,
          DialogView = this.app.views.Dialog,
          ContactList = this.app.models.ContactList,
          contacts = ContactList.contacts,
          User = this.app.models.User,
          self = this,
          dialog, extension;

      QBApiCalls.updateDialog(params.dialog_id, {push_all: {occupants_ids: [params.occupants_ids]}}, function(res) {
        dialog = self.create(res);
        ContactList.dialogs[params.dialog_id] = dialog;
        if (QMCONFIG.debug) console.log('Dialog', dialog);

        var msgId = QB.chat.helpers.getBsonObjectId();
        
        QB.chat.addListener({name: 'message', type: 'groupchat', id: msgId}, function() {
          callback(dialog);

          // send invites for all new occupants
          for (var i = 0, len = params.new_ids.length, id; i < len; i++) {
            id = params.new_ids[i];
            extension = {
              dialog_id: dialog.id,
              date_sent: Math.floor(Date.now() / 1000),

              notification_type: '1',
              room_jid: dialog.room_jid,
              room_name: dialog.room_name,
              occupants_ids: res.occupants_ids.join()
            };

            if (dialog.room_photo) extension.room_photo = dialog.room_photo;

            QB.chat.send(contacts[id].user_jid, {type: 'chat', body: 'Notification message', extension: extension});
          }
        });

        // send message about added people for history
        QB.chat.send(dialog.room_jid, {id: msgId, type: 'groupchat', body: 'Notification message', extension: {
          save_to_history: 1,
          // dialog_id: dialog.id,
          date_sent: Math.floor(Date.now() / 1000),

          notification_type: '2',
          // only new ids
          occupants_ids: params.new_ids.join()
        }});

      });
    },

    changeName: function(dialog_id, name) {
      var QBApiCalls = this.app.service,
          ContactList = this.app.models.ContactList,
          self = this,
          dialog;

      QBApiCalls.updateDialog(dialog_id, {name: name}, function(res) {
        dialog = self.create(res);
        ContactList.dialogs[dialog_id] = dialog;
        if (QMCONFIG.debug) console.log('Dialog', dialog);

        // send notification about updating room
        QB.chat.send(dialog.room_jid, {type: 'groupchat', body: 'Notification message', extension: {
          save_to_history: 1,
          // dialog_id: dialog.id,
          date_sent: Math.floor(Date.now() / 1000),

          notification_type: '2',
          room_name: name,
        }});
      });
    },

    changeAvatar: function(dialog_id, objDom, callback) {
      var QBApiCalls = this.app.service,
          ContactList = this.app.models.ContactList,
          Attach = this.app.models.Attach,
          file = objDom[0].files[0] || null,
          self = this,
          errMsg, dialog;

      if (file) {
        if (file.type.indexOf('image/') === -1)
          errMsg = QMCONFIG.errors.avatarType;
        else if (file.name.length > 100)
          errMsg = QMCONFIG.errors.fileName;

        if (errMsg) {
          console.log(errMsg);
          callback(false);
        } else {

          Attach.crop(file, {w: 40, h: 40}, function(avatar) {
            Attach.upload(avatar, function(blob) {
              QBApiCalls.updateDialog(dialog_id, {photo: blob.path}, function(res) {
                dialog = self.create(res);
                ContactList.dialogs[dialog_id] = dialog;
                if (QMCONFIG.debug) console.log('Dialog', dialog);

                // send notification about updating room
                QB.chat.send(dialog.room_jid, {type: 'groupchat', body: 'Notification message', extension: {
                  save_to_history: 1,
                  // dialog_id: dialog.id,
                  date_sent: Math.floor(Date.now() / 1000),

                  notification_type: '2',
                  room_photo: blob.path,
                }});

                callback(blob.path);
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
      QB.chat.send(dialog.room_jid, {type: 'groupchat', body: 'Notification message', extension: {
        save_to_history: 1,
        // dialog_id: dialog.id,
        date_sent: Math.floor(Date.now() / 1000),

        notification_type: '2',
        deleted_id: User.contact.id
      }});

      QBApiCalls.updateDialog(dialog.id, {pull_all: {occupants_ids: [User.contact.id]}}, function() {
        // QB.chat.muc.leave(dialog.room_jid, function() {});
      });
      
      callback();
    }

  };

  return Dialog;

});
