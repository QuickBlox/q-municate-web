/*
 * Q-municate chat application
 *
 * Dialog View Module
 *
 */

module.exports = DialogView;

var Dialog, ContactList;

function DialogView(app) {
  this.app = app;
  Dialog = this.app.models.Dialog;
  ContactList = this.app.models.ContactList;
}

DialogView.prototype = {

  // QBChat handlers
  chatCallbacksInit: function() {
    var ContactListView = this.app.views.ContactList;

    QB.chat.onMessageListener = this.onMessage;
    QB.chat.onContactListListener = ContactListView.onPresence;
    QB.chat.onSubscribeListener = ContactListView.onSubscribe;
    QB.chat.onConfirmSubscribeListener = ContactListView.onConfirm;
    QB.chat.onRejectSubscribeListener = ContactListView.onReject;
    // <span class="unread">4</span>
  },

  createDataSpinner: function() {
    var spinnerBlock = '<div class="popup-elem spinner_bounce is-empty">';
    spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
    spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
    spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
    spinnerBlock += '</div>';

    $('#emptyList').after(spinnerBlock);
  },

  removeDataSpinner: function() {
    $('.l-sidebar .spinner_bounce').remove();
  },

  downloadDialogs: function(roster) {
    if (QMCONFIG.debug) console.log('QB SDK: Roster has been got', roster);
    this.chatCallbacksInit();

    var self = this,
        hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
        notConfirmed,
        private_id,
        dialog;

    scrollbar();
    self.createDataSpinner();
    ContactList.saveRoster(roster);

    Dialog.download(function(dialogs) {
      self.removeDataSpinner();
      if (dialogs.length > 0) {

        for (var i = 0, len = dialogs.length; i < len; i++) {
          dialog = Dialog.create(dialogs[i]);
          if (QMCONFIG.debug) console.log('Dialog', dialog);

          private_id = dialog.type === 3 ? dialog.occupants_ids[0] : null;
          if (!localStorage['QM.dialog-' + dialog.id]) {
            localStorage.setItem('QM.dialog-' + dialog.id, JSON.stringify({ messages: [] }));
          }

          // update hidden dialogs
          hiddenDialogs[private_id] = dialog.id;
          ContactList.saveHiddenDialogs(hiddenDialogs);

          // updating of Contact List whereto are included all people 
          // with which maybe user will be to chat (there aren't only his friends)
          ContactList.add(dialog.occupants_ids, function() {

            // not show dialog if user has not confirmed this contact
            notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {};
            if (private_id && (!roster[private_id] || notConfirmed[private_id])) return false;
            
            self.addDialogItem(dialog, true);
          });
        }

        if ($('#requestsList').is('.is-hidden') &&
            $('#recentList').is('.is-hidden') &&
            $('#historyList').is('.is-hidden')) {
          
          $('#emptyList').removeClass('is-hidden');
        }

      } else {
        $('#emptyList').removeClass('is-hidden');
      }
    });
  },

  hideDialogs: function() {
    $('.l-list').addClass('is-hidden');
    $('.l-list ul').html('');
  },

  addDialogItem: function(dialog, isDownload) {
    var contacts = ContactList.contacts,
        roster = JSON.parse(sessionStorage['QM.roster']),
        private_id, icon, name, status,
        html, startOfCurrentDay;

    private_id = dialog.type === 3 ? dialog.occupants_ids[0] : null;
    icon = private_id ? contacts[private_id].avatar_url : QMCONFIG.defAvatar.group_url;
    name = private_id ? contacts[private_id].full_name : dialog.room_name;
    status = roster[private_id] ? roster[private_id] : null;

    html = '<li class="list-item dialog-item" data-dialog="'+dialog.id+'" data-id="'+private_id+'">';
    html += '<a class="contact l-flexbox" href="#">';
    html += '<div class="l-flexbox_inline">';
    html += '<img class="contact-avatar avatar" src="' + icon + '" alt="user">';
    html += '<span class="name">' + name + '</span>';
    html += '</div>';
    
    if (!status || status.subscription === 'none')
      html += '<span class="status status_request"></span>';
    else if (status.status)
      html += '<span class="status status_online"></span>';
    else
      html += '<span class="status"></span>';

    html += '</a></li>';

    startOfCurrentDay = new Date;
    startOfCurrentDay.setHours(0,0,0,0);

    // checking if this dialog is recent OR no
    if (!dialog.last_message_date_sent || new Date(dialog.last_message_date_sent * 1000) > startOfCurrentDay) {
      if (isDownload)
        $('#recentList').removeClass('is-hidden').find('ul').append(html);
      else
        $('#recentList').removeClass('is-hidden').find('ul').prepend(html);
    } else {
      $('#historyList').removeClass('is-hidden').find('ul').append(html);
    }

    $('#emptyList').addClass('is-hidden');
  },

  onMessage: function(id, message) {
    var hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
        notification_type = message.extension && message.extension.notification_type,
        dialog_id = message.extension && message.extension.dialog_id;

    // subscribe message
    if (notification_type === '3') {
      // update hidden dialogs
      hiddenDialogs[id] = dialog_id;
      ContactList.saveHiddenDialogs(hiddenDialogs);
    }
  }

};

/* Private
---------------------------------------------------------------------- */
function scrollbar() {
  $('.l-sidebar .scrollbar').mCustomScrollbar({
    theme: 'minimal-dark',
    scrollInertia: 150
  });
}
