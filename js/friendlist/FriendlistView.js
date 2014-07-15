/*
 * Q-municate chat application
 *
 * Friendlist View
 *
 */

var Friendlist = require('./FriendlistModel'),
    QBApiCalls = require('../qbApiCalls');

module.exports = (function() {
  var friendlist;

  return {

    createDataSpinner: function() {
      var spinnerBlock = '<div class="spinner_bounce">';
      spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
      spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
      spinnerBlock += '</div>';

      $('.popup:visible ul').after(spinnerBlock).siblings('.note').addClass('is-hidden');
    },

    removeDataSpinner: function() {
      $('.spinner_bounce').remove();
    },

    globalSearch: function(form) {
      var val = form.find('input[type="search"]').val().trim(),
          listObj = $('.popup:visible ul'),
          self = this;

      if (val.length > 0) {
        self.createDataSpinner();
        listObj.addClass('is-hidden').find('.mCSB_container').empty();
        $('.spinner_bounce').addClass('is-empty');

        QBApiCalls.getUser({full_name: val}, function(data) {
          sessionStorage.setItem('QM.search.pages', Math.ceil(data.total_entries / data.per_page));
          sessionStorage.setItem('QM.search.value', val); 

          friendlist = new Friendlist;
          friendlist.getContacts(data.items);

          // ajax downloading of data through scroll
          scrollbar(listObj, friendlist, self);

          createListResults(listObj, friendlist, self);
          listObj.removeClass('is-hidden').siblings('.list').addClass('is-hidden');

          if (QMCONFIG.debug) console.log('Search results', friendlist);
        });
      }
    }

  };
})();

/* Private
---------------------------------------------------------------------- */
function createListResults(listObj, friendlist, self) {
  var item;

  friendlist.contacts.forEach(function(contact) {
    item = '<li class="list-item">';
    item += '<a class="contact l-flexbox" href="#">';
    item += '<div class="l-flexbox_inline">';
    item += '<img class="contact-avatar avatar" src="' + contact.avatar_url + '" alt="user">';
    item += '<span class="name">' + contact.full_name + '</span>';
    item += '</div>';
    item += '<button class="sent-request"><img src="images/icon-request.png" alt="request"></button>';
    item += '</a></li>';
    // <span class="sent-request l-flexbox">Request Sent</span>

    listObj.find('.mCSB_container').append(item);
  });

  self.removeDataSpinner();
}

function scrollbar(listObj, friendlist, self) {
  listObj.mCustomScrollbar({
    theme: 'minimal-dark',
    scrollInertia: 150,
    callbacks: {
      onTotalScroll: function() { ajaxDownloading(listObj, friendlist, self); },
      alwaysTriggerOffsets: false
    }
  });
}

function ajaxDownloading(listObj, friendlist, self) {
  var page = listObj.find('li').length / 2 / 10;

  if (++page <= sessionStorage['QM.search.pages']) {
    self.createDataSpinner();
    QBApiCalls.getUser({full_name: sessionStorage['QM.search.value'], page: page}, function(data) {
      friendlist.getContacts(data.items);
      createListResults(listObj, friendlist, self);
      if (QMCONFIG.debug) console.log('Search results', friendlist);
    });
  }
}
