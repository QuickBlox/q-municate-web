/*
 * Q-municate chat application
 *
 * Dialog View Module
 *
 */

module.exports = DialogView;

var startOfCurrentDay = new Date;
startOfCurrentDay.setHours(0,0,0,0);

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
    var QBApiCalls = this.app.service;
    console.log(0);
    var FriendList = this.app.models.FriendList.contacts,
        Contact = this.app.models.Contact,
        Dialog = this.app.models.Dialog,
        contact_ids, ids = [],
        self = this,
        dialog,
        params;

    scrollbar();
    console.log(1);
    contact_ids = localStorage['QM.contacts'] && localStorage['QM.contacts'].split(',') || [];
    console.log(2);
    self.createDataSpinner();
    QBApiCalls.listDialogs({sort_desc: 'last_message_date_sent'}, function(dialogs) {
      self.removeDataSpinner();

      if (dialogs.length > 0) {
        for (var i = 0, len = dialogs.length; i < len; i++) {
          dialog = Dialog.create(dialogs[i]);

          ids.concat(_.difference(dialog.occupants_ids, contact_ids));
          localStorage.setItem('QM.contacts', contact_ids.concat(ids).join());

          if (ids.length > 0) {
            params = { filter: { field: 'id', param: 'in', value: ids } };
            QBApiCalls.listUsers(params, function(users) {
              users.items.forEach(function(user) {
                FriendList[user.id] = Contact.create(user);
                FriendList[user.id].subscription = contacts[user.id] || 'none';
                localStorage.setItem('QM.contact-' + user.id, JSON.stringify(FriendList[user.id]));
              });
            });
            self.addDialogItem(dialog);
          } else {
            self.addDialogItem(dialog);
          }
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
    var FriendList = this.app.models.FriendList.contacts,
        icon = dialog.type === 3 ? FriendList[dialog.contact_id].avatar_url : QMCONFIG.defAvatar.group_url,
        name = dialog.type === 3 ? FriendList[dialog.contact_id].full_name : dialog.name,
        status = dialog.type === 3 ? FriendList[dialog.contact_id].subscription : 'none',
        html;

    html = '<li class="list-item" data-dialog="'+dialog.id+'" data-contact="'+dialog.contact_id+'">';
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

    if (new Date(dialog.last_message_date_sent * 1000) > startOfCurrentDay)
      $('#recentList').removeClass('is-hidden').find('ul').append(html);
    else
      $('#historyList').removeClass('is-hidden').find('ul').append(html);
  }

};

/* Private
---------------------------------------------------------------------- */
function scrollbar() {
  $('aside .scrollbar').mCustomScrollbar({
    theme: 'minimal-dark',
    scrollInertia: 150
  });
}
