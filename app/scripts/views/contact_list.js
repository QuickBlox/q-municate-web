/*
 * Q-municate chat application
 *
 * Contact List View Module
 *
 */

define(['jquery', 'config', 'quickblox', 'Helpers', 'underscore', 'mCustomScrollbar', 'mousewheel'], function($, QMCONFIG, QB, Helpers, _) {

  var Dialog, Message, ContactList, User;

  function ContactListView(app) {
    this.app = app;
    Dialog = this.app.models.Dialog;
    Message = this.app.models.Message;
    ContactList = this.app.models.ContactList;
    User = this.app.models.User;

    scrollbarContacts();
  }

  ContactListView.prototype = {

    createDataSpinner: function(list) {
      var spinnerBlock = '<div class="popup-elem spinner_bounce">';
      spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
      spinnerBlock += '</div>';

      list.after(spinnerBlock);
    },

    removeDataSpinner: function() {
      $('.popup:visible .spinner_bounce').remove();
      $('.popup:visible input').prop('disabled', false);
    },

    globalPopup: function() {
      var popup = $('#popupSearch');

      openPopup(popup);
      popup.find('.popup-elem').addClass('is-hidden').siblings('form').find('input').val('');
      popup.find('.mCSB_container').empty();
    },

    globalSearch: function(form) {
      var self = this,
          popup = form.parent(),
          list = popup.find('ul:first'),
          val = form.find('input[type="search"]').val().trim(),
          len = val.length;

      if (len > 0) {

        // display "Name must be more than 2 characters" or "No results found"
        if (len < 3) {
          popup.find('.popup-elem .not_found').addClass('is-hidden');
          popup.find('.popup-elem .short_length').removeClass('is-hidden');
        } else {
          popup.find('.popup-elem .not_found').removeClass('is-hidden');
          popup.find('.popup-elem .short_length').addClass('is-hidden');
        }

          form.find('input').prop('disabled', false).val(val);
          popup.find('.popup-elem').addClass('is-hidden');
          popup.find('.mCSB_container').empty();

          scrollbar(list, self);
          self.createDataSpinner(list);
          $('.popup:visible .spinner_bounce').removeClass('is-hidden').addClass('is-empty');

          sessionStorage.setItem('QM.search.value', val);
          sessionStorage.setItem('QM.search.page', 1);

          ContactList.globalSearch(function(results) {
            createListResults(list, results, self);
          });
      }
    },

    addContactsToChat: function(objDom, type, dialog_id, isPrivate) {
      var ids = objDom.data('ids') ? objDom.data('ids').toString().split(',') : [],
          popup = $('#popupContacts'),
          contacts = ContactList.contacts,
          roster = ContactList.roster,
          html, sortedContacts, friends, user_id;

      openPopup(popup, type, dialog_id);
      popup.addClass('not-selected').removeClass('is-addition');
      popup.find('.note').addClass('is-hidden').siblings('ul').removeClass('is-hidden');
      popup.find('.popup-nofriends').addClass('is-hidden').siblings().removeClass('is-hidden');
      popup.find('form')[0].reset();
      popup.find('.list_contacts').mCustomScrollbar("scrollTo","top");
      popup.find('.mCSB_container').empty();
      popup.find('.btn').removeClass('is-hidden');

      // get your friends which are sorted by alphabet
      sortedContacts = _.pluck( _.sortBy(contacts, 'full_name') , 'id').map(String);
      friends = _.filter(sortedContacts, function(el) {
        return roster[el] && roster[el].subscription !== 'none';
      });
      Helpers.log('Friends', friends);

      if (friends.length === 0) {
        popup.children(':not(.popup-header)').addClass('is-hidden');
        popup.find('.popup-nofriends').removeClass('is-hidden');
        return true;
      }

      // exclude users who are already present in the dialog
      friends = _.difference(friends, ids);

      for (var i = 0, len = friends.length; i < len; i++) {
        user_id = friends[i];

        html = '';
        html += '<li class="list-item" data-id="'+user_id+'">';
        html += '<a class="contact l-flexbox" href="#">';
        html += '<div class="l-flexbox_inline">';
        // html += '<img class="contact-avatar avatar" src="'+contacts[user_id].avatar_url+'" alt="user">';
        html += '<div class="contact-avatar avatar profileUserAvatar" style="background-image:url('+contacts[user_id].avatar_url+')" data-id="'+user_id+'"></div>';
        html += '<span class="name profileUserName" data-id="'+user_id+'">'+contacts[user_id].full_name+'</span>';
        html += '</div><input class="form-checkbox" type="checkbox">';
        html += '</a></li>';

        popup.find('.mCSB_container').append(html);
      }

      if (type || isPrivate)
        popup.addClass('is-addition').data('existing_ids', ids.length > 0 ? ids : null);
      else
        popup.data('existing_ids', null);
    },

    // subscriptions

    importFBFriend: function(id) {
      var jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId),
          roster = ContactList.roster;

      QB.chat.roster.add(jid, function() {
        // update roster
        roster[id] = {
          subscription: 'none',
          ask: 'subscribe'
        };
        ContactList.saveRoster(roster);

        Dialog.createPrivate(jid);
      });

    },

    sendSubscribe: function(objDom, isChat) {
      var MessageView = this.app.views.Message,
          jid = isChat ? objDom.parents('.l-chat').data('jid') : objDom.parents('li').data('jid'),
          roster = ContactList.roster,
          id = QB.chat.helpers.getIdFromNode(jid),
          dialogItem = $('.dialog-item[data-id="'+id+'"]')[0],
          requestItem = $('#requestsList .list-item[data-jid="'+jid+'"]'),
          notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
          time = Math.floor(Date.now() / 1000),
          message, copyDialogItem,
          self = this;

      if (!isChat) {
        objDom.after('<span class="send-request l-flexbox">Request Sent</span>');
        objDom.remove();
      }

      if (notConfirmed[id] && requestItem[0]) {
        self.sendConfirm(requestItem);
      } else {
        QB.chat.roster.add(jid, function() {
          // update roster
          roster[id] = {
            subscription: 'none',
            ask: 'subscribe'
          };
          ContactList.saveRoster(roster);

          if (dialogItem) {
            // send notification about subscribe
            QB.chat.send(jid, {
              type: 'chat',
              body: 'Contact request',
              extension: {
                date_sent: time,
                dialog_id: dialogItem.getAttribute('data-dialog'),
                save_to_history: 1,
                notification_type: '4'
              }
            });

            message = Message.create({
              date_sent: time,
              chat_dialog_id: dialogItem.getAttribute('data-dialog'),
              sender_id: User.contact.id,
              notification_type: '4'
            });

            MessageView.addItem(message, true, true);
          } else {
            Dialog.createPrivate(jid, true);
          }

          dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]');
          copyDialogItem = dialogItem.clone();
          dialogItem.remove();
          $('#recentList ul').prepend(copyDialogItem);
          if (!$('#searchList').is(':visible')) {
           $('#recentList').removeClass('is-hidden');
           isSectionEmpty($('#recentList ul'));
          }
        });
      }

    },

    sendConfirm: function(objDom) {
      var DialogView = this.app.views.Dialog,
          MessageView = this.app.views.Message,
          jid = objDom.data('jid') || objDom.parents('li').data('jid'),
          id = QB.chat.helpers.getIdFromNode(jid),
          list = objDom.parents('ul'),
          roster = ContactList.roster,
          notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
          hiddenDialogs = JSON.parse(sessionStorage['QM.hiddenDialogs']),
          li, dialog, message, dialogItem, copyDialogItem,
          time = Math.floor(Date.now() / 1000);

      if (objDom.is('.request-button'))
        objDom.parents('li').remove();
      else
        objDom.remove();
      isSectionEmpty(list);

      // update roster
      roster[id] = {
        subscription: 'from',
        ask: 'subscribe'
      };
      ContactList.saveRoster(roster);

      // update notConfirmed people list
      delete notConfirmed[id];
      ContactList.saveNotConfirmed(notConfirmed);

      QB.chat.roster.confirm(jid, function() {
        // send notification about confirm
        QB.chat.send(jid, {
          type: 'chat',
          body: 'Contact request',
          extension: {
            date_sent: time,
            dialog_id: hiddenDialogs[id],
            save_to_history: 1,
            notification_type: '5'
          }
        });

        message = Message.create({
          chat_dialog_id: hiddenDialogs[id],
          notification_type: '5',
          date_sent: time,
          sender_id: User.contact.id
        });
        MessageView.addItem(message, true, true);

        // delete duplicate contact item
        li = $('.dialog-item[data-id="'+id+'"]');
        list = li.parents('ul');
        li.remove();
        isSectionEmpty(list);

        dialog = Dialog.create({
          _id: hiddenDialogs[id],
          type: 3,
          occupants_ids: [id],
          unread_count: ''
        });
        ContactList.dialogs[dialog.id] = dialog;
        Helpers.log('Dialog', dialog);

        DialogView.addDialogItem(dialog);

        dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]');
        copyDialogItem = dialogItem.clone();
        dialogItem.remove();
        $('#recentList ul').prepend(copyDialogItem);
        if (!$('#searchList').is(':visible')) {
         $('#recentList').removeClass('is-hidden');
         isSectionEmpty($('#recentList ul'));
        }

        dialogItem = $('.presence-listener[data-id="'+id+'"]');
        dialogItem.find('.status').removeClass('status_request');
      });

    },

    sendReject: function(objDom) {
      var jid = objDom.parents('li').data('jid'),
          id = QB.chat.helpers.getIdFromNode(jid),
          list = objDom.parents('ul'),
          roster = ContactList.roster,
          notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
          hiddenDialogs = JSON.parse(sessionStorage['QM.hiddenDialogs']),
          time = Math.floor(Date.now() / 1000);

      objDom.parents('li').remove();
      isSectionEmpty(list);

      // update roster
      roster[id] = {
        subscription: 'none',
        ask: null
      };
      ContactList.saveRoster(roster);

      // update notConfirmed people list
      delete notConfirmed[id];
      ContactList.saveNotConfirmed(notConfirmed);

      QB.chat.roster.reject(jid, function() {
        // send notification about reject
        QB.chat.send(jid, {
          type: 'chat',
          body: 'Contact request',
          extension: {
            date_sent: time,
            dialog_id: hiddenDialogs[id],
            save_to_history: 1,
            notification_type: '6'
          }
        });
      });

    },

    sendDelete: function(objDom) {
      var contacts = ContactList.contacts,
          dialogs = ContactList.dialogs,
          id = objDom.data('id'),
          jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId),
          li = $('.dialog-item[data-id="'+id+'"]'),
          chat = $('.l-chat[data-id="'+id+'"]'),
          list = li.parents('ul'),
          dialog_id = li.data('dialog'),
          roster = ContactList.roster,
          time = Math.floor(Date.now() / 1000);

      // update roster
      delete roster[id];
      ContactList.saveRoster(roster);

      // send notification about reject
      QB.chat.send(jid, {
        type: 'chat',
        body: 'Contact request',
        extension: {
          date_sent: time,
          dialog_id: dialog_id,
          save_to_history: 1,
          notification_type: '7'
        }
      });

      QB.chat.roster.remove(jid, function() {
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

    },

    // callbacks

    onSubscribe: function(id) {
      var html,
          contacts = ContactList.contacts,
          jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId),
          dialogItem = $('#requestsList .list-item[data-jid="'+jid+'"]'),
          notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {};

      if (dialogItem.length > 0) return true;
      // update notConfirmed people list
      notConfirmed[id] = true;
      ContactList.saveNotConfirmed(notConfirmed);

      ContactList.add([id], null, function() {
        html = '<li class="list-item" data-jid="'+jid+'">';
        html += '<a class="contact l-flexbox" href="#">';
        html += '<div class="l-flexbox_inline">';
        // html += '<img class="contact-avatar avatar" src="'+(typeof contacts[id] !== 'undefined' ? contacts[id].avatar_url : '')+'" alt="user">';
        html += '<div class="contact-avatar avatar profileUserAvatar" style="background-image:url('+(typeof contacts[id] !== 'undefined' ? contacts[id].avatar_url : '')+')" data-id="'+id+'"></div>';
        html += '<span class="name profileUserName" data-id="'+id+'">'+(typeof contacts[id] !== 'undefined' ? contacts[id].full_name : '')+'</span>';
        html += '</div><div class="request-controls l-flexbox">';
        html += '<button class="request-button request-button_cancel">&#10005;</button>';
        html += '<button class="request-button request-button_ok">&#10003;</button>';
        html += '</div></a></li>';

        $('#requestsList').removeClass('is-hidden').find('ul').prepend(html);
        $('#emptyList').addClass('is-hidden');
      }, 'subscribe');
    },

    onConfirm: function(id) {
      var roster = ContactList.roster,
          dialogItem = $('.presence-listener[data-id="'+id+'"]');

      // update roster
      roster[id] = {
        subscription: 'to',
        ask: null
      };
      ContactList.saveRoster(roster);

      dialogItem.find('.status').removeClass('status_request');
      dialogItem.removeClass('is-request');
    },

    onReject: function(id) {
      var dialogItem = $('.presence-listener[data-id="'+id+'"]'),
          jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId),
          request = $('#requestsList .list-item[data-jid="'+jid+'"]'),
          list = request && request.parents('ul'),
          roster = ContactList.roster,
          notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {};

      // update roster
      roster[id] = {
        subscription: 'none',
        ask: null
      };
      ContactList.saveRoster(roster);

      // update notConfirmed people list
      delete notConfirmed[id];
      ContactList.saveNotConfirmed(notConfirmed);

      dialogItem.find('.status').removeClass('status_online').addClass('status_request');
      if (dialogItem.is('.l-chat'))
        dialogItem.addClass('is-request');
      if (request.length > 0) {
        QB.chat.roster.remove(jid, function() {
          request.remove();
          isSectionEmpty(list);
        });
      }
      dialogItem.addClass('is-request');
    },

    onPresence: function(id, type) {
      var dialogItem = $('.presence-listener[data-id="'+id+'"]'),
          roster = ContactList.roster;

      // update roster
      if (typeof roster[id] === 'undefined') return true;
      roster[id].status = type ? false : true;
      ContactList.saveRoster(roster);

      if (type) {
        dialogItem.find('.status').removeClass('status_online');
        if (dialogItem.is('.popup_details'))
          dialogItem.find('.status_text').text('Offline');
      } else {
        dialogItem.find('.status').addClass('status_online');
        if (dialogItem.is('.popup_details'))
          dialogItem.find('.status_text').text('Online');
      }
    }

  };

  /* Private
  ---------------------------------------------------------------------- */
  function openPopup(objDom, type, dialog_id) {
    objDom.add('.popups').addClass('is-overlay');
    if (type) objDom.addClass(type).data('dialog', dialog_id);
    else objDom.removeClass('add').data('dialog', '');
  }

  function scrollbarContacts() {
    $('.scrollbarContacts').mCustomScrollbar({
      theme: 'minimal-dark',
      scrollInertia: 500,
      mouseWheel: {
        scrollAmount: QMCONFIG.isMac || 'auto',
        deltaFactor: 'auto'
      },
      live: true
    });
  }

  function scrollbar(list, self) {
    list.mCustomScrollbar({
      theme: 'minimal-dark',
      scrollInertia: 500,
      mouseWheel: {
        scrollAmount: QMCONFIG.isMac || 'auto',
        deltaFactor: 'auto'
      },
      callbacks: {
        onTotalScroll: function() {
          ajaxDownloading(list, self);
        }
      },
      live: true
    });
  }

  // ajax downloading of data through scroll
  function ajaxDownloading(list, self) {
    var page = parseInt(sessionStorage['QM.search.page']),
        allPages = parseInt(sessionStorage['QM.search.allPages']);

    if (page <= allPages) {
      self.createDataSpinner(list);
      ContactList.globalSearch(function(results) {
        createListResults(list, results, self);
      });
    }
  }

  function createListResults(list, results, self) {
    var roster = ContactList.roster,
        notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
        item;

    if (results.length > 0) {
      results.forEach(function(contact) {
        var rosterItem = roster[contact.id];

        item = '<li class="list-item" data-jid="'+contact.user_jid+'">';
        item += '<a class="contact l-flexbox" href="#">';
        item += '<div class="l-flexbox_inline">';
        // item += '<img class="contact-avatar avatar" src="'+contact.avatar_url+'" alt="user">';
        item += '<div class="contact-avatar avatar profileUserAvatar" style="background-image:url('+contact.avatar_url+')" data-id="'+contact.id+'"></div>';
        item += '<span class="name profileUserName" data-id="'+contact.id+'">'+contact.full_name+'</span>';
        item += '</div>';
        if (!rosterItem || (rosterItem && rosterItem.subscription === 'none' && !rosterItem.ask && !notConfirmed[contact.id])) {
          item += '<button class="send-request"><img class="icon-normal" src="images/icon-request.svg" alt="request">';
          item += '<img class="icon-active" src="images/icon-request_active.svg" alt="request"></button>';
        }
        if (rosterItem && rosterItem.subscription === 'none' && rosterItem.ask) {
          item += '<span class="send-request l-flexbox">Request Sent</span>';
        }
        item += '</a></li>';

        list.find('.mCSB_container').append(item);
        list.removeClass('is-hidden').siblings('.popup-elem').addClass('is-hidden');
      });
    } else {
      list.parents('.popup_search').find('.note').removeClass('is-hidden').siblings('.popup-elem').addClass('is-hidden');
    }

    self.removeDataSpinner();
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

  return ContactListView;

});
