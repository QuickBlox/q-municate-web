/*
 * Q-municate chat application
 *
 * Message Module
 *
 */

module.exports = Message;

function Message(app) {
  this.app = app;
}

Message.prototype = {

  download: function(dialog_id, callback) {
    var QBApiCalls = this.app.service;

    QBApiCalls.listMessages({chat_dialog_id: dialog_id, sort_desc: 'date_sent', limit: 50}, function(messages) {
      callback(messages);
    });
  },

  create: function(params) {
    var User = this.app.models.User;

    return {
      id: params._id,
      dialog_id: params.chat_dialog_id,
      body: params.message || null,
      notification_type: params.notification_type || null,
      date_sent: params.date_sent,
      read: params.read,
      sender_id: params.sender_id,
    };
  }

};
