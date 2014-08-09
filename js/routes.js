/*
 * Q-municate chat application
 *
 * Routes Module
 *
 */

module.exports = Routes;

var Session, UserView, ContactListView, DialogView, MessageView, AttachView;

function Routes(app) {
  this.app = app;
  
  Session = this.app.models.Session;
  UserView = this.app.views.User;
  ContactListView = this.app.views.ContactList;
  DialogView = this.app.views.Dialog;
  MessageView = this.app.views.Message;
  AttachView = this.app.views.Attach;
}

Routes.prototype = {

  init: function() {

    $(document).on('click', function(event) {
      clickBehaviour(event);
    });

    $('#signup-avatar:file').on('change', function() {
      changeInputFile($(this));
    });

    /* attachments
    ----------------------------------------------------- */
    $('.l-workspace-wrap').on('click', '.btn_message_attach', function() {
      $(this).next().click();
    });

    $('.l-workspace-wrap').on('change', '.attachment', function() {
      AttachView.changeInput($(this));
    });

    $('.l-workspace-wrap').on('click', '.attach-cancel', function(event) {
      event.preventDefault();
      AttachView.cancel($(this));
    });

    $('.l-workspace-wrap').on('click', '.preview', function() {
      var name = $(this).data('name'),
          url = $(this).data('url'),
          uid = $(this).data('uid');

      if ($(this).is('.preview-photo')) {
        $('.attach-photo').removeClass('is-hidden').siblings('.attach-video').addClass('is-hidden');
      } else {
        $('.attach-video').removeClass('is-hidden').siblings('.attach-photo').addClass('is-hidden');
      }
      openAttachPopup($('#popupAttach'), name, url, uid);
    });

    /* scrollbars
    ----------------------------------------------------- */
    occupantScrollbar();

    /* welcome page
    ----------------------------------------------------- */
    $('#signupFB, #loginFB').on('click', function(event) {
      if (QMCONFIG.debug) console.log('connect with FB');
      event.preventDefault();

      // NOTE!! You should use FB.login method instead FB.getLoginStatus
      // and your browser won't block FB Login popup
      FB.login(function(response) {
        if (QMCONFIG.debug) console.log('FB authResponse', response);
        if (response.status === 'connected') {
          UserView.connectFB(response.authResponse.accessToken);
        }
      }, {scope: QMCONFIG.fbAccount.scope});
    });

    $('#signupQB').on('click', function() {
      if (QMCONFIG.debug) console.log('signup with QB');
      UserView.signupQB();
    });

    $('#loginQB').on('click', function(event) {
      if (QMCONFIG.debug) console.log('login wih QB');
      event.preventDefault();
      UserView.loginQB();
    });

    /* signup page
    ----------------------------------------------------- */
    $('#signupForm').on('click', function(event) {
      if (QMCONFIG.debug) console.log('create user');
      event.preventDefault();
      UserView.signupForm();
    });

    /* login page
    ----------------------------------------------------- */
    $('#forgot').on('click', function(event) {
      if (QMCONFIG.debug) console.log('forgot password');
      event.preventDefault();
      UserView.forgot();
    });

    $('#loginForm').on('click', function(event) {
      if (QMCONFIG.debug) console.log('authorize user');
      event.preventDefault();
      UserView.loginForm();
    });

    /* forgot and reset page
    ----------------------------------------------------- */
    $('#forgotForm').on('click', function(event) {
      if (QMCONFIG.debug) console.log('send letter');
      event.preventDefault();
      UserView.forgotForm();
    });

    $('#resetForm').on('click', function(event) {
      if (QMCONFIG.debug) console.log('reset password');
      event.preventDefault();
      UserView.resetForm();
    });

    /* popovers
    ----------------------------------------------------- */
    $('#profile').on('click', function(event) {
      event.preventDefault();
      removePopover();
      UserView.profilePopover($(this));
    });

    $('.list_contextmenu').on('contextmenu', '.contact', function(event) {
      event.preventDefault();
      removePopover();
      UserView.contactPopover($(this));
    });

    $('.l-workspace-wrap').on('click', '.occupant', function(event) {
      event.preventDefault();
      removePopover();
      UserView.occupantPopover($(this), event);
    });

    $('.l-workspace-wrap').on('click', '.btn_message_smile', function() {
      removePopover();
      UserView.smilePopover($(this));
    });

    /* popups
    ----------------------------------------------------- */
    $('.header-links-item').on('click', '#logout', function(event) {
      event.preventDefault();
      openPopup($('#popupLogout'));
    });

    $('.list, .l-workspace-wrap').on('click', '.deleteContact', function(event) {
      event.preventDefault();
      var id = $(this).parents('.presence-listener').data('id');
      openPopup($('#popupDelete'), id);
    });

    $('.list, .l-workspace-wrap').on('click', '.leaveChat', function(event) {
      event.preventDefault();
      var parent = $(this).parents('.presence-listener')[0] ? $(this).parents('.presence-listener') : $(this).parents('.is-group');
      var dialog_id = parent.data('dialog');
      openPopup($('#popupLeave'), null, dialog_id);
    });

    $('#logoutConfirm').on('click', function() {
      UserView.logout();
    });

    $('#deleteConfirm').on('click', function() {
      if (QMCONFIG.debug) console.log('delete contact');
      ContactListView.sendDelete($(this));
    });

    $('#leaveConfirm').on('click', function() {
      if (QMCONFIG.debug) console.log('leave chat');
      DialogView.leaveGroupChat($(this));
    });

    $('.popup-control-button, .btn_popup_private').on('click', function(event) {
      event.preventDefault();
      closePopup();
    });

    $('.search').on('click', function() {
      if (QMCONFIG.debug) console.log('global search');
      ContactListView.globalPopup();
    });

    $('#mainPage').on('click', '.createGroupChat', function(event) {
      event.preventDefault();
      if (QMCONFIG.debug) console.log('add people to groupchat');
      ContactListView.addContactsToChat($(this));
    });

    /* search
    ----------------------------------------------------- */
    $('#globalSearch').on('submit', function(event) {
      event.preventDefault();
      ContactListView.globalSearch($(this));
    });

    $('.localSearch').on('keyup search submit', function(event) {
      event.preventDefault();
      var type = event.type,
          code = event.keyCode; // code=27 (Esc key), code=13 (Enter key)

      if ((type === 'keyup' && code !== 27 && code !== 13) || (type === 'search')) {
        if (this.id === 'searchContacts')
          UserView.localSearch($(this));
        else
          UserView.friendsSearch($(this));
      }
    });

    /* subscriptions
    ----------------------------------------------------- */
    $('.list_contacts').on('click', 'button.send-request', function() {
      if (QMCONFIG.debug) console.log('send subscribe');
      ContactListView.sendSubscribe($(this));
    });

    $('.l-workspace-wrap').on('click', '.btn_request_again', function() {
      if (QMCONFIG.debug) console.log('send subscribe');
      ContactListView.sendSubscribe($(this), true);
    });

    $('body').on('click', '.requestAction', function(event) {
      event.preventDefault();
      if (QMCONFIG.debug) console.log('send subscribe');
      ContactListView.sendSubscribe($(this));
    });

    $('.list').on('click', '.request-button_ok', function() {
      if (QMCONFIG.debug) console.log('send confirm');
      ContactListView.sendConfirm($(this));
    });

    $('.list').on('click', '.request-button_cancel', function() {
      if (QMCONFIG.debug) console.log('send reject');
      ContactListView.sendReject($(this));
    });

    /* dialogs
    ----------------------------------------------------- */
    $('.list').on('click', '.contact', function(event) {
      if (event.target.tagName !== 'INPUT')
        event.preventDefault();
    });

    $('#popupContacts').on('click', '.contact', function() {
      var obj = $(this).parent(),
          popup = obj.parents('.popup'),
          len;

      if (obj.is('.is-chosen'))
        obj.removeClass('is-chosen').find('input').prop('checked', false);
      else
        obj.addClass('is-chosen').find('input').prop('checked', true);

      len = obj.parent().find('li.is-chosen').length;
      if (len === 1 && !popup.is('.is-addition')) {
        popup.removeClass('not-selected');
        popup.find('.btn_popup_private').removeClass('is-hidden').siblings().addClass('is-hidden');
      } else if (len >= 1) {
        popup.removeClass('not-selected');
        popup.find('.btn_popup_group').removeClass('is-hidden').siblings().addClass('is-hidden');
      } else {
        popup.addClass('not-selected');
      }
    });

    $('.list_contextmenu').on('click', '.contact', function() {
      DialogView.htmlBuild($(this));
    });

    $('#popupContacts .btn_popup_private').on('click', function() {
      var id = $('#popupContacts .is-chosen').data('id'),
          dialogItem = $('.dialog-item[data-id="'+id+'"]').find('.contact');
      
      DialogView.htmlBuild(dialogItem);
    });

    $('body').on('click', '.writeMessage', function(event) {
      event.preventDefault();

      var id = $(this).data('id'),
          dialogItem = $('.dialog-item[data-id="'+id+'"]').find('.contact');
      
      DialogView.htmlBuild(dialogItem);
    });

    $('#popupContacts .btn_popup_group').on('click', function() {
      DialogView.createGroupChat();
    });

    $('.l-workspace-wrap').on('keydown', '.l-message', function(event) {
      var shiftKey = event.shiftKey,
          code = event.keyCode; // code=27 (Esc key), code=13 (Enter key)

      if (code === 13 && !shiftKey) {
        MessageView.sendMessage($(this));
      }
    });

    $('.l-workspace-wrap').on('submit', '.l-message', function(event) {
      event.preventDefault();
    });

    $('#home').on('click', function(event) {
      event.preventDefault();
      $('#capBox').removeClass('is-hidden').siblings().addClass('is-hidden');
      $('.is-selected').removeClass('is-selected');
    });

    $('.l-workspace-wrap').on('click', '.groupTitle', function() {
      var chat = $('.l-chat:visible');
      if (chat.find('.triangle_up').is('.is-hidden')) {
        chat.find('.triangle_up').removeClass('is-hidden').siblings('.triangle').addClass('is-hidden');
        chat.find('.chat-occupants-wrap').addClass('is-overlay');
        chat.find('.l-chat-content').addClass('l-chat-content_min');
      } else {
        chat.find('.triangle_down').removeClass('is-hidden').siblings('.triangle').addClass('is-hidden');
        chat.find('.chat-occupants-wrap').removeClass('is-overlay');
        chat.find('.l-chat-content').removeClass('l-chat-content_min');
      }
    });

    /* temporary routes
    ----------------------------------------------------- */
    $('#share').on('click', function(event) {
      event.preventDefault();
    });

  }
};

/* Private
---------------------------------------------------------------------- */
function occupantScrollbar() {
  $('.chat-occupants').mCustomScrollbar({
    theme: 'minimal-dark',
    scrollInertia: 50,
    live: true
  });
}

// Checking if the target is not an object run popover
function clickBehaviour(e) {
  var objDom = $(e.target);

  if (objDom.is('#profile, #profile *, .occupant, .occupant *, .btn_message_smile, .btn_message_smile *') || e.which === 3) {
    return false;
  } else {
    removePopover();

    if (objDom.is('.popups') && !$('.popup.is-overlay').is('.is-open')) {
      closePopup();
    } else {
      return false;
    }
  }
}

function changeInputFile(objDom) {
  var URL = window.webkitURL || window.URL,
      file = objDom[0].files[0],
      src = file ? URL.createObjectURL(file) : QMCONFIG.defAvatar.url,
      fileName = file ? file.name : QMCONFIG.defAvatar.caption;
  
  objDom.prev().find('img').attr('src', src).siblings('span').text(fileName);
  if (typeof file !== 'undefined') URL.revokeObjectURL(src);
}

function removePopover() {
  $('.is-contextmenu').removeClass('is-contextmenu');
  $('.is-active').removeClass('is-active');
  $('.btn_message_smile .is-hidden').removeClass('is-hidden').siblings().remove();
  $('.popover').remove();
}

function openPopup(objDom, id, dialog_id) {
  // if it was the delete action
  if (id) {
    objDom.find('#deleteConfirm').data('id', id);
  }
  // if it was the leave action
  if (dialog_id) {
    objDom.find('#leaveConfirm').data('dialog', dialog_id);
  }
  objDom.add('.popups').addClass('is-overlay');
}

function openAttachPopup(objDom, name, url, uid) {
  objDom.find('.attach-photo, .attach-video video').attr('src', url);
  objDom.find('.attach-name').text(name);
  objDom.find('.attach-download').attr('href', getFileDownloadLink(uid));
  objDom.add('.popups').addClass('is-overlay');
}

function closePopup() {
  $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
  $('.temp-box').remove();
  $('.attach-video video')[0].pause();
}

function getFileDownloadLink(uid) {
  return 'https://api.quickblox.com/blobs/'+uid+'?token='+Session.token;
}
