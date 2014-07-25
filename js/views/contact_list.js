/*
 * Q-municate chat application
 *
 * Contact List View Module
 *
 */

module.exports = ContactListView;

var Dialog, ContactList, User;

function ContactListView(app) {
  this.app = app;
  Dialog = this.app.models.Dialog;
  ContactList = this.app.models.ContactList;
  User = this.app.models.User;
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
        val = form.find('input[type="search"]').val().trim();

    if (val.length > 0) {
      form.find('input').prop('disabled', true).val(val);
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

  // subscriptions

  sendSubscribe: function(objDom) {
    var jid = objDom.parents('li').data('jid'),
        roster = JSON.parse(sessionStorage['QM.roster']),
        id = QB.chat.helpers.getIdFromNode(jid),
        dialogItem = $('.dialog-item[data-id="'+id+'"]')[0];

    objDom.after('<span class="send-request l-flexbox">Request Sent</span>');
    objDom.remove();
    QB.chat.roster.add(jid);

    // update roster
    roster[id] = {
      subscription: 'none',
      ask: 'subscribe'
    };
    ContactList.saveRoster(roster);

    if (dialogItem) {
      // send notification about subscribe
      QB.chat.send(jid, {type: 'chat', extension: {
        save_to_history: 1,
        dialog_id: dialogItem.getAttribute('data-dialog'),
        date_sent: Math.floor(Date.now() / 1000),

        notification_type: 3,
        full_name: User.contact.full_name,
      }});
    } else {
      Dialog.createPrivate(jid);
    }
  },

  sendConfirm: function(objDom) {
    var DialogView = this.app.views.Dialog,
        jid = objDom.parents('li').data('jid'),
        id = QB.chat.helpers.getIdFromNode(jid),
        list = objDom.parents('ul'),
        roster = JSON.parse(sessionStorage['QM.roster']),
        notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
        hiddenDialogs = JSON.parse(sessionStorage['QM.hiddenDialogs']),
        li;

    objDom.parents('li').remove();
    isSectionEmpty(list);

    // update roster
    roster[id] = {
      subscription: 'both',
      ask: 'subscribe'
    };
    ContactList.saveRoster(roster);

    // update notConfirmed people list
    delete notConfirmed[id];
    ContactList.saveNotConfirmed(notConfirmed);

    QB.chat.roster.confirm(jid);
    // send notification about confirm
    QB.chat.send(jid, {type: 'chat', extension: {
      save_to_history: 1,
      dialog_id: hiddenDialogs[id],
      date_sent: Math.floor(Date.now() / 1000),

      notification_type: 5,
      full_name: User.contact.full_name,
    }});

    // delete duplicate contact item
    li = $('.dialog-item[data-id="'+id+'"]');
    list = li.parents('ul');
    li.remove();
    isSectionEmpty(list);

    DialogView.addDialogItem({
      id: hiddenDialogs[id],
      type: 3,
      occupants_ids: [id],
    });
  },

  sendReject: function(objDom) {
    var jid = objDom.parents('li').data('jid'),
        id = QB.chat.helpers.getIdFromNode(jid),
        list = objDom.parents('ul'),
        notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
        hiddenDialogs = JSON.parse(sessionStorage['QM.hiddenDialogs']);

    objDom.parents('li').remove();
    isSectionEmpty(list);

    // update notConfirmed people list
    delete notConfirmed[id];
    ContactList.saveNotConfirmed(notConfirmed);

    QB.chat.roster.reject(jid);
    // send notification about reject
    QB.chat.send(jid, {type: 'chat', extension: {
      save_to_history: 1,
      dialog_id: hiddenDialogs[id],
      date_sent: Math.floor(Date.now() / 1000),

      notification_type: 4,
      full_name: User.contact.full_name,
    }});
  },

  sendDelete: function(objDom) {
    var id = objDom.data('id'),
        jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId),
        li = $('.dialog-item[data-id="'+id+'"]'),
        list = li.parents('ul'),
        dialog_id = li.data('dialog'),
        roster = JSON.parse(sessionStorage['QM.roster']);

    li.remove();
    isSectionEmpty(list);

    // update roster
    roster[id] = {
      subscription: 'none',
      ask: null
    };
    ContactList.saveRoster(roster);

    // delete dialog messages
    localStorage.removeItem('QM.dialog-' + dialog_id);

    QB.chat.roster.remove(jid);
    // send notification about reject
    QB.chat.send(jid, {type: 'chat', extension: {
      save_to_history: 1,
      dialog_id: dialog_id,
      date_sent: Math.floor(Date.now() / 1000),

      notification_type: 4,
      full_name: User.contact.full_name,
    }});
  },

  // callbacks

  onSubscribe: function(id) {
    var html,
        contacts = ContactList.contacts,
        roster = JSON.parse(sessionStorage['QM.roster']),
        notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
        jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId);

    // update roster
    roster[id] = {
      subscription: 'none'
    };
    ContactList.saveRoster(roster);

    // update notConfirmed people list
    notConfirmed[id] = true;
    ContactList.saveNotConfirmed(notConfirmed);

    ContactList.add([id], null, function() {
      html = '<li class="list-item" data-jid="'+jid+'">';
      html += '<a class="contact l-flexbox" href="#">';
      html += '<div class="l-flexbox_inline">';
      html += '<img class="contact-avatar avatar" src="'+contacts[id].avatar_url+'" alt="user">';
      html += '<span class="name">'+contacts[id].full_name+'</span>';
      html += '</div><div class="request-controls l-flexbox">';
      html += '<button class="request-button request-button_cancel">&#10005;</button>';
      html += '<button class="request-button request-button_ok">&#10003;</button>';
      html += '</div></a></li>';

      $('#requestsList').removeClass('is-hidden').find('ul').prepend(html);
      $('#emptyList').addClass('is-hidden');
    });
  },

  onConfirm: function(id) {
    var roster = JSON.parse(sessionStorage['QM.roster']),
        dialogItem = $('.dialog-item[data-id="'+id+'"]');

    // update roster
    roster[id] = {
      subscription: 'both',
      ask: null
    };
    ContactList.saveRoster(roster);

    dialogItem.find('.status').removeClass('status_request');
  },

  onReject: function(id) {
    var dialogItem = $('.dialog-item[data-id="'+id+'"]'),
        roster = JSON.parse(sessionStorage['QM.roster']);

    // update roster
    roster[id] = {
      subscription: 'none',
      ask: null
    };
    ContactList.saveRoster(roster);

    dialogItem.find('.status').removeClass('status_online').addClass('status_request');
  },

  onPresence: function(id, type) {
    var dialogItem = $('.dialog-item[data-id="'+id+'"]'),
        roster = JSON.parse(sessionStorage['QM.roster']);
    
    // update roster
    roster[id].status = type ? false : true;
    ContactList.saveRoster(roster);

    if (type)
      dialogItem.find('.status').removeClass('status_online');
    else
      dialogItem.find('.status').addClass('status_online');
  }

};

/* Private
---------------------------------------------------------------------- */
var openPopup = function(objDom) {
  objDom.add('.popups').addClass('is-overlay');
};

function scrollbar(list, self) {
  list.mCustomScrollbar({
    theme: 'minimal-dark',
    scrollInertia: 150,
    callbacks: {
      onTotalScroll: function() {
        ajaxDownloading(list, self);
      },
      alwaysTriggerOffsets: false
    }
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
  var roster = JSON.parse(sessionStorage['QM.roster']),
      notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {},
      item;

  results.forEach(function(contact) {
    var rosterItem = roster[contact.id];

    item = '<li class="list-item" data-jid="'+contact.user_jid+'">';
    item += '<a class="contact l-flexbox" href="#">';
    item += '<div class="l-flexbox_inline">';
    item += '<img class="contact-avatar avatar" src="'+contact.avatar_url+'" alt="user">';
    item += '<span class="name">'+contact.full_name+'</span>';
    item += '</div>';
    if (!rosterItem || (!rosterItem.ask && rosterItem.subscription === 'none' && !notConfirmed[contact.id])) {
      item += '<button class="send-request"><img class="icon-normal" src="images/icon-request.png" alt="request">';
      item += '<img class="icon-active" src="images/icon-request_active.png" alt="request"></button>';
    }
    item += '</a></li>';

    list.find('.mCSB_container').append(item);
    list.removeClass('is-hidden').siblings('.popup-elem').addClass('is-hidden');
  });

  self.removeDataSpinner();
}

function isSectionEmpty(list) {
  if (list.contents().length === 0) {
    list.parent().addClass('is-hidden');

    if ($('#requestsList').is('.is-hidden') &&
        $('#recentList').is('.is-hidden') &&
        $('#historyList').is('.is-hidden')) {
      
      $('#emptyList').removeClass('is-hidden');
    }
  }
}
