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

  createDataSpinner: function() {
    var spinnerBlock = '<div class="popup-elem spinner_bounce">';
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
    var self = this,
        dialog,
        private_id;

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

          // updating of Contact List whereto are included all people 
          // with which maybe user will be to chat (there aren't only his friends)
          ContactList.add(dialog.occupants_ids, function() {
            // not show dialog if user has not approved this contact
            if (private_id && roster[private_id] === undefined) return false;
              self.addDialogItem(dialog);
          });
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

  addDialogItem: function(dialog) {
    var contacts = ContactList.contacts,
        roster = JSON.parse(sessionStorage['QM.roster']);
        private_id, icon, name, status,
        html, startOfCurrentDay;

    private_id = dialog.type === 3 ? dialog.occupants_ids[0] : null;
    icon = private_id ? contacts[private_id].avatar_url : QMCONFIG.defAvatar.group_url;
    name = private_id ? contacts[private_id].full_name : dialog.room_name;
    status = roster[private_id] || null;

    html = '<li class="list-item" data-dialog="'+dialog.id+'" data-contact="'+private_id+'">';
    html += '<a class="contact l-flexbox" href="#">';
    html += '<div class="l-flexbox_inline">';
    html += '<img class="contact-avatar avatar" src="' + icon + '" alt="user">';
    html += '<span class="name">' + name + '</span>';
    html += '</div>';
    if (status === 'none')
      html += '<span class="status status_request"></span>';
    else
      html += '<span class="status"></span>';
    html += '</a></li>';

    startOfCurrentDay = new Date;
    startOfCurrentDay.setHours(0,0,0,0);

    // checking if this dialog is recent OR no
    if (new Date(dialog.last_message_date_sent * 1000) > startOfCurrentDay)
      $('#recentList').removeClass('is-hidden').find('ul').append(html);
    else
      $('#historyList').removeClass('is-hidden').find('ul').append(html);
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
