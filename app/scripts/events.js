/*
 * Q-municate chat application
 *
 * Events Module
 *
 */

define([
  'jquery',
  'config',
  'Helpers',
  'QMHtml',
  'LocationView',
  'minEmoji',
  'mCustomScrollbar',
  'mousewheel'
], function($, QMCONFIG, Helpers, QMHtml, Location, minEmoji) {

  var Dialog, UserView, ContactListView, DialogView, MessageView, AttachView, VideoChatView;
  var chatName, editedChatName, stopTyping, retryTyping, keyupSearch;
  var App;
  var $workspace = $('.l-workspace-wrap');

  function Events(app) {
    App = app;
    this.app = app;

    Dialog = this.app.models.Dialog;
    UserView = this.app.views.User;
    ContactList = this.app.models.ContactList;
    ContactListView = this.app.views.ContactList;
    DialogView = this.app.views.Dialog;
    MessageView = this.app.views.Message;
    AttachView = this.app.views.Attach;
    VideoChatView = this.app.views.VideoChat;
  }

  Events.prototype = {

    init: function() {
      window.isQMAppActive = true;

      $(window).focus(function() {
        var dialogItem, dialog_id, dialog;

        window.isQMAppActive = true;

        dialogItem = $('.l-list-wrap section:not(#searchList) .is-selected');
        dialog_id = dialogItem[0] && dialogItem.data('dialog');
        dialog = $('.dialog-item[data-dialog="'+dialog_id+'"] .contact');

        if ($('.dialog-item[data-dialog="'+dialog_id+'"]').hasClass('is-selected')) {
          DialogView.htmlBuild(dialog);
        }

        if (dialog_id) {
          dialogItem.find('.unread').text('');
          DialogView.decUnreadCounter(dialog_id);
        }
      });

      $(window).blur(function() {
        window.isQMAppActive = false;
      });

      $(document).on('click', function(event) {
        clickBehaviour(event);
      });

      $('.popups').on('click', function(event) {
        var objDom = $(event.target);

        if (objDom.is('.popups') && !objDom.find('.popup.is-overlay').is('.is-open')) {
          closePopup();
        }
      });

      $('#signup-avatar:file').on('change', function() {
        changeInputFile($(this));
      });

      /* User Profile
      ----------------------------------------------------- */
      $('body').on('click', '.userDetails', function() {
        removePopover();

        var id = $(this).data('id'),
            roster = ContactList.roster[id];

        QMHtml.User.getControlButtonsForPopupDetails(roster);
        openPopup($('#popupDetails'), id);
        UserView.buildDetails(id);

        return false;
      });

      $('body').on('click', '#userProfile', function(event) {
        var profileView = App.views.Profile;
        event.preventDefault();
        removePopover();
        profileView.render().openPopup();
      });

      $('body').on('click', '.btn_changePassword', function(event) {
        var changePassView = App.views.ChangePass,
            profileView = App.views.Profile;

        event.preventDefault();
        profileView.$el.hide();
        changePassView.render().openPopup();
      });

      $('body').on('click', '.btn_popup_changepass', function(event) {
        var profileView = App.views.Profile,
            changePassView = App.views.ChangePass;

        event.preventDefault();
        changePassView.submitForm();
      });

      $('body').on('click', '.btn_userProfile_connect', function() {
        var profileView = App.views.Profile,
            btn = $(this);

        btn.prop('disabled', true);

        FB.login(function(response) {
          Helpers.log('FB authResponse', response);
          if (response.status === 'connected') {
            profileView.addFBAccount(response.authResponse.userID);
          } else {
            btn.prop('disabled', false);
          }
        }, {scope: QMCONFIG.fbAccount.scope});
      });

      /* smiles
      ----------------------------------------------------- */
      $('.smiles-tab').on('click', function() {
        var $self = $(this),
            group = $self.data('group');

        $self.addClass('is-actived')
             .siblings().removeClass('is-actived');

        $('.smiles-group_'+group).removeClass('is-hidden')
                                 .siblings().addClass('is-hidden');

        setCursorToEnd($('.l-chat:visible .textarea'));
      });

      $('.smiles-group').mCustomScrollbar({
        theme: 'minimal-dark',
        scrollInertia: 500,
        mouseWheel: {
          scrollAmount: QMCONFIG.isMac || 'auto',
          deltaFactor: 'auto'
        }
      });

      $('.em-wrap').on('click', function() {
        var code = $(this).find('.em').data('unicode'),
            $curTextarea = $('.l-chat:visible .textarea'),
            val = $curTextarea.html();

        $curTextarea.addClass('contenteditable').html(val + minEmoji(code));
        setCursorToEnd($curTextarea);
      });

      /* attachments
      ----------------------------------------------------- */
      $workspace.on('click', '.j-btn_input_attach', function() {
        $(this).parents('.l-chat-footer')
         .find('.attachment')
         .click();
      });

      $workspace.on('change', '.attachment', function() {
        AttachView.changeInput($(this));
      });

      $workspace.on('click', '.attach-cancel', function(event) {
        event.preventDefault();
        AttachView.cancel($(this));
      });

      $workspace.on('click', '.preview', function() {
        var $self = $(this),
            name = $self.data('name'),
            url = $self.data('url'),
            attachType;

        if ($self.is('.preview-photo')) {
          attachType = 'photo';
          setAttachType(attachType);
        } else {
          attachType = 'video';
          setAttachType(attachType);
        }

        openAttachPopup($('#popupAttach'), name, url, attachType);
      });

      /* location
      ----------------------------------------------------- */
      $workspace.on('click', '.j-send_location', function() {
        if (localStorage['QM.latitude'] && localStorage['QM.longitude']) {
          Location.toggleGeoCoordinatesToLocalStorage(false, function(res, err) {
            Helpers.log(err ? err : res);
          });
        } else {
          Location.toggleGeoCoordinatesToLocalStorage(true, function(res, err) {
            Helpers.log(err ? err : res);
          });
        }
      });

      $workspace.on('mouseenter', '.j-showlocation', function() {
        $(this).find('.popover_map').fadeIn(150);
      });

      $workspace.on('mouseleave', '.j-showlocation', function() {
        $(this).find('.popover_map').fadeOut(100);
      });

      $workspace.on('click', '.j-btn_input_location', function() {
        var $self = $(this),
            $gmap = $('.j-popover_gmap'),
            bool = $self.is('.is-active');

        removePopover();

        if (!bool) {
          $self.addClass('is-active');
          $gmap.fadeIn(150);

          Location.addMap($gmap);
        }

      });

      $workspace.on('click', '.j-send_map', function() {
        var localData = localStorage['QM.locationAttach'],
            mapCoords;

        if (localData) {
          mapCoords = JSON.parse(localData);

          AttachView.sendMessage($('.l-chat:visible'), null, null, mapCoords);
          localStorage.removeItem('QM.locationAttach');
          removePopover();
        }
      });

      $('body').on('keydown', function(e) {
        if ((e.keyCode === 13) && $('.j-open_map').length) {
          $('.j-send_map').click();
        }
      });

      /* group chats
      ----------------------------------------------------- */
      $workspace.on('click', '.groupTitle', function() {
        if ($('.l-chat:visible').find('.triangle_up').is('.is-hidden')) {
          setTriagle('up');
        } else {
          setTriagle('down');
        }
      });

      $workspace.on('click', '.groupTitle .addToGroupChat', function(event) {
        event.stopPropagation();
        var $self = $(this),
            dialog_id = $self.data('dialog');

        Helpers.log('add people to groupchat');
        ContactListView.addContactsToChat($self, 'add', dialog_id);
      });

      $workspace.on('click', '.groupTitle .leaveChat, .groupTitle .avatar', function(event) {
        event.stopPropagation();
      });

      /* change the chat name
      ----------------------------------------------------- */
      $workspace.on('mouseenter focus', '.groupTitle .name_chat', function() {
        var $chat = $('.l-chat:visible');
        $chat.find('.triangle:visible').addClass('is-hover')
             .siblings('.pencil').removeClass('is-hidden');
      });

      $workspace.on('mouseleave', '.groupTitle .name_chat', function() {
        var $chat = $('.l-chat:visible');

        if (!$(this).is('.is-focus')) {
          $chat.find('.triangle.is-hover').removeClass('is-hover')
               .siblings('.pencil').addClass('is-hidden');
        }
      });

      $(document.body).on('click', function() {
        var $chat = $('.l-chat:visible');

        if ($chat.find('.groupTitle .name_chat').is('.is-focus')) {
          $chat.find('.groupTitle .name_chat').removeClass('is-focus');
          $chat.find('.groupTitle .name_chat')[0].scrollLeft = 0;
          $chat.find('.triangle.is-hover').removeClass('is-hover')
               .siblings('.pencil').addClass('is-hidden');

          if (editedChatName && !editedChatName.name) {
            $chat.find('.name_chat').text(chatName.name);
          } else if (editedChatName && (editedChatName.name !== chatName.name) && (editedChatName.created_at > chatName.created_at)) {
            $chat.find('.name_chat').text(editedChatName.name).attr('title', editedChatName.name);
            Dialog.changeName($chat.data('dialog'), editedChatName.name);
          } else {
            $chat.find('.name_chat').text($chat.find('.name_chat').text().trim());
          }
        }
      });

      $('body').on('click', '.groupTitle .name_chat', function(event) {
        event.stopPropagation();
        var $self = $(this);

        $self.addClass('is-focus');
        chatName = {
          name: $self.text().trim(),
          created_at: Date.now()
        };
        removePopover();
      });

      $('body').on('keyup', '.groupTitle .name_chat', function(event) {
        var $self = $(this),
            code = event.keyCode;

        editedChatName = {
          name: $self.text().trim(),
          created_at: Date.now()
        };
        if (code === 13) {
          $(document.body).click();
          $self.blur();
        } else if (code === 27) {
          editedChatName = null;
          $self.text(chatName.name);
          $(document.body).click();
          $self.blur();
        }
      });

      /* change the chat avatar
      ----------------------------------------------------- */
      $workspace.on('mouseenter', '.groupTitle .avatar', function() {
        var $chat = $('.l-chat:visible');

        $chat.find('.pencil_active').removeClass('is-hidden');
      });

      $workspace.on('mouseleave', '.groupTitle .avatar', function() {
        var $chat = $('.l-chat:visible');

        $chat.find('.pencil_active').addClass('is-hidden');
      });

      $workspace.on('click', '.groupTitle .pencil_active', function() {
        $(this).siblings('input:file').click();
        removePopover();
      });

      $workspace.on('change', '.groupTitle .avatar_file', function() {
        var $chat = $('.l-chat:visible');

        Dialog.changeAvatar($chat.data('dialog'), $(this), function(avatar) {
          if (!avatar) return false;
          $chat.find('.avatar_chat').css('background-image', 'url('+avatar+')');
        });
      });

      /* scrollbars
      ----------------------------------------------------- */
      occupantScrollbar();

      /* welcome page
      ----------------------------------------------------- */
      $('#signupFB, #loginFB').on('click', function(event) {
        Helpers.log('connect with FB');
        event.preventDefault();

        // NOTE!! You should use FB.login method instead FB.getLoginStatus
        // and your browser won't block FB Login popup
        FB.login(function(response) {
          Helpers.log('FB authResponse', response);
          if (response.status === 'connected') {
            UserView.connectFB(response.authResponse.accessToken);
          }
        }, {scope: QMCONFIG.fbAccount.scope});
      });

      $('#signupQB').on('click', function() {
        Helpers.log('signup with QB');
        UserView.signupQB();
      });

      $('#loginQB').on('click', function(event) {
        Helpers.log('login wih QB');
        event.preventDefault();
        UserView.loginQB();
      });

      /* button "back"
      ----------------------------------------------------- */
      $('.back_to_welcome_page').on('click', function() {
        UserView.logout();
      });

      $('.back_to_login_page').on('click', function() {
        UserView.loginQB();
      });

      /* signup page
      ----------------------------------------------------- */
      $('#signupForm').on('click submit', function(event) {
        Helpers.log('create user');
        event.preventDefault();
        UserView.signupForm();
      });

      /* login page
      ----------------------------------------------------- */
      $('#forgot').on('click', function(event) {
        Helpers.log('forgot password');
        event.preventDefault();
        UserView.forgot();
      });

      $('#loginForm').on('click submit', function(event) {
        Helpers.log('authorize user');
        event.preventDefault();
        UserView.loginForm();
      });

      /* forgot and reset page
      ----------------------------------------------------- */
      $('#forgotForm').on('click submit', function(event) {
        Helpers.log('send letter');
        event.preventDefault();
        UserView.forgotForm();
      });

      $('#resetForm').on('click submit', function(event) {
        Helpers.log('reset password');
        event.preventDefault();
        UserView.resetForm();
      });

      /* popovers
      ----------------------------------------------------- */
      $('#profile').on('click', function(event) {
        event.preventDefault();
        removePopover();
        if ($('.l-chat:visible').find('.triangle_down').is('.is-hidden')) {
          setTriagle('down');
        }
        UserView.profilePopover($(this));
      });

      $('.list_contextmenu').on('contextmenu', '.contact', function(event) {
        event.preventDefault();
        removePopover();
        UserView.contactPopover($(this));
      });

      $workspace.on('click', '.occupant', function(event) {
        event.preventDefault();
        removePopover();
        UserView.occupantPopover($(this), event);
      });

      $workspace.on('click', '.j-btn_input_smile', function() {
        var $self = $(this),
            bool = $self.is('.is-active');

        removePopover();

        if (!bool) {
          $self.addClass('is-active');
          $('.j-popover_smile').fadeIn(150);
        }

        setCursorToEnd($('.l-chat:visible .textarea'));
      });

      /* popups
      ----------------------------------------------------- */
      $('.header-links-item').on('click', '#logout', function(event) {
        event.preventDefault();
        openPopup($('#popupLogout'));
      });

      $('body').on('click', '.deleteContact', function(event) {
        event.preventDefault();
        closePopup();

        var $that = $(this),
            parents = $that.parents('.presence-listener'),
            id = parents.data('id') || $that.data('id');

        if (parents.is('.popup_details')) {
          openPopup($('#popupDelete'), id, null, true);
        } else {
          openPopup($('#popupDelete'), id);
        }
      });

      $('.list, .l-workspace-wrap').on('click', '.leaveChat', function(event) {
        event.preventDefault();
        var $self = $(this),
            parent = $self.parents('.presence-listener')[0] ? $self.parents('.presence-listener') : $self.parents('.is-group'),
            dialog_id = parent.data('dialog');

        openPopup($('#popupLeave'), null, dialog_id);
      });

      $('#logoutConfirm').on('click', function() {
        UserView.logout();
      });

      $('#deleteConfirm').on('click', function() {
        Helpers.log('delete contact');
        ContactListView.sendDelete($(this));
      });

      $('#leaveConfirm').on('click', function() {
        Helpers.log('leave chat');
        DialogView.leaveGroupChat($(this));
      });

      $('.popup-control-button, .btn_popup_private').on('click', function(event) {
        event.preventDefault();

        var $self = $(this),
            isProfile = $self.data('isprofile');

        if (!$self.is('.returnBackToPopup'))
          closePopup();
        if (isProfile)
          openPopup($('#popupDetails'));
      });

      $('.search').on('click', function() {
        Helpers.log('global search');
        closePopup();
        ContactListView.globalPopup();
      });

      $('.btn_search').on('click', function(event) {
        event.preventDefault();

        var localSearch = $('#searchContacts input'),
            globalSearch = $('#globalSearch input');

        globalSearch.val(localSearch.val());
        $('#globalSearch').submit();
      });

      $('#mainPage').on('click', '.createGroupChat', function(event) {
        event.preventDefault();

        Helpers.log('add people to groupchat');

        var $self = $(this),
            isPrivate = $self.data('private');

        ContactListView.addContactsToChat($self, null, null, isPrivate);
      });

      $('.l-sidebar').on('click', '.addToGroupChat', function(event) {
        event.preventDefault();

        var $self = $(this),
            dialog_id = $self.data('dialog');
        Helpers.log('add people to groupchat');
        ContactListView.addContactsToChat($self, 'add', dialog_id);
      });

      /* search
      ----------------------------------------------------- */
      $('#globalSearch').on('keyup search submit', function(event) {
        event.preventDefault();
        var code = event.keyCode;
            form = $(this);

        if (code === 13) {
          clearTimeout(keyupSearch);
          keyupSearch = undefined;
          ContactListView.globalSearch(form);
        } else if (keyupSearch === undefined) {
          keyupSearch = setTimeout(function() {
            keyupSearch = undefined;
            ContactListView.globalSearch(form);
          }, 1000);
        } else {
          clearTimeout(keyupSearch);
          keyupSearch = setTimeout(function() {
            keyupSearch = undefined;
            ContactListView.globalSearch(form);
          }, 1000);
        }
      });

      $('.localSearch').on('keyup search submit', function(event) {
        var $self = $(this),
            type = event.type,
            code = event.keyCode; // code=27 (Esc key), code=13 (Enter key)

        if ((type === 'keyup' && code !== 27 && code !== 13) || (type === 'search')) {
          if (this.id === 'searchContacts') {
            UserView.localSearch($self);
          } else {
            UserView.friendsSearch($self);
          }
        }

        return false;
      });

      $('.clean-button').on('click', function(event) {
        var $form = $(this).parent('form.formSearch');

        $form.find('input.form-input-search').val('').focus();
        UserView.localSearch($form);

        return false;
      });

      /* subscriptions
      ----------------------------------------------------- */
      $('.list_contacts').on('click', 'button.send-request', function() {
        Helpers.log('send subscribe');
        ContactListView.sendSubscribe($(this));
      });

      $workspace.on('click', '.btn_request_again', function() {
        Helpers.log('send subscribe');
        ContactListView.sendSubscribe($(this), true);
      });

      $('body').on('click', '.requestAction', function(event) {
        event.preventDefault();
        Helpers.log('send subscribe');
        ContactListView.sendSubscribe($(this));
      });

      $('.list').on('click', '.request-button_ok', function() {
        Helpers.log('send confirm');
        ContactListView.sendConfirm($(this));
      });

      $('.list').on('click', '.request-button_cancel', function() {
        Helpers.log('send reject');
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

          if (obj.is('li:last')) popup.find('.list_contacts').mCustomScrollbar("scrollTo","bottom");

        } else if (len >= 1) {
          popup.removeClass('not-selected');
          if (popup.is('.add'))
            popup.find('.btn_popup_add').removeClass('is-hidden').siblings().addClass('is-hidden');
          else
            popup.find('.btn_popup_group').removeClass('is-hidden').siblings().addClass('is-hidden');

          if (obj.is('li:last')) popup.find('.list_contacts').mCustomScrollbar("scrollTo","bottom");

        } else {
          popup.addClass('not-selected');
        }
      });

      $('.list_contextmenu').on('click', '.contact', function() {
        var dataDialog = $('.l-list .list-item.is-selected').attr("data-dialog"),
            dataId = $('.l-list .list-item.is-selected').attr("data-id");

        MessageView.clearTheListTyping();

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

        closePopup();
        DialogView.htmlBuild(dialogItem);
      });

      $('#popupContacts .btn_popup_group').on('click', function() {
        DialogView.createGroupChat();
      });

      $('#popupContacts .btn_popup_add').on('click', function() {
        var dialog_id = $(this).parents('.popup').data('dialog');
        DialogView.createGroupChat('add', dialog_id);
      });

      $workspace.on('keydown', '.l-message', function(event) {
        var $self = $(this),
            jid = $self.parents('.l-chat').data('jid'),
            type = $self.parents('.l-chat').is('.is-group') ? 'groupchat' : 'chat',
            shiftKey = event.shiftKey,
            code = event.keyCode, // code=27 (Esc key), code=13 (Enter key)
            val = $('.l-chat:visible .textarea').html().trim();

        if (code === 13 && !shiftKey) {
          MessageView.sendMessage($self);
          $self.find('.textarea').empty();
          removePopover();
        }
      });

      $workspace.on('click', '.j-btn_input_send', function() {
        var $msg = $('.l-message:visible');

        MessageView.sendMessage($msg);
        $msg.find('.textarea').empty();
        removePopover();
        setCursorToEnd($('.l-chat:visible .textarea'));
      });

      // show message status on hover event
      $('body').on('mouseenter', 'article.message.is-own', function() {
        var $self = $(this),
            time = $self .find('.message-time'),
            status = $self .find('.message-status');

        time.addClass('is-hidden');
        status.removeClass('is-hidden');
      });

      $('body').on('mouseleave', 'article.message.is-own', function() {
        var $self = $(this),
            time = $self.find('.message-time'),
            status = $self.find('.message-status');

        status.addClass('is-hidden');
        time.removeClass('is-hidden');
      });

      /* A button for the scroll to the bottom of chat
      ------------------------------------------------------ */
      $workspace.on('click', '.j-toBottom', function() {
        $('.l-chat:visible .scrollbar_message').mCustomScrollbar('scrollTo', 'bottom');
        $(this).hide();
      });

      // send typing statuses with keyup event
      $workspace.on('keyup', '.l-message', function(event) {
        var $self = $(this),
            jid = $self.parents('.l-chat').data('jid'),
            type = $self.parents('.l-chat').is('.is-group') ? 'groupchat' : 'chat',
            shiftKey = event.shiftKey,
            code = event.keyCode; // code=27 (Esc key), code=13 (Enter key)

        function isStartTyping() {
          MessageView.sendTypingStatus(jid, true);
        }

        function isStopTyping() {
          clearTimeout(stopTyping);
          stopTyping = undefined;

          clearInterval(retryTyping);
          retryTyping = undefined;

          MessageView.sendTypingStatus(jid, false);
        }

        if (code === 13 && !shiftKey) {
          isStopTyping();
        } else if (stopTyping === undefined) {
          isStartTyping();
          stopTyping = setTimeout(isStopTyping, 4000);
          retryTyping = setInterval(isStartTyping, 4000);
        } else {
          clearTimeout(stopTyping);
          stopTyping = setTimeout(isStopTyping, 4000);
        }
      });

      $workspace.on('keyup', '.l-message', function() {
        var val = $('.l-chat:visible .textarea').text().trim();

        if (val.length > 0)
          $('.l-chat:visible .textarea').addClass('contenteditable');
        else
          $('.l-chat:visible .textarea').removeClass('contenteditable').empty();
      });

      $workspace.on('submit', '.l-message', function(event) {
        event.preventDefault();
      });

      // fix QMW-253
      // solution http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
      $('body').on('paste', '.l-message', function(e) {
        e.preventDefault();
        var text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      });

      $('#home').on('click', function(event) {
        event.preventDefault();
        $('#capBox').removeClass('is-hidden').siblings().addClass('is-hidden');
        $('.is-selected').removeClass('is-selected');
      });

      /* temporary events
      ----------------------------------------------------- */
      $('#share').on('click', function(event) {
        event.preventDefault();
      });

      // videocalls
      VideoChatView.init();
    }
  };

  /* Private
  ---------------------------------------------------------------------- */
  function occupantScrollbar() {
    $('.chat-occupants, #popupIncoming').mCustomScrollbar({
      theme: 'minimal-dark',
      scrollInertia: 500,
      mouseWheel: {
        scrollAmount: QMCONFIG.isMac || 'auto',
        deltaFactor: 'auto'
      },
      live: true
    });
  }

  // Checking if the target is not an object run popover
  function clickBehaviour(e) {
    var objDom = $(e.target),
        selectors = '#profile, #profile *, .occupant, .occupant *, .j-btn_input_smile, .j-btn_input_smile *, '+
                    '.j-popover_smile, .j-popover_smile *, .j-popover_gmap, .j-popover_gmap *, .j-btn_input_location, .j-btn_input_location *',
        googleImage = objDom.context.src && objDom.context.src.indexOf('/maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png') || null;

    if (objDom.is(selectors) || e.which === 3 || googleImage === 7) {
      return false;
    } else {
      removePopover();
    }
  }

  function changeInputFile(objDom) {
    var URL = window.URL,
        file = objDom[0].files[0],
        src = file ? URL.createObjectURL(file) : QMCONFIG.defAvatar.url,
        fileName = file ? file.name : QMCONFIG.defAvatar.caption;

    objDom.prev().find('.avatar').css('background-image', "url("+src+")").siblings('span').text(fileName);
    // if (typeof file !== 'undefined') URL.revokeObjectURL(src);
  }

  function removePopover() {
    var $openMap = $('.j-open_map');

    $('.is-contextmenu').removeClass('is-contextmenu');
    $('.is-active').removeClass('is-active');
    $('.popover:not(.j-popover_const)').remove();
    $('.j-popover_smile, .j-popover_gmap').fadeOut(150);

    if ($openMap.length) {
      $openMap.remove();
    }

    if ($('#mCSB_8_container').is(':visible')) {
      $('#mCSB_8_container')[0].style.paddingBottom = '0';
    }
  }

  function openPopup(objDom, id, dialog_id, isProfile) {
    // if it was the delete action
    if (id) {
      objDom.attr('data-id', id);
      objDom.find('#deleteConfirm').data('id', id);
    }
    // if it was the leave action
    if (dialog_id) {
      objDom.find('#leaveConfirm').data('dialog', dialog_id);
    }
    if (isProfile) {
      objDom.find('.popup-control-button_cancel').attr('data-isprofile', true);
    }
    objDom.add('.popups').addClass('is-overlay');
  }

  function openAttachPopup(objDom, name, url, attachType) {
    if (attachType === 'video')
      objDom.find('.attach-video video').attr('src', url);
    else
      objDom.find('.attach-photo').attr('src', url);

    objDom.find('.attach-name').text(name);
    objDom.find('.attach-download').attr('href', url).attr('download', name);
    objDom.add('.popups').addClass('is-overlay');
  }

  function closePopup() {
    $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
    $('.temp-box').remove();
    if ($('.attach-video video')[0]) $('.attach-video video')[0].pause();
  }

  function setCursorToEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el.get(0));
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el.get(0));
      textRange.collapse(false);
      textRange.select();
    }
  }

  function setAttachType(type) {
    var otherType = type === 'photo' ? 'video' : 'photo';

    $('.attach-'+type).removeClass('is-hidden')
                      .siblings('.attach-'+otherType).addClass('is-hidden');
  }

  function setTriagle(UpOrDown) {
    var $chat = $('.l-chat:visible'),
        $triangle = $chat.find('.triangle_'+UpOrDown);

    $triangle.removeClass('is-hidden')
             .siblings('.triangle').addClass('is-hidden');

    $chat.find('.chat-occupants-wrap').toggleClass('is-overlay');
    $chat.find('.l-chat-content').toggleClass('l-chat-content_min');
  }

  return Events;

});
