/*
 * Q-municate chat application
 *
 * Friendlist View
 *
 */

var Friendlist = require('./FriendlistModel'),
    friendlist;

module.exports = (function() {

  return {

    createDataSpinner: function(list) {
      var spinnerBlock = '<div class="popup-elem spinner_bounce">';
      spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
      spinnerBlock += '</div>';

      list.after(spinnerBlock);
    },

    removeDataSpinner: function() {
      $('.spinner_bounce').remove();
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
        friendlist = new Friendlist;

        popup.find('.popup-elem').addClass('is-hidden');
        popup.find('.mCSB_container').empty();

        scrollbar(list, self);
        self.createDataSpinner(list);
        $('.spinner_bounce').removeClass('is-hidden').addClass('is-empty');

        sessionStorage.setItem('QM.search.value', val);
        sessionStorage.setItem('QM.search.page', 1);

        friendlist.globalSearch(function() {
          createListResults(list, friendlist, self);
        });
      }
    },

    sendSubscribeRequest: function(objDom) {
      var jid = objDom.data('jid');
      objDom.after('<span class="sent-request l-flexbox">Request Sent</span>');
      objDom.remove();
      friendlist.sendSubscribe(jid);
    },

    onSubscribe: function(userId) {
      if (QMCONFIG.debug) console.log('Subscribe request from', userId);
      var html = '<li class="list-item">';
      html += '<a class="contact l-flexbox" href="#">';
      html += '<div class="l-flexbox_inline">';
      html += '<img class="contact-avatar avatar" src="images/ava-single.png" alt="user">';
      html += '<span class="name">Test user</span>';
      html += '</div><div class="request-controls l-flexbox">';
      html += '<button class="request-button request-button_cancel">&#10005;</button>';
      html += '<button class="request-button request-button_ok">&#10003;</button>';
      html += '</div></a></li>';

      $('#requestsList').removeClass('is-hidden').find('ul').prepend(html);
    }

  };
})();

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

function createListResults(list, friendlist, self) {
  var item;

  friendlist.contacts.forEach(function(contact) {
    item = '<li class="list-item">';
    item += '<a class="contact l-flexbox" href="#">';
    item += '<div class="l-flexbox_inline">';
    item += '<img class="contact-avatar avatar" src="' + contact.avatar_url + '" alt="user">';
    item += '<span class="name">' + contact.full_name + '</span>';
    item += '</div>';
    item += '<button class="sent-request" data-jid='+contact.xmpp_jid+'><img class="icon-normal" src="images/icon-request.png" alt="request">';
    item += '<img class="icon-active" src="images/icon-request_active.png" alt="request"></button>';
    item += '</a></li>';

    list.find('.mCSB_container').append(item);
    list.removeClass('is-hidden').siblings('.popup-elem').addClass('is-hidden');
  });

  self.removeDataSpinner();
}

// ajax downloading of data through scroll
function ajaxDownloading(list, self) {
  var page = parseInt(sessionStorage['QM.search.page']),
      allPages = parseInt(sessionStorage['QM.search.allPages']);

  if (page <= allPages) {
    self.createDataSpinner(list);
    friendlist.globalSearch(function() {
      createListResults(list, friendlist, self);
    });
  }
}
