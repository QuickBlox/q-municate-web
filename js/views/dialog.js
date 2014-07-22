/*
 * Q-municate chat application
 *
 * Dialog View Module
 *
 */

module.exports = DialogView;

function DialogView(app) {
  this.app = app;
}

DialogView.prototype = {

  createDataSpinner: function() {
    var spinnerBlock = '<div class="popup-elem spinner_bounce">';
    spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
    spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
    spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
    spinnerBlock += '</div>';

    $('#emptyList').after(spinnerBlock);
  },

  removeDataSpinner: function() {
    $('.l-list-wrap .spinner_bounce').remove();
  },

  downloadDialogs: function(contacts) {
    var QBApiCalls = this.app.service,
        User = this.app.models.User,
        self = this;

    // QB.chat.send(QB.chat.helpers.getUserJid(1316834, QMCONFIG.qbAccount.appId), {type: 'chat', body: 'test message', extension: {
    //   save_to_history: 1,
    //   date_sent: Math.floor(Date.now() / 1000),
    //   full_name: User.contact.full_name,
    //   blob_id: User.contact.blob_id,
    //   avatar_url: User.contact.avatar_url
    // }});

    console.log(Object.keys(contacts).length);
    console.log(contacts);
    
    self.createDataSpinner();
    QBApiCalls.listDialogs({sort_desc: 'last_message_date_sent'}, function(dialogs) {
      self.removeDataSpinner();

      if (dialogs.length > 0) {
        for (var i = 0, len = dialogs.length; i < len; i++) {
          self.addDialogItem(dialogs[i]);
        }        
      } else {
        $('#emptyList').removeClass('is-hidden');
      }
    });
  },

  hideDialogs: function() {
    $('.l-list').addClass('is-hidden');
  },

  addDialogItem: function(params) {
    var Dialog = this.app.models.Dialog,
        dialog;

    dialog = Dialog.create(params);
  }

};
