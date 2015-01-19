/*
 * Q-municate chat application
 *
 * User View Module
 *
 */

define(['jquery', 'config', 'quickblox'], function($, QMCONFIG, QB) {

  var User, ContactList, Contact,
      FBCallback = null;

  function UserView(app) {
    this.app = app;
    User = this.app.models.User;
    Contact = this.app.models.Contact;
    ContactList = this.app.models.ContactList;
  }

  UserView.prototype = {

    signupQB: function() {
      switchPage($('#signUpPage'));
    },

    loginQB: function() {
      switchPage($('#loginPage'));
    },

    forgot: function() {
      switchPage($('#forgotPage'));
    },

    connectFB: function(token) {
      User.connectFB(token);
    },

    signupForm: function() {
      clearErrors();
      User.signup();
    },

    loginForm: function() {
      clearErrors();
      User.login();
    },

    forgotForm: function() {
      clearErrors();
      User.forgot();
    },

    resetForm: function() {
      clearErrors();
      User.resetPass();
    },

    autologin: function() {
      switchPage($('#loginPage'));
      User.autologin();
    },

    createSpinner: function() {
      var spinnerBlock = '<div class="l-spinner"><div class="spinner">';
      spinnerBlock += '<div class="spinner-dot1"></div><div class="spinner-dot2"></div>';
      spinnerBlock += '</div></div>';

      $('section:visible form').addClass('is-hidden').after(spinnerBlock);
    },

    removeSpinner: function() {
      $('section:visible form').removeClass('is-hidden').next('.l-spinner').remove();
    },

    successFormCallback: function() {
      this.removeSpinner();
      // $('#profile').find('img').attr('src', User.contact.avatar_url);
      $('#profile').find('.avatar').addClass('profileUserAvatar').css('background-image', "url("+User.contact.avatar_url+")");
      $('#profile').find('.avatar').attr('data-id', User.contact.id);
      switchPage($('#mainPage'));
    },

    successSendEmailCallback: function() {
      var alert = '<div class="note l-form l-flexbox l-flexbox_column">';
      alert += '<span class="text text_alert text_alert_success">Success!</span>';
      alert += '<span class="text">Please check your email and click a link in the letter in order to reset your password</span>';
      alert += '</div>';

      this.removeSpinner();
      $('section:visible form').addClass('is-hidden').after(alert);
    },

    getFBStatus: function(callback) {
      if (typeof FB === 'undefined') {
        // Wait until FB SDK will be downloaded and then calling this function again
        FBCallback = callback;
        sessionStorage.setItem('QM.is_getFBStatus', true);
        return false;
      } else {
        callback = callback || FBCallback;
        FBCallback = null;

        FB.getLoginStatus(function(response) {
          if (QMCONFIG.debug) console.log('FB status response', response);
          if (callback) {
            // situation when you are recovering QB session via FB
            // and FB accessToken has expired
            if (response.status === 'connected') {
              callback(response.authResponse.accessToken);
            } else {
              FB.login(function(response) {
                if (QMCONFIG.debug) console.log('FB authResponse', response);
                if (response.status === 'connected')
                  callback(response.authResponse.accessToken);
              });
            }
          }
        }, true);
      }
    },

    profilePopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_profile popover">';
      html += '<li class="list-item"><a id="userProfile" class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a id="logout" class="list-actions-action" href="#">Log Out</a></li>';
      html += '</ul>';

      objDom.after(html);
      appearAnimation();
    },

    contactPopover: function(objDom) {
      var ids = objDom.parent().data('id'),
          dialog_id = objDom.parent().data('dialog'),
          roster = ContactList.roster,
          dialogs = ContactList.dialogs,
          html;

      html = '<ul class="list-actions list-actions_contacts popover">';
      
      if (dialogs[dialog_id].type === 3 && roster[ids] && roster[ids].subscription !== 'none') {
        html += '<li class="list-item"><a class="videoCall list-actions-action writeMessage" data-id="'+ids+'" href="#">Video call</a></li>';
        html += '<li class="list-item"><a class="audioCall list-actions-action writeMessage" data-id="'+ids+'" href="#">Audio call</a></li>';
        html += '<li class="list-item"><a class="list-actions-action createGroupChat" data-ids="'+ids+'" data-private="1" href="#">Add people</a></li>';
      } else if (dialogs[dialog_id].type !== 3)
        html += '<li class="list-item"><a class="list-actions-action addToGroupChat" data-group="true" data-ids="'+dialogs[dialog_id].occupants_ids+'" data-dialog="'+dialog_id+'" href="#">Add people</a></li>';
      
      if (dialogs[dialog_id].type === 3) {
        html += '<li class="list-item"><a class="list-actions-action userDetails" data-id="'+ids+'" href="#">Profile</a></li>';
        html += '<li class="list-item"><a class="deleteContact list-actions-action" href="#">Delete contact</a></li>';
      } else
        html += '<li class="list-item"><a class="leaveChat list-actions-action" data-group="true" href="#">Leave chat</a></li>';
      
      html += '</ul>';

      objDom.after(html).parent().addClass('is-contextmenu');
      appearAnimation();
    },

    occupantPopover: function(objDom, e) {
      var html,
          id = objDom.data('id'),
          jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId),
          roster = ContactList.roster,
          position = e.currentTarget.getBoundingClientRect();

      html = '<ul class="list-actions list-actions_occupants popover">';
      if (!roster[id] || (roster[id].subscription === 'none' && !roster[id].ask)) {
        html += '<li class="list-item" data-jid="'+jid+'"><a class="list-actions-action requestAction" data-id="'+id+'" href="#">Send request</a></li>';
      } else {
        html += '<li class="list-item"><a class="videoCall list-actions-action writeMessage" data-id="'+id+'" href="#">Video call</a></li>';
        html += '<li class="list-item"><a class="audioCall list-actions-action writeMessage" data-id="'+id+'" href="#">Audio call</a></li>';
        html += '<li class="list-item"><a class="list-actions-action writeMessage" data-id="'+id+'" href="#">Write message</a></li>';
        html += '<li class="list-item"><a class="list-actions-action userDetails" data-id="'+id+'" href="#">Profile</a></li>';
      }
      html += '</ul>';

      $('body').append(html);
      appearAnimation();

      objDom.addClass('is-active');
      $('.list-actions_occupants').offset({top: position.top, left: position.left});
    },

    buildDetails: function(userId) {
      var popup = $('#popupDetails'),
          contact = ContactList.contacts[userId],
          roster = ContactList.roster,
          chatStatus = roster[userId] ? roster[userId] : null;

      if (!!navigator.userAgent.match(/Firefox/)) {
        popup.find('.userDetails-controls button').css('padding', '0 12px');
      }

      popup.find('.userDetails-avatar').attr('data-id', userId).css('background-image', 'url('+contact.avatar_url+')');
      popup.find('.userDetails-filename').attr('data-id', userId).text(contact.full_name);

      popup.find('.userDetails-status').attr('data-id', userId).text(contact.status);

      if (chatStatus && chatStatus.status)
        popup.find('.userDetails-chatStatus').html('<span class="status status_online"></span><span class="status_text">Online</span>');
      else
        popup.find('.userDetails-chatStatus').html('<span class="status"></span><span class="status_text">Offline</span>');

      popup.find('.writeMessage').data('id', userId);

      popup.find('.userDetails-field').attr('data-id', userId).html(
        contact.phone ?
        '<span class="userDetails-label">Phone:</span><span class="userDetails-phone">'+contact.phone+'</span>' :
        ''
      );

      this.getNewProfile(userId);
    },

    getNewProfile: function(userId) {
      var QBApiCalls = this.app.service,
          Contact = this.app.models.Contact,
          ContactList = this.app.models.ContactList;

      QBApiCalls.getUser(userId, function(user) {
        var contact = Contact.create(user);
        ContactList.contacts[contact.id] = contact;

        $('.profileUserName[data-id="'+contact.id+'"]').text(contact.full_name);
        $('.profileUserStatus[data-id="'+contact.id+'"]').text(contact.status);
        if (contact.phone) {
          $('.profileUserPhone[data-id="'+contact.id+'"]').html(
            '<span class="userDetails-label">Phone:</span><span class="userDetails-phone">'+contact.phone+'</span>'
          );
        }
        $('.profileUserAvatar[data-id="'+contact.id+'"]').css('background-image', 'url('+contact.avatar_url+')');

        localStorage.setItem('QM.contact-' + contact.id, JSON.stringify(contact));
      });
    },

    smilePopover: function(objDom) {
      if (objDom.find('img').length === 1)
        objDom.addClass('is-active').append('<img src="images/icon-smile_active.svg" alt="smile">').find('*:first').addClass('is-hidden');
      
      $('.popover_smile').show(150);
    },

    logout: function() {
      var DialogView = this.app.views.Dialog;

      $('.mediacall .btn_hangup').click();

      User.logout(function() {
        switchOnWelcomePage();
        $('#capBox').removeClass('is-hidden');
        $('.l-chat').remove();
        if (QMCONFIG.debug) console.log('current User and Session were destroyed');
        DialogView.logoutWithClearData();
      });
    },

    localSearch: function(form) {
      var val = form.find('input[type="search"]').val().trim().toLowerCase();
      
      if (val.length > 0) {
        // if (QMCONFIG.debug) console.log('local search =', val);
        $('#searchList').removeClass('is-hidden').siblings('section').addClass('is-hidden');
        $('#searchList ul').html('').add('#searchList .note').removeClass('is-hidden');

        $('#recentList, #historyList').find('.dialog-item').each(function() {
          var name = $(this).find('.name').text().toLowerCase(),
              li = $(this).clone();

          if (name.indexOf(val) > -1) {
            $('#searchList ul').append(li);
            $('#searchList .note').addClass('is-hidden');
          }
          
        });

        if ($('#searchList ul').find('li').length === 0)
          $('#searchList .note').removeClass('is-hidden').siblings('ul').addClass('is-hidden');
        
      } else {
        $('#searchList').addClass('is-hidden');
        $('#recentList, #historyList, #requestsList').each(function() {
          if ($(this).find('.list-item').length > 0)
            $(this).removeClass('is-hidden');
        });
        if ($('.l-list-wrap section:not(#searchList) .list-item').length === 0)
          $('#emptyList').removeClass('is-hidden');
      }
    },

    friendsSearch: function(form) {
      var val = form.find('input[type="search"]').val().trim().toLowerCase(),
          result = form.next();
      
      result.find('ul').removeClass('is-hidden').siblings().addClass('is-hidden');
      result.find('ul li').removeClass('is-hidden');

      if (val.length > 0) {
        result.find('ul li').each(function() {
          var name = $(this).find('.name').text().toLowerCase(),
              li = $(this);

          if (name.indexOf(val) === -1)
            li.addClass('is-hidden');
        });

        if (result.find('ul li:visible').length === 0)
          result.find('.note').removeClass('is-hidden').siblings().addClass('is-hidden');
      }
    }

  };

  /* Private
  ---------------------------------------------------------------------- */
  var clearErrors = function() {
    $('.is-error').removeClass('is-error');
  };

  var switchPage = function(page) {
    $('body').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');

    // reset form
    clearErrors();
    $('.no-connection').addClass('is-hidden');
    page.find('input').val('');
    if (!page.is('#mainPage')) {
      page.find('form').removeClass('is-hidden').next('.l-form').remove(); // reset Forgot form after success sending of letter
      // page.find('input:file').prev().find('img').attr('src', QMCONFIG.defAvatar.url).siblings('span').text(QMCONFIG.defAvatar.caption);
      page.find('input:file').prev().find('.avatar').css('background-image', "url("+QMCONFIG.defAvatar.url+")").siblings('span').text(QMCONFIG.defAvatar.caption);
      page.find('input:checkbox').prop('checked', false);
    }
  };

  var switchOnWelcomePage = function() {
    $('body').addClass('is-welcome');
    $('#welcomePage').removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  var appearAnimation = function() {
    $('.popover:not(.popover_smile)').show(150);
  };

  return UserView;

});
