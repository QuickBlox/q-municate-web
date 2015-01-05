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
      $('#profile').find('.avatar').css('background-image', "url("+User.contact.avatar_url+")");
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

      popup.find('.userDetails-avatar').css('background-image', 'url('+contact.avatar_url+')');
      popup.find('.userDetails-filename').text(contact.full_name);

      if (contact.status) {
        popup.find('.userDetails-status').text(contact.status);
      }

      if (chatStatus && chatStatus.status)
        popup.find('.userDetails-chatStatus').html('<span class="status status_online"></span><span class="status_text">Online</span>');
      else
        popup.find('.userDetails-chatStatus').html('<span class="status"></span><span class="status_text">Offline</span>');

      popup.find('.writeMessage').data('id', userId);

      if (contact.phone) {
        popup.find('.userDetails-field').html(
          '<span class="userDetails-label">Phone:</span><span class="userDetails-phone">'+contact.phone+'</span>'
        );
      }
    },

    buildProfile: function() {
      var popup = $('#popupProfile');

      popup.find('.userDetails-avatar').css('background-image', 'url('+User.contact.avatar_url+')');
      popup.find('.userProfile-filename').text(User.contact.full_name);

      if (User.contact.status) {
        popup.find('.userProfile-status-val').text(User.contact.status);
      } else {
        popup.find('.userProfile-status-val').text('[Empty field]');
      }

      popup.find('.userProfile-email').text(User.contact.email);

      if (User.contact.phone) {
        popup.find('.userProfile-phone').text(User.contact.phone);
      } else {
        popup.find('.userProfile-phone').text('[Empty field]');
      }

      if (User.contact.facebook_id) {
        popup.find('.userProfile-field-facebook').html(
          '<span class="userDetails-label">Facebook:</span><span class="userProfile-facebook">Connected</span>'
        );
      } else {
        popup.find('.userProfile-field-facebook').html(
          '<span class="userDetails-label">Facebook:</span><span class="userProfile-facebook">Not connected</span><button class="btn_userProfile btn_userProfile_connect">Connect</button>'
        );
      }
    },

    updateUserProfile: function() {
      var objDom = $('#popupProfile'),
          file = objDom.find('.btn_userProfile_file')[0],
          userData, params = {};

      userData = {
        full_name: objDom.find('.userProfile-filename').text() || null,
        phone: (objDom.find('.userProfile-phone').text() === '[Empty field]' ? null : objDom.find('.userProfile-phone').text()) || null,
        status: (objDom.find('.userProfile-status-val').text() === '[Empty field]' ? null : objDom.find('.userProfile-status-val').text()) || null,
      };
      console.log(userData);

      if (userData.full_name || userData.phone || userData.status || file.files[0]) {
        if (userData.full_name) params.full_name = userData.full_name;
        if (userData.phone) params.phone = userData.phone;
        // if (userData.status) params.custom_data = userData.full_name;
        QB.users.update(User.contact.id, params, function(err, res) {
          if (res) {
            console.log(res);
            User.contact = Contact.create(res);
            if (userData.status) User.contact.status = userData.status;
            if (file.files[0]) {
              User.contact.avatar_url = URL.createObjectURL(file.files[0]);
              $('#profile').find('.avatar').css('background-image', "url("+User.contact.avatar_url+")");
            }
            User.rememberMe();
          }
        });
      }
    },

    addFBAccount: function(token) {
      var popup = $('#popupProfile');

      FB.api('/me', function (response) {
        console.log(1111111111, response);
        popup.find('.userProfile-field-facebook').html(
          '<span class="userDetails-label">Facebook:</span><span class="userProfile-facebook">Connected</span>'
        );
      });
    },

    smilePopover: function(objDom) {
      if (objDom.find('img').length === 1)
        objDom.addClass('is-active').append('<img src="images/icon-smile_active.svg" alt="smile">').find('*:first').addClass('is-hidden');
      
      $('.popover_smile').show(150);
    },

    logout: function() {
      var DialogView = this.app.views.Dialog;

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
