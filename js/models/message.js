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
    var User = this.app.models.User;

    return {
      id: params._id || null,
      dialog_id: (params.extension && params.extension.dialog_id) || params.chat_dialog_id,
      body: params.body || params.message || null,
      notification_type: (params.extension && params.extension.notification_type) || params.notification_type || null,
      date_sent: (params.extension && params.extension.date_sent) || params.date_sent,
      read: params.read || false,
      sender_id: params.sender_id || null,
    };
  }

};
