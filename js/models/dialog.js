/*
 * Q-municate chat application
 *
 * Dialog Module
 *
 */

module.exports = Dialog;

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
        occupants_ids = _.without(params.occupants_ids.split(','), User.contact.id);

    return {
      id: params._id,
      type: params.type,
      room_jid: params.xmpp_room_jid,
      room_name: params.name,
      occupants_ids: occupants_ids,
      last_message_date_sent: params.last_message_date_sent,
      unread_count: params.unread_messages_count
    };
  },

  createPrivateChat: function(jid) {
    var QBApiCalls = this.app.service,
        DialogView = this.app.views.Dialog,
        ContactList = this.app.models.ContactList.contacts,
        User = this.app.models.User,
        id = QB.chat.helpers.getIdFromNode(jid);

    QBApiCalls.createDialog({type: '3', occupants_ids: id}, function(dialog) {
      QB.chat.send(QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId), {type: 'chat', body: 'test message', extension: {
        save_to_history: 1,
        date_sent: Math.floor(Date.now() / 1000),
        full_name: User.contact.full_name,
        blob_id: User.contact.blob_id,
        avatar_url: User.contact.avatar_url
      }});

      ContactList[id] = JSON.parse(sessionStorage['QM.contac-' + id]);
      localStorage.setItem('QM.contact-' + id, JSON.stringify(ContactList[id]));
      DialogView.addDialogItem(dialog);
    });
  }

};
