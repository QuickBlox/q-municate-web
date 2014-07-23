/*
 * Q-municate chat application
 *
 * Dialog Module
 *
 */

module.exports = Dialog;

var User, ids;

function Dialog(app) {
  this.app = app;
}

Dialog.prototype = {

  create: function(params) {
    User = this.app.models.User;
    ids = _.without(params.occupants_ids.split(','), User.id);

    return {
      id: params._id,
      type: params.type,
      room_jid: params.xmpp_room_jid,
      room_name: params.name,
      occupants_ids: ids,
      last_message_date_sent: params.last_message_date_sent,
      unread_count: params.unread_messages_count,
      contact_id: getContact(params)
    };
  },

  createPrivateChat: function(jid) {
    var QBApiCalls = this.app.service,
        DialogView = this.app.views.Dialog,
        FriendList = this.app.models.FriendList.contacts,
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

      FriendList[id] = JSON.parse(sessionStorage['QM.contac-' + id]);
      localStorage.setItem('QM.contact-' + id, JSON.stringify(FriendList[id]));
      DialogView.addDialogItem(dialog);
    });
  }

};

/* Private
---------------------------------------------------------------------- */
function getContact(dialog) {
  return dialog.type === 3 ? ids : null;
}
