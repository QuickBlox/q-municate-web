/*
 * Q-municate chat application
 *
 * Message Module
 *
 */

module.exports = Message;

function Message(app) {
  this.app = app;
  this.skip = {};
}

Message.prototype = {

  download: function(dialog_id, callback, count) {
    var QBApiCalls = this.app.service,
        self = this;

    if (self.skip[dialog_id] && self.skip[dialog_id] === count) return false;

    QBApiCalls.listMessages({chat_dialog_id: dialog_id, sort_desc: 'date_sent', limit: 50, skip: count || 0}, function(messages) {
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
      occupants_ids: (params.extension && params.extension.occupants_ids) || params.occupants_ids || null,
      room_name: (params.extension && params.extension.room_name) || params.room_name || null,
      room_photo: (params.extension && params.extension.room_photo) || params.room_photo || null,
    };

    if (message.attachment) {
      message.attachment.id = parseInt(message.attachment.id);
      message.attachment.size = parseInt(message.attachment.size);
    }

    return message;
  },

  update: function(message_id, dialog_id) {
    var QBApiCalls = this.app.service;

    QBApiCalls.updateMessage(message_id, {chat_dialog_id: dialog_id, read: 1}, function() {
      
    });
  }

};
