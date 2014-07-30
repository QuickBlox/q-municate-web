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

  prepareDownloading: function(roster) {
    if (QMCONFIG.debug) console.log('QB SDK: Roster has been got', roster);
    this.chatCallbacksInit();
    this.createDataSpinner();
    scrollbar();
    ContactList.saveRoster(roster);
  },

  downloadDialogs: function(roster, ids) {
    var self = this,
        ContactListView = this.app.views.ContactList,
        hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
        notConfirmed,
        private_id,
        dialog;    

    Dialog.download(function(dialogs) {
      self.removeDataSpinner();
      if (dialogs.length > 0) {

        for (var i = 0, len = dialogs.length; i < len; i++) {
          dialog = Dialog.create(dialogs[i]);
          ContactList.dialogs[dialog.id] = dialog;
          // if (QMCONFIG.debug) console.log('Dialog', dialog);

          if (!localStorage['QM.dialog-' + dialog.id]) {
            localStorage.setItem('QM.dialog-' + dialog.id, JSON.stringify({ messages: [] }));
          }

          // updating of Contact List whereto are included all people 
          // with which maybe user will be to chat (there aren't only his friends)
          ContactList.add(dialog.occupants_ids, dialog, function(dialogCallback) {

            // update hidden dialogs
            private_id = dialogCallback.type === 3 ? dialogCallback.occupants_ids[0] : null;
            hiddenDialogs[private_id] = dialogCallback.id;
            ContactList.saveHiddenDialogs(hiddenDialogs);

            // not show dialog if user has not confirmed this contact
            notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {};
            if (private_id && (!roster[private_id] || notConfirmed[private_id]))
              return false;
            
            self.addDialogItem(dialogCallback, true);
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

      // import FB friends
      if (ids) {
        ContactList.getFBFriends(ids, function(new_ids) {
          openPopup($('#popupImport'));
          for (var i = 0, len = new_ids.length; i < len; i++) {
            ContactListView.importFBFriend(new_ids[i]);
          }
        });
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

    html = '<li class="list-item dialog-item presence-listener" data-dialog="'+dialog.id+'" data-id="'+private_id+'">';
    html += '<a class="contact l-flexbox" href="#">';
    html += '<div class="l-flexbox_inline">';
    html += '<img class="contact-avatar avatar" src="' + icon + '" alt="user">';
    html += '<span class="name">' + name + '</span>';
    html += '</div>';
    
    html = getStatus(status, html);

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
  },

  htmlBuild: function(objDom) {
    var html,
        contacts = ContactList.contacts,
        dialogs = ContactList.dialogs,
        roster = JSON.parse(sessionStorage['QM.roster']),
        parent = objDom.parent(),
        dialog_id = parent.data('dialog'),
        user_id = parent.data('id'),
        dialog = dialogs[dialog_id],
        user = contacts[user_id],
        chat = $('.l-chat[data-dialog="'+dialog_id+'"]'),
        jid, icon, name, status;

    // console.log(dialog);
    // console.log(user);

    jid = dialog.room_jid || user.user_jid;
    icon = user_id ? user.avatar_url : QMCONFIG.defAvatar.group_url;
    name = dialog.room_name || user.full_name;
    status = roster[user_id] ? roster[user_id] : null;

    if (chat.length === 0) {
      if (dialog.type === 3)
        html = '<section class="l-workspace l-chat l-chat_private presence-listener" data-dialog="'+dialog_id+'" data-id="'+user_id+'" data-jid="'+jid+'">';
      else
        html = '<section class="l-workspace l-chat l-chat_group is-group" data-dialog="'+dialog_id+'" data-jid="'+jid+'">';

      html += '<header class="l-chat-header l-flexbox l-flexbox_flexbetween">';
      html += '<div class="chat-title">';
      html += '<div class="l-flexbox_inline">';
      
      if (dialog.type === 3)
        html += '<img class="contact-avatar avatar" src="'+icon+'" alt="user">';

      html += '<h2 class="name name_chat" title="'+name+'">'+name+'</h2>';

      if (dialog.type === 3) {
        html = getStatus(status, html);
      } else {
        html += '<span class="triangle triangle_down"></span>';
        html += '<span class="triangle triangle_up is-hidden"></span>';
      }

      html += '</div></div>';
      html += '<div class="chat-controls">';
      // html += '<button class="btn_chat btn_chat_videocall"><img src="images/icon-videocall.png" alt="videocall"></button>';
      // html += '<button class="btn_chat btn_chat_audiocall"><img src="images/icon-audiocall.png" alt="audiocall"></button>';
      html += '<button class="btn_chat btn_chat_add"><img src="images/icon-add.png" alt="add"></button>';
      // html += '<button class="btn_chat btn_chat_profile"><img src="images/icon-profile.png" alt="profile"></button>';
      
      if (dialog.type === 3)
        html += '<button class="btn_chat btn_chat_delete deleteContact"><img src="images/icon-delete.png" alt="delete"></button>';
      else
        html += '<button class="btn_chat btn_chat_delete leaveRoom"><img src="images/icon-delete.png" alt="delete"></button>';
      
      html += '</div></header>';
      html += '<section class="l-chat-content scrollbar_message"></section>';
      html += '<footer class="l-chat-footer">';
      html += '<form class="l-message" action="#">';
      html += '<textarea class="form-input-message textarea" placeholder="Type a message"></textarea>';
      html += '<button class="btn_message btn_message_smile"><img src="images/icon-smile.png" alt="smile"></button>';
      html += '<button class="btn_message btn_message_attach"><img src="images/icon-attach.png" alt="attach"></button>';
      html += '</form></footer>';
      html += '</section>';

      $('.l-workspace-wrap .l-workspace').addClass('is-hidden').parent().append(html);
      textAreaScrollbar();

      if (dialog.type === 3 && (!status || status.subscription === 'none'))
        $('.l-chat:visible').addClass('is-request');
    } else {

      chat.removeClass('is-hidden').siblings().addClass('is-hidden');

    }

    $('.is-selected').removeClass('is-selected');
    parent.addClass('is-selected');
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

function openPopup(objDom) {
  objDom.add('.popups').addClass('is-overlay');
}

function getStatus(status, html) {
  if (!status || status.subscription === 'none')
    html += '<span class="status status_request"></span>';
  else if (status.status)
    html += '<span class="status status_online"></span>';
  else
    html += '<span class="status"></span>';

  return html;
}

function textAreaScrollbar() {
  $('.l-chat:visible .textarea').niceScroll({
    cursoropacitymax: 0.5,
    railpadding: {right: 5}
  });
}
