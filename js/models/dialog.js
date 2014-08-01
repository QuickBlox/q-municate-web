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
        occupants_ids = _.without(params.occupants_ids, User.contact.id);

    return {
      id: params._id,
      type: params.type,
      room_jid: params.xmpp_room_jid || null,
      room_name: params.name || null,
      occupants_ids: occupants_ids,
      last_message_date_sent: params.last_message_date_sent || null,
      unread_count: params.unread_messages_count || ''
    };
  },

  createPrivate: function(jid) {
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
      QB.chat.send(jid, {type: 'chat', extension: {
        save_to_history: 1,
        dialog_id: dialog.id,
        date_sent: Math.floor(Date.now() / 1000),

        notification_type: '3',
        full_name: User.contact.full_name,
      }});

      ContactList.add(dialog.occupants_ids, null, function() {
        DialogView.addDialogItem(dialog);
      });
    });
  }

};
