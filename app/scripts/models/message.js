/*
 * Q-municate chat application
 *
 * Message Module
 *
 */

define(['quickblox'], function(QB) {

  function Message(app) {
    this.app = app;
    this.skip = {};
  }

  Message.prototype = {

    download: function(dialog_id, callback, count, isAjaxDownloading) {
      var QBApiCalls = this.app.service,
          DialogView = this.app.views.Dialog,
          self = this;

      if (self.skip[dialog_id] && self.skip[dialog_id] === count) return false;

      if (isAjaxDownloading) DialogView.createDataSpinner(null, null, true);

      QBApiCalls.listMessages({chat_dialog_id: dialog_id, sort_desc: 'date_sent', limit: 50, skip: count || 0}, function(messages) {
        if (isAjaxDownloading) DialogView.removeDataSpinner();
        callback(messages);
        self.skip[dialog_id] = count;
      });
    },

    create: function(params) {
      var User = this.app.models.User,
          message;
          
      message = {
        id: (params.extension && params.extension.message_id) || params._id || null,
        dialog_id: (params.extension && params.extension.dialog_id) || params.chat_dialog_id,
        body: params.body || params.message || null,
        notification_type: (params.extension && params.extension.notification_type) || params.notification_type || null,
        date_sent: (params.extension && params.extension.date_sent) || params.date_sent,
        read: params.read || false,
        attachment: (params.extension && params.extension.attachments && params.extension.attachments[0]) || (params.attachments && params.attachments[0]) || params.attachment || null,
        sender_id: params.sender_id || null,
        recipient_id: params.recipient_id || null,
        current_occupant_ids: (params.extension && params.extension.current_occupant_ids) || params.current_occupant_ids || null,
        added_occupant_ids: (params.extension && params.extension.added_occupant_ids) || params.added_occupant_ids || null,
        deleted_occupant_ids: (params.extension && params.extension.deleted_occupant_ids) || params.deleted_occupant_ids || null,
        room_name: (params.extension && params.extension.room_name) || params.room_name || null,
        room_photo: (params.extension && params.extension.room_photo && params.extension.room_photo.replace('http://', 'https://')) ||
                    (params.room_photo && params.room_photo.replace('http://', 'https://')) || null,
        room_updated_date: (params.extension && params.extension.room_updated_date) || params.room_updated_date || null,
        dialog_update_info: (params.extension && params.extension.dialog_update_info) || params.dialog_update_info || null,
        callType: (params.extension && params.extension.callType) || params.callType || null,
        callState: (params.extension && params.extension.callState) || params.callState || null,
        caller: parseInt((params.extension && params.extension.caller)) || parseInt(params.caller) || null,
        callee: parseInt((params.extension && params.extension.callee)) || parseInt(params.callee) || null,
        duration: (params.extension && params.extension.duration) || params.duration || null,
        sessionID: (params.extension && params.extension.sessionID) || params.sessionID || null,
        read_ids: params.read_ids || [],
        delivered_ids: params.delivered_ids || [],
        type: params.type || null,
        stack: false,
        latitude: (params.extension && params.extension.latitude) || params.latitude || null,
        longitude: (params.extension && params.extension.longitude) || params.longitude || null
      };

      if (message.attachment) {
        message.attachment.size = parseInt(message.attachment.size);
      }

      return message;
    },

    isStack: function(online, curMsg, prevMsg) {
      var sameUser, sameTime,
          stack = false;

      if (prevMsg) {
        if (online) {
          var lastMessageSender = +prevMsg.attr('data-id'),
              lastMessageDateSent = +prevMsg.find('.message-time').attr('data-time');

          sameUser = (curMsg.sender_id === lastMessageSender) ? true : false;
          sameTime = (Math.floor(curMsg.date_sent / 60) === Math.floor(lastMessageDateSent / 60)) ? true : false;
        } else {
          sameUser = (curMsg.sender_id === prevMsg.sender_id) ? true : false;
          sameTime = (Math.floor(curMsg.date_sent / 60) === Math.floor(prevMsg.date_sent / 60)) ? true : false;
        }
        stack = (sameTime && sameUser) ? true : false;
      }

      return stack;
    },

    update: function(message_ids, dialog_id, user_id) {
      var QBApiCalls = this.app.service,
          ContactList = this.app.models.ContactList,
          dialog = ContactList.dialogs[dialog_id],
          unreadMessages = message_ids.split(','),
          unreadMessage;

      for (var i = 0, len = unreadMessages.length; i < len; i++) {
        unreadMessage = unreadMessages[i];
        QB.chat.sendReadStatus({messageId: unreadMessage, userId: user_id, dialogId: dialog_id});
      }
      
      dialog.messages = [];

      QBApiCalls.updateMessage(message_ids, {chat_dialog_id: dialog_id, read: 1}, function() {});
    }

  };

  return Message;

});
