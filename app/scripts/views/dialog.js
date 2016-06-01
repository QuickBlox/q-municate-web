/*
 * Q-municate chat application
 *
 * Dialog View Module
 *
 */

define([
  'jquery',
  'config',
  'quickblox',
  'Helpers',
  'underscore',
  'models/person',
  'views/profile',
  'views/change_password',
  'views/fb_import',
  'mCustomScrollbar',
  'nicescroll',
  'mousewheel'
], function($, QMCONFIG, QB, Helpers, _, Person, ProfileView, ChangePassView, FBImportView) {

  var User, Dialog, Message, ContactList;
  var unreadDialogs = {};
  var currentUser, profileView, changePassView, fbImportView;

  var TITLE_NAME = 'Q-municate',
      FAVICON_COUNTER = 'favicon_counter.png',
      FAVICON = 'favicon.png';

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
      var self = this;

      var ContactListView = this.app.views.ContactList,
          MessageView = this.app.views.Message,
          VideoChat = this.app.models.VideoChat,
          VideoChatView = this.app.views.VideoChat;

      QB.chat.onMessageListener = MessageView.onMessage;
      QB.chat.onMessageTypingListener = MessageView.onMessageTyping;
      QB.chat.onSystemMessageListener = MessageView.onSystemMessage;
      QB.chat.onDeliveredStatusListener = MessageView.onDeliveredStatus;
      QB.chat.onReadStatusListener = MessageView.onReadStatus;

      QB.chat.onContactListListener = ContactListView.onPresence;
      QB.chat.onSubscribeListener = ContactListView.onSubscribe;
      QB.chat.onConfirmSubscribeListener = ContactListView.onConfirm;
      QB.chat.onRejectSubscribeListener = ContactListView.onReject;

      if (QB.webrtc) {
        QB.webrtc.onCallListener = VideoChatView.onCall;
        QB.webrtc.onAcceptCallListener = VideoChatView.onAccept;
        QB.webrtc.onRejectCallListener = VideoChatView.onReject;
        QB.webrtc.onStopCallListener = VideoChatView.onStop;
        QB.webrtc.onUpdateCallListener = VideoChatView.onUpdateCall;
        QB.webrtc.onRemoteStreamListener = VideoChatView.onRemoteStream;
        QB.webrtc.onCallStatsReport = VideoChatView.onCallStatsReport;
        QB.webrtc.onSessionCloseListener = VideoChatView.onSessionCloseListener;
        QB.webrtc.onUserNotAnswerListener = VideoChatView.onUserNotAnswerListener;
      }

      QB.chat.onDisconnectedListener = function() {
        if ('div.popups.is-overlay') {
          $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
        }
        $('.j-disconnect').addClass('is-overlay')
         .parent('.j-overlay').addClass('is-overlay');
      };

      QB.chat.onReconnectListener = function() {
        $('.j-disconnect').removeClass('is-overlay')
         .parent('.j-overlay').removeClass('is-overlay');
      };

      QB.chat.onReconnectFailedListener = function(error) {
        if (error) {
          self.app.service.reconnectChat();
        }
      };

      currentUser = new Person(_.clone(User.contact), {
        app: this.app,
        parse: true
      });
      profileView = new ProfileView({
        model: currentUser
      });
      changePassView = new ChangePassView({
        model: currentUser
      });
      fbImportView = new FBImportView();
      this.app.views.Profile = profileView;
      this.app.views.ChangePass = changePassView;
      this.app.views.FBImport = fbImportView;
    },

    createDataSpinner: function(chat, groupchat, isAjaxDownloading) {
      var spinnerBlock;
      if (isAjaxDownloading) {
        spinnerBlock = '<div class="message message_service"><div class="popup-elem spinner_bounce is-empty is-ajaxDownload">';
      } else if (groupchat) {
        spinnerBlock = '<div class="popup-elem spinner_bounce is-creating">';
      } else {
        spinnerBlock = '<div class="popup-elem spinner_bounce is-empty">';
      }

      spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
      spinnerBlock += '</div>';

      if (isAjaxDownloading) spinnerBlock += '</div>';

      if (chat) {
        $('.l-chat:visible').find('.l-chat-content').append(spinnerBlock);
      } else if (groupchat) {
        $('#popupContacts .btn_popup').addClass('is-hidden');
        $('#popupContacts .popup-footer').append(spinnerBlock);
        $('#popupContacts .popup-footer').after('<div class="temp-box"></div>');
      } else if (isAjaxDownloading) {
        $('.l-chat:visible').find('.l-chat-content').prepend(spinnerBlock);
      } else {
        $('#emptyList').after(spinnerBlock);
      }
    },

    removeDataSpinner: function() {
      $('.spinner_bounce, .temp-box, div.message_service').remove();
    },

    prepareDownloading: function(roster) {
      Helpers.log('QB SDK: Roster has been got', roster);
      this.chatCallbacksInit();
      this.createDataSpinner();
      scrollbar();
      ContactList.saveRoster(roster);
    },

    getUnreadCounter: function(dialog_id) {
      var counter;

      if (typeof unreadDialogs[dialog_id] === 'undefined') {
        unreadDialogs[dialog_id] = true;
        counter = Object.keys(unreadDialogs).length;

        $('title').text('('+counter+') ' + TITLE_NAME);
        $('link[rel="icon"]').remove();
        $('head').append('<link rel="icon" href="'+FAVICON_COUNTER+'">');
      }
    },

    decUnreadCounter: function(dialog_id) {
      var counter;

      if (typeof unreadDialogs[dialog_id] !== 'undefined') {
        delete unreadDialogs[dialog_id];
        counter = Object.keys(unreadDialogs).length;

        if (counter > 0) {
          $('title').text('('+counter+') ' + TITLE_NAME);
        } else {
          $('title').text(TITLE_NAME);
          $('link[rel="icon"]').remove();
          $('head').append('<link rel="icon" href="'+FAVICON+'">');
        }
      }
    },

    logoutWithClearData: function() {
      unreadDialogs = {};
      $('title').text(TITLE_NAME);
      $('link[rel="icon"]').remove();
      $('head').append('<link rel="icon" href="'+FAVICON+'">');
      $('.mediacall-remote-duration').text('connecting...');
      $('.mediacall-info-duration').text('');
    },

    downloadDialogs: function(roster, ids) {
      var self = this,
          ContactListView = this.app.views.ContactList,
          hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
          rosterIds = Object.keys(roster),
          notConfirmed,
          private_id,
          dialog,
          occupants_ids,
          chat;

      Dialog.download(function(dialogs) {
        self.removeDataSpinner();

        if (dialogs.length > 0) {

          occupants_ids = _.uniq(_.flatten(_.pluck(dialogs, 'occupants_ids'), true));

          // updating of Contact List whereto are included all people
          // with which maybe user will be to chat (there aren't only his friends)
          ContactList.add(occupants_ids, null, function() {

            for (var i = 0, len = dialogs.length; i < len; i++) {
              dialog = Dialog.create(dialogs[i]);

              ContactList.dialogs[dialog.id] = dialog;

              // don't create a duplicate dialog in contact list
              chat = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog.id+'"]');
              if (chat[0] && dialog.unread_count) {
                chat.find('.unread').text(dialog.unread_count);
                self.getUnreadCounter(dialog.id);
                continue;
              }

              if (dialog.type === 2) QB.chat.muc.join(dialog.room_jid);

              // update hidden dialogs
              private_id = dialog.type === 3 ? dialog.occupants_ids[0] : null;
              hiddenDialogs[private_id] = dialog.id;
              ContactList.saveHiddenDialogs(hiddenDialogs);

              // not show dialog if user has not confirmed this contact
              notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {};
              if (private_id && (!roster[private_id] || (roster[private_id] && roster[private_id].subscription === 'none' && !roster[private_id].ask && notConfirmed[private_id])))
                continue;

              self.addDialogItem(dialog, true);
            }

            if ($('#requestsList').is('.is-hidden') &&
                $('#recentList').is('.is-hidden') &&
                $('#historyList').is('.is-hidden')) {

              $('#emptyList').removeClass('is-hidden');
            }

          });

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

        self.getAllUsers(rosterIds);

      });
    },

    getAllUsers: function(rosterIds) {
      var QBApiCalls = this.app.service,
          Contact = this.app.models.Contact,
          ContactList = this.app.models.ContactList,
          params = { filter: { field: 'id', param: 'in', value: rosterIds }, per_page: 100 };

      QBApiCalls.listUsers(params, function(users) {
        users.items.forEach(function(qbUser) {
          var user = qbUser.user;
          var contact = Contact.create(user);
          ContactList.contacts[contact.id] = contact;

          $('.profileUserName[data-id="'+contact.id+'"]').text(contact.full_name);
          $('.profileUserStatus[data-id="'+contact.id+'"]').text(contact.status);
          $('.profileUserPhone[data-id="'+contact.id+'"]').html(
            '<span class="userDetails-label">Phone:</span><span class="userDetails-phone">'+contact.phone+'</span>'
          );
          $('.profileUserAvatar[data-id="'+contact.id+'"]').css('background-image', 'url('+contact.avatar_url+')');

          localStorage.setItem('QM.contact-' + contact.id, JSON.stringify(contact));
        });
      });
    },

    hideDialogs: function() {
      $('.l-list').addClass('is-hidden');
      $('.l-list ul').html('');
    },

    addDialogItem: function(dialog, isDownload, isNew) {
      var contacts = ContactList.contacts,
          roster = ContactList.roster,
          private_id, icon, name, status,
          html, startOfCurrentDay,
          self = this;

      private_id = dialog.type === 3 ? dialog.occupants_ids[0] : null;

      try {
        icon = private_id ? contacts[private_id].avatar_url : (dialog.room_photo || QMCONFIG.defAvatar.group_url);
        name = private_id ? contacts[private_id].full_name : dialog.room_name;
        status = roster[private_id] ? roster[private_id] : null;
      } catch (error) {
        console.error(error);
      }

      html = '<li class="list-item dialog-item presence-listener" data-dialog="'+dialog.id+'" data-id="'+private_id+'">';
      html += '<a class="contact l-flexbox" href="#">';
      html += '<div class="l-flexbox_inline">';
      // html += '<img class="contact-avatar avatar" src="' + icon + '" alt="user">';
      html += '<div class="contact-avatar avatar profileUserAvatar" style="background-image:url(' + icon + ')" data-id="'+private_id+'"></div>';
      html += '<span class="name profileUserName" data-id="'+private_id+'">' + name + '</span>';
      html += '</div>';

      if (dialog.type === 3)
        html = getStatus(status, html);
      else
        html += '<span class="status"></span>';

      html += '<span class="unread">'+dialog.unread_count+'</span>';

      html += '</a></li>';

      startOfCurrentDay = new Date();
      startOfCurrentDay.setHours(0,0,0,0);

      // checking if this dialog is recent OR no
      if (!dialog.last_message_date_sent || new Date(dialog.last_message_date_sent * 1000) > startOfCurrentDay || isNew) {
        if (isDownload)
          $('#recentList').removeClass('is-hidden').find('ul').append(html);
        else if (!$('#searchList').is(':visible'))
          $('#recentList').removeClass('is-hidden').find('ul').prepend(html);
        else
          $('#recentList').removeClass('is-hidden').find('ul').prepend(html);
      } else if (!$('#searchList').is(':visible')) {
        $('#historyList').removeClass('is-hidden').find('ul').append(html);
      }

      $('#emptyList').addClass('is-hidden');
      if (dialog.unread_count) self.getUnreadCounter(dialog.id);
    },

    htmlBuild: function(objDom) {
      var MessageView = this.app.views.Message,
          contacts = ContactList.contacts,
          dialogs = ContactList.dialogs,
          roster = ContactList.roster,
          parent = objDom.parent(),
          dialog_id = parent.data('dialog'),
          user_id = parent.data('id'),
          dialog = dialogs[dialog_id],
          user = contacts[user_id],
          $chat = $('.l-chat[data-dialog="'+dialog_id+'"]'),
          self = this,
          html,
          jid,
          icon,
          name,
          status,
          message,
          msgArr,
          userId,
          messageId;

      jid = dialog.room_jid || user.user_jid;
      icon = user_id ? user.avatar_url : (dialog.room_photo || QMCONFIG.defAvatar.group_url);
      name = dialog.room_name || user.full_name;
      status = roster[user_id] ? roster[user_id] : null;

      if ($chat.length === 0) {
        if (dialog.type === 3) {
          html = '<section class="l-workspace l-chat l-chat_private presence-listener" data-dialog="'+dialog_id+'" data-id="'+user_id+'" data-jid="'+jid+'">';
          html += '<header class="l-chat-header l-flexbox l-flexbox_flexbetween">';
        } else {
          html = '<section class="l-workspace l-chat l-chat_group is-group" data-dialog="'+dialog_id+'" data-jid="'+jid+'">';
          html += '<header class="l-chat-header l-flexbox l-flexbox_flexbetween groupTitle">';
        }

        html += '<div class="chat-title">';
        html += '<div class="l-flexbox_inline">';

        if (dialog.type === 3) {
          html += '<div class="contact-avatar avatar avatar_chat profileUserAvatar" style="background-image:url('+icon+')" data-id="'+user_id+'"></div>';
          html += '<h2 class="name name_chat profileUserName" title="'+name+'" data-id="'+user_id+'">'+name+'</h2>';
          html = getStatus(status, html);
        } else {
          html += '<div class="contact-avatar avatar avatar_chat" style="background-image:url('+icon+')"></div>';
          html += '<span class="pencil_active avatar is-hidden"></span>';
          html += '<input class="avatar_file avatar is-hidden" type="file" accept="image/*">';
          html += '<h2 class="name name_chat" contenteditable="true" title="'+name+'">'+name+'</h2>';
          html += '<span class="pencil is-hidden"></span>';
          html += '<span class="triangle triangle_down"></span>';
          html += '<span class="triangle triangle_up is-hidden"></span>';
        }

        html += '</div></div>';
        html += '<div class="chat-controls">';
        if (dialog.type === 3) {
          html += '<button class="btn_chat btn_chat_videocall videoCall"><img src="images/icon-videocall.svg" alt="videocall"></button>';
          html += '<button class="btn_chat btn_chat_audiocall audioCall"><img src="images/icon-audiocall.svg" alt="audiocall"></button>';
          html += '<button class="btn_chat btn_chat_add createGroupChat" data-ids="'+dialog.occupants_ids.join()+'" data-private="1"><img src="images/icon-add.svg" alt="add"></button>';
          html += '<button class="btn_chat btn_chat_profile userDetails" data-id="'+user_id+'"><img src="images/icon-profile.svg" alt="profile"></button>';
        } else
          html += '<button class="btn_chat btn_chat_add addToGroupChat" data-ids="'+dialog.occupants_ids.join()+'" data-dialog="'+dialog_id+'"><img src="images/icon-add.svg" alt="add"></button>';

        if (dialog.type === 3)
          html += '<button class="btn_chat btn_chat_delete deleteContact"><img src="images/icon-delete.svg" alt="delete"></button>';
        else
          html += '<button class="btn_chat btn_chat_delete leaveChat"><img src="images/icon-delete.svg" alt="delete"></button>';

        html += '</div></header>';

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

        html += '<section class="l-chat-content scrollbar_message"></section>';
        html += '<footer class="l-chat-footer">';
        html += '<div class="footer_btn j-toBottom btn_to_bottom"></div>';
        html += '<form class="l-message" action="#">';
        html += '<div class="form-input-message textarea" contenteditable="true" placeholder="Type a message"></div>';
        html += '<div class="footer_btn j-send_location btn_sendlocation'+((localStorage['QM.latitude'] && localStorage['QM.longitude']) ? ' btn_active' : '')+'"';
        html += 'data-balloon-length="small" data-balloon="Send your location with messages" data-balloon-pos="up"></div>';
        html += '<input class="attachment" type="file" accept="image/*"></form>';
        html += '<div class="j-typing l-typing"></div><div class="l-input-menu">';
        html += '<div class="footer_btn l-input-buttons btn_input_smile j-btn_input_smile" data-balloon="Add smiles" data-balloon-pos="up"></div>';
        html += '<div class="footer_btn l-input-buttons btn_input_location j-btn_input_location" data-balloon="Send location" data-balloon-pos="up"></div>';
        html += '<div class="footer_btn l-input-buttons btn_input_attach j-btn_input_attach" data-balloon="Send attachment file" data-balloon-pos="up"></div>';
        html += '<button class="footer_btn l-input-buttons btn_input_send j-btn_input_send" data-balloon="Send message" data-balloon-pos="up">SEND</button></div></footer>';

        html += '</section>';

        $('.l-workspace-wrap .l-workspace').addClass('is-hidden').parent().append($(html));
        textAreaScrollbar();

        if (dialog.type === 3 && (!status || status.subscription === 'none'))
          $('.l-chat:visible').addClass('is-request');

        self.createDataSpinner(true);
        Message.download(dialog_id, function(messages) {
          for (var i = 0, len = messages.length; i < len; i++) {
            message = Message.create(messages[i]);
            if (message.read_ids.length < 2 && message.sender_id != User.contact.id) {
              QB.chat.sendReadStatus({messageId: message.id, userId: message.sender_id, dialogId: message.dialog_id});
            }

            message.stack = Message.isStack(false, messages[i], messages[i+1]);

            MessageView.addItem(message, null, null, message.recipient_id);

            if ((i+1) === len) {
              self.removeDataSpinner();
            }
          }

          self.messageScrollbar();
        });

      } else {

        $chat.removeClass('is-hidden').siblings().addClass('is-hidden');
        $('.l-chat:visible .scrollbar_message').mCustomScrollbar('destroy');
        self.messageScrollbar();

        if (typeof dialog.messages !== "undefined" && dialog.messages.length > 0 && dialog.type == 3) {
          Message.update(dialog.messages.join(), dialog_id, user_id);
        }
        if (typeof dialog.messages !== "undefined" && dialog.messages.length > 0 && dialog.type == 2) {
          for (var j = 0, ln = dialog.messages.length; j < ln; j++) {
            messageId = dialog.messages[j];
            userId = $('#'+messageId).data('id');
            QB.chat.sendReadStatus({messageId: messageId, userId: userId, dialogId: dialog_id});
          }
        }
      }

      $('.is-selected').removeClass('is-selected');
      parent.addClass('is-selected').find('.unread').text('');
      self.decUnreadCounter(dialog.id);

    },

    messageScrollbar: function() {
      var objDom = $('.l-chat:visible .scrollbar_message'),
          height = objDom[0].scrollHeight,
          self = this;

      objDom.mCustomScrollbar({
        theme: 'minimal-dark',
        scrollInertia: 100,
        mouseWheel: {
          scrollAmount: QMCONFIG.isMac || 'auto',
          deltaFactor: 'auto'
        },
        setTop: height + 'px',
        callbacks: {
          onTotalScrollBack: function() {
            ajaxDownloading(objDom, self);
          },
          onTotalScroll: function() {
            var isBottom = Helpers.isBeginOfChat(),
                $currentDialog = $('.dialog-item.is-selected'),
                dialogId = $currentDialog.data('dialog');

            if (isBottom) {
              $('.j-toBottom').hide();
              $currentDialog.find('.unread').text('');
              self.decUnreadCounter(dialogId);
            }
          },
          onScroll: function() {
            var isBottom = Helpers.isBeginOfChat();
            if (!isBottom) {
              $('.j-toBottom').show();
            }
          }
        },
        live: true
      });

    },

    createGroupChat: function(type, dialog_id) {
      var contacts = ContactList.contacts,
          new_members = $('#popupContacts .is-chosen'),
          occupants_ids = $('#popupContacts').data('existing_ids') || [],
          groupName = occupants_ids.length > 0 ? [ User.contact.full_name, contacts[occupants_ids[0]].full_name ] : [User.contact.full_name],
          occupants_names = !type && occupants_ids.length > 0 ? [ contacts[occupants_ids[0]].full_name ] : [],
          self = this, new_ids = [], new_id, occupant,
          roster = ContactList.roster,
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
          var dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog.id+'"]');
          if (dialogItem.length > 0) {
            copyDialogItem = dialogItem.clone();
            dialogItem.remove();
            $('#recentList ul').prepend(copyDialogItem);
            if (!$('#searchList').is(':visible')) {
             $('#recentList').removeClass('is-hidden');
             isSectionEmpty($('#recentList ul'));
            }
          }
          $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
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

      Dialog.leaveChat(dialog, function() {
        li.remove();
        isSectionEmpty(list);

        // delete chat section
        if (chat.is(':visible')) {
          $('#capBox').removeClass('is-hidden');
        }
        if (chat.length > 0) {
          chat.remove();
        }
        delete dialogs[dialog_id];
      });

    }

  };

  /* Private
  ---------------------------------------------------------------------- */
  function scrollbar() {
    $('.l-sidebar .scrollbar').mCustomScrollbar({
      theme: 'minimal-dark',
      scrollInertia: 500,
      mouseWheel: {
        scrollAmount: QMCONFIG.isMac || 'auto',
        deltaFactor: 'auto'
      },
      live: true
    });
  }

  // ajax downloading of data through scroll
  function ajaxDownloading($chat, self) {
    var MessageView = self.app.views.Message,
        dialog_id = $chat.parents('.l-chat').data('dialog'),
        count = $chat.find('.message').length,
        message;

    var listHeightBefore = $chat.find('.mCSB_container').height(),
        draggerHeightBefore = $chat.find('.mCSB_dragger').height(),
        viewPort = $chat.find('.mCustomScrollBox').height();

    Message.download(dialog_id, function(messages) {
      for (var i = 0, len = messages.length; i < len; i++) {
        message = Message.create(messages[i]);
        message.stack = Message.isStack(false, messages[i], messages[i+1]);
        MessageView.addItem(message, true);

        if ((i+1) === len) {
          var listHeightAfter = $chat.find('.mCSB_container').height(),
              draggerHeightAfter = $chat.find('.mCSB_dragger').height(),
              thisStopList = listHeightBefore - listHeightAfter,
              thisStopDragger = (draggerHeightAfter / (draggerHeightBefore + draggerHeightAfter)) * viewPort;

          $('.l-chat-content .mCSB_container').css({top: thisStopList+'px'});
          $('.l-chat-content .mCSB_dragger').css({top: thisStopDragger+'px'});
        }
      }
    }, count, 'ajax');
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

  return DialogView;

});
