/*
 * Q-municate chat application
 *
 * Dialog View Module
 *
 */

module.exports = DialogView;

var User, Dialog, Message, ContactList;

function DialogView(app) {
  this.app = app;
  User = this.app.models.User;
  Dialog = this.app.models.Dialog;
  Message = this.app.models.Message;
  ContactList = this.app.models.ContactList;
}

DialogView.prototype = {

  // QBChat handlers
  chatCallbacksInit: function() {
    var ContactListView = this.app.views.ContactList,
        MessageView = this.app.views.Message;

    QB.chat.onMessageListener = MessageView.onMessage;
    QB.chat.onContactListListener = ContactListView.onPresence;
    QB.chat.onSubscribeListener = ContactListView.onSubscribe;
    QB.chat.onConfirmSubscribeListener = ContactListView.onConfirm;
    QB.chat.onRejectSubscribeListener = ContactListView.onReject;
    QB.chat.onDisconnectingListener = function() {
      $('.no-connection').removeClass('is-hidden');
    };
  },

  createDataSpinner: function(chat, groupchat) {
    var spinnerBlock;
    if (groupchat)
      spinnerBlock = '<div class="popup-elem spinner_bounce is-creating">';
    else
      spinnerBlock = '<div class="popup-elem spinner_bounce is-empty">';
    spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
    spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
    spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
    spinnerBlock += '</div>';

    if (chat) {
      $('.l-chat:visible').find('.l-chat-content').append(spinnerBlock);
    } else if (groupchat) {
      $('#popupContacts .btn_popup').addClass('is-hidden');
      $('#popupContacts .popup-footer').append(spinnerBlock);
      $('#popupContacts .popup-footer').after('<div class="temp-box"></div>');
    } else {
      $('#emptyList').after(spinnerBlock);
    }
  },

  removeDataSpinner: function() {
    $('.spinner_bounce, .temp-box').remove();
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

          if (dialog.type === 2) QB.chat.muc.join(dialog.room_jid);

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
    
    if (dialog.type === 3)
      html = getStatus(status, html);
    else
      html += '<span class="status"></span>';

    html += '<span class="unread">'+dialog.unread_count+'</span>';

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

  htmlBuild: function(objDom) {
    var MessageView = this.app.views.Message,
        contacts = ContactList.contacts,
        dialogs = ContactList.dialogs,
        roster = JSON.parse(sessionStorage['QM.roster']),
        parent = objDom.parent(),
        dialog_id = parent.data('dialog'),
        user_id = parent.data('id'),
        dialog = dialogs[dialog_id],
        user = contacts[user_id],
        chat = $('.l-chat[data-dialog="'+dialog_id+'"]'),
        html, jid, icon, name, status, message,
        self = this;

    // if (QMCONFIG.debug) console.log(dialog);
    // if (QMCONFIG.debug) console.log(user);

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

      if (dialog.type === 3)
        html += '<div class="l-flexbox_inline">';
      else
        html += '<div class="l-flexbox_inline groupTitle">';
      
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
      if (dialog.type === 3)
        html += '<button class="btn_chat btn_chat_add createGroupChat" data-ids="'+dialog.occupants_ids.join()+'"><img src="images/icon-add.png" alt="add"></button>';
      else
        html += '<button class="btn_chat btn_chat_add addToGroupChat" data-ids="'+dialog.occupants_ids.join()+'" data-dialog="'+dialog_id+'"><img src="images/icon-add.png" alt="add"></button>';
      // html += '<button class="btn_chat btn_chat_profile"><img src="images/icon-profile.png" alt="profile"></button>';
      
      if (dialog.type === 3)
        html += '<button class="btn_chat btn_chat_delete deleteContact"><img src="images/icon-delete.png" alt="delete"></button>';
      else
        html += '<button class="btn_chat btn_chat_delete leaveChat"><img src="images/icon-delete.png" alt="delete"></button>';
      
      html += '</div>';

      // build occupants of room
      if (dialog.type === 2) {
        html += '<div class="chat-occupants-wrap">';
        html += '<div class="chat-occupants">';
        for (var i = 0, len = dialog.occupants_ids.length, id; i < len; i++) {
          id = dialog.occupants_ids[i];
          if (id != User.contact.id) {
            html += '<a class="occupant l-flexbox_inline presence-listener" data-id="'+id+'" href="#">';

            html = getStatus(roster[id], html);

            html += '<span class="name name_occupant">'+contacts[id].full_name+'</span>';
            html += '</a>';
          }
        }
        html += '</div></div>';
      }

      html += '</header>';
      html += '<section class="l-chat-content scrollbar_message"></section>';
      html += '<footer class="l-chat-footer">';
      html += '<form class="l-message" action="#">';
      html += '<div class="form-input-message textarea" contenteditable="true" placeholder="Type a message"></div>';
      // html += '<textarea class="text-message is-hidden"></textarea>';
      html += '<button class="btn_message btn_message_smile"><img src="images/icon-smile.png" alt="smile"></button>';
      html += '<button class="btn_message btn_message_attach"><img src="images/icon-attach.png" alt="attach"></button>';
      html += '<input class="attachment" type="file">';
      html += '</form></footer>';
      html += '</section>';

      $('.l-workspace-wrap .l-workspace').addClass('is-hidden').parent().append(html);
      textAreaScrollbar();

      if (dialog.type === 3 && (!status || status.subscription === 'none'))
        $('.l-chat:visible').addClass('is-request');

      self.createDataSpinner(true);
      Message.download(dialog_id, function(messages) {
        self.removeDataSpinner();
        for (var i = 0, len = messages.length; i < len; i++) {
          message = Message.create(messages[i]);
          // if (QMCONFIG.debug) console.log(message);
          MessageView.addItem(message);
        }
        self.messageScrollbar();
      });

    } else {

      chat.removeClass('is-hidden').siblings().addClass('is-hidden');
      $('.l-chat:visible .scrollbar_message').mCustomScrollbar('destroy');
      self.messageScrollbar();

    }

    $('.is-selected').removeClass('is-selected');
    parent.addClass('is-selected').find('.unread').text('');
    
  },

  messageScrollbar: function() {
    var objDom = $('.l-chat:visible .scrollbar_message'),
        height = objDom[0].scrollHeight,
        self = this;

    objDom.mCustomScrollbar({
      theme: 'minimal-dark',
      scrollInertia: 150,
      setTop: height + 'px',
      callbacks: {
        onTotalScrollBack: function() {
          ajaxDownloading(objDom, self);
        },
        alwaysTriggerOffsets: false
      }
    });
  },

  createGroupChat: function(type, dialog_id) {
    var contacts = ContactList.contacts,
        new_members = $('#popupContacts .is-chosen'),
        occupants_ids = $('#popupContacts').data('existing_ids') || [],
        groupName = occupants_ids.length > 0 ? [ User.contact.full_name, contacts[occupants_ids[0]].full_name ] : [User.contact.full_name],
        occupants_names = !type && occupants_ids.length > 0 ? [ contacts[occupants_ids[0]].full_name ] : [],
        self = this, new_ids = [], new_id, occupant,
        roster = JSON.parse(sessionStorage['QM.roster']),
        chat = $('.l-chat[data-dialog="'+dialog_id+'"]');

    for (var i = 0, len = new_members.length, name; i < len; i++) {
      name = $(new_members[i]).find('.name').text();
      if (groupName.length < 3) groupName.push(name);
      occupants_names.push(name);
      occupants_ids.push($(new_members[i]).data('id').toString());
      new_ids.push($(new_members[i]).data('id').toString());
    }

    groupName = groupName.join(', ');
    occupants_names = occupants_names.join(', ');
    occupants_ids = occupants_ids.join();

    self.createDataSpinner(null, true);
    if (type) {
      Dialog.updateGroup(occupants_names, {dialog_id: dialog_id, occupants_ids: occupants_ids, new_ids: new_ids}, function(dialog) {
        self.removeDataSpinner();
        var dialogItem = $('.dialog-item[data-dialog="'+dialog.id+'"]');
        if (dialogItem.length > 0) {
          copyDialogItem = dialogItem.clone();
          dialogItem.remove();
          $('#recentList ul').prepend(copyDialogItem);
          $('#recentList').removeClass('is-hidden');
          isSectionEmpty($('#recentList ul'));
        }
        chat.find('.addToGroupChat').data('ids', dialog.occupants_ids);
        $('.is-overlay').removeClass('is-overlay');


        for (var i = 0, len = new_ids.length; i < len; i++) {
          new_id = new_ids[i];
          occupant = '<a class="occupant l-flexbox_inline presence-listener" data-id="'+new_id+'" href="#">';
          occupant = getStatus(roster[new_id], occupant);
          occupant += '<span class="name name_occupant">'+contacts[new_id].full_name+'</span></a>';
          chat.find('.chat-occupants-wrap .mCSB_container').append(occupant);
        }

        chat.find('.addToGroupChat').data('ids', dialog.occupants_ids);

        // $('.dialog-item[data-dialog="'+dialog.id+'"]').find('.contact').click();
      });
    } else {
      Dialog.createGroup(occupants_names, {name: groupName, occupants_ids: occupants_ids, type: 2}, function(dialog) {
        self.removeDataSpinner();
        $('.is-overlay').removeClass('is-overlay');
        $('.dialog-item[data-dialog="'+dialog.id+'"]').find('.contact').click();
      });
    }
  },

  leaveGroupChat: function(objDom) {
    var dialogs = ContactList.dialogs,
        dialog_id = objDom.data('dialog'),
        dialog = dialogs[dialog_id],
        li = $('.dialog-item[data-dialog="'+dialog_id+'"]'),
        chat = $('.l-chat[data-dialog="'+dialog_id+'"]'),
        list = li.parents('ul');

    li.remove();
    isSectionEmpty(list);
    // console.log(dialogs[dialog_id]);

    // delete dialog messages
    localStorage.removeItem('QM.dialog-' + dialog_id);

    Dialog.leaveChat(dialog, function() {
      // delete chat section
      if (chat.length > 0)
        chat.remove();
      $('#capBox').removeClass('is-hidden');
      delete dialogs[dialog_id];
    });

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

// ajax downloading of data through scroll
function ajaxDownloading(chat, self) {
  var MessageView = self.app.views.Message,
      dialog_id = chat.parents('.l-chat').data('dialog'),
      count = chat.find('.message').length,
      message;

  Message.download(dialog_id, function(messages) {
    for (var i = 0, len = messages.length; i < len; i++) {
      message = Message.create(messages[i]);
      // if (QMCONFIG.debug) console.log(message);
      MessageView.addItem(message, true);
    }
  }, count);
}

function openPopup(objDom) {
  objDom.add('.popups').addClass('is-overlay');
}

function getStatus(status, html) {
  if (!status || status.subscription === 'none')
    html += '<span class="status status_request"></span>';
  else if (status && status.status)
    html += '<span class="status status_online"></span>';
  else
    html += '<span class="status"></span>';

  return html;
}

function textAreaScrollbar() {
  $('.l-chat:visible .textarea').niceScroll({
    cursoropacitymax: 0.5,
    railpadding: {right: 5},
    zindex: 1,
    enablekeyboard: false
  });
}

function isSectionEmpty(list) {
  if (list.contents().length === 0)
    list.parent().addClass('is-hidden');

  if ($('#historyList ul').contents().length === 0)
      $('#historyList ul').parent().addClass('is-hidden');

  if ($('#requestsList').is('.is-hidden') &&
      $('#recentList').is('.is-hidden') &&
      $('#historyList').is('.is-hidden')) {
    
    $('#emptyList').removeClass('is-hidden');
  }
}
