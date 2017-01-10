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
    'perfectscrollbar',
    'mCustomScrollbar',
    'mousewheel'
], function(
    $,
    QMCONFIG,
    Helpers,
    QMHtml,
    Location,
    minEmoji,
    Ps
) {

    var Dialog,
        Cursor,
        UserView,
        ContactListView,
        DialogView,
        MessageView,
        AttachView,
        VideoChatView,
        SettingsView;

    var chatName,
        editedChatName,
        stopTyping,
        retryTyping,
        keyupSearch;

    var App;

    var $workspace = $('.l-workspace-wrap');

    function Events(app) {
        App = app;
        this.app = app;

        Dialog = this.app.models.Dialog;
        Cursor = this.app.models.Cursor;
        User = this.app.models.User;
        UserView = this.app.views.User;
        ContactList = this.app.models.ContactList;
        ContactListView = this.app.views.ContactList;
        DialogView = this.app.views.Dialog;
        MessageView = this.app.views.Message;
        AttachView = this.app.views.Attach;
        VideoChatView = this.app.views.VideoChat;
        SettingsView = this.app.views.Settings;
    }

    Events.prototype = {

        init: function() {
            window.isQMAppActive = true;

            $(window).focus(function() {
                window.isQMAppActive = true;

                var dialogItem = $('.l-list-wrap section:not(#searchList) .is-selected'),
                    dialog_id = dialogItem[0] && dialogItem.data('dialog');

                if (dialog_id) {
                    dialogItem.find('.unread').text('');
                    DialogView.decUnreadCounter(dialog_id);
                }
            });

            $(window).blur(function() {
                var $chat = $('.l-chat:visible'),
                    $label = $('.l-chat:visible').find('.j-newMessages');

                if ($chat.length && $label.length) {
                    $label.remove();
                }

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

                FB.login(
                    function(response) {
                        Helpers.log('FB authResponse', response);
                        if (response.status === 'connected') {
                            profileView.addFBAccount(response.authResponse.userID);
                        } else {
                            btn.prop('disabled', false);
                        }
                    }, {
                        scope: QMCONFIG.fbAccount.scope
                    }
                );
            });

            /* smiles
            ----------------------------------------------------- */
            $('.smiles-tab').on('click', function() {
                var $self = $(this),
                    smile = document.querySelector('.smiles-wrap'),
                    group = $self.data('group');

                $self.addClass('is-actived')
                    .siblings().removeClass('is-actived');

                $('.smiles-group_' + group).removeClass('is-hidden')
                    .siblings().addClass('is-hidden');

                smile.scrollTop = 0;
                Ps.update(smile);

                Cursor.setCursorToEnd($('.l-chat:visible .textarea')[0]);
            });

            Ps.initialize(document.querySelector('.smiles-wrap'), {
                wheelSpeed: 1,
                wheelPropagation: true,
                minScrollbarLength: 20
            });

            $workspace.on('click', '.j-em', function() {
                Cursor.setCursorAfterElement($(this)[0]);

                return false;
            });


            $('.j-em_wrap').on('click', function(event) {
                var target = $(this).children()[0],
                    textarea = $('.l-chat:visible .textarea')[0];

                if (target === event.target) {
                    textarea.focus();
                    Cursor.insertElement(target, 'j-em');
                } else {
                    Cursor.setCursorToEnd(textarea);
                }

                return false;
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

            $workspace.on('click', '.j-btn_input_location', function() {
                var $self = $(this),
                    $gmap = $('.j-popover_gmap'),
                    bool = $self.is('.is-active');

                removePopover();

                if (!bool) {
                    $self.addClass('is-active');
                    $gmap.addClass('is-active');

                    Location.addMap($gmap);
                }

            });

            $workspace.on('click', '.j-send_map', function() {
                var localData = localStorage['QM.locationAttach'];

                if (localData) {
                    AttachView.sendMessage($('.l-chat:visible'), null, null, localData);
                    localStorage.removeItem('QM.locationAttach');
                    removePopover();
                }
            });

            $('body').on('keypress', function(e) {
                if ((e.keyCode === 13) && $('.j-open_map').length) {
                    $('.j-send_map').click();
                }
            });

            /* user settings
            ----------------------------------------------------- */
            $('body').on('click', '#userSettings', function() {
                removePopover();
                $('.j-settings').addClass('is-overlay')
                    .parent('.j-overlay').addClass('is-overlay');

                return false;
            });

            $('body').on('click', '.j-close_settings', function() {
                closePopup();

                return false;
            });

            $('.j-toogle_settings').click(function() {
                var $target = $(this).find('.j-setings_notify')[0],
                    obj = {};

                $target.checked = $target.checked === true ? false : true;
                obj[$target.id] = $target.checked;

                SettingsView.update(obj);

                return false;
            });

            /* group chats
            ----------------------------------------------------- */
            $workspace.on('click', '.groupTitle', function() {
                $scroll = $('.l-chat:visible').find('.j-scrollbar_message');

                if ($('.l-chat:visible').find('.triangle_up').is('.is-hidden')) {
                    $scroll.mCustomScrollbar('scrollTo','-=94');
                    setTriagle('up');
                } else {
                    $scroll.mCustomScrollbar('scrollTo','+=94');
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

            $('body').on('keypress', '.groupTitle .name_chat', function(event) {
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
            $('body').on('click', '.j-changePic', function() {
                var dialog_id = $(this).data('dialog');

                $('input:file[data-dialog="' + dialog_id + '"]').click();
            });

            $workspace.on('change', '.groupTitle .avatar_file', function() {
                var $chat = $('.l-chat:visible');

                Dialog.changeAvatar($chat.data('dialog'), $(this), function(avatar) {
                    if (!avatar) {
                        return false;
                    }

                    $chat.find('.avatar_chat').css('background-image', 'url(' + avatar + ')');
                    $('.j-popupAvatar .j-avatarPic').attr('src', avatar);
                });
            });

            $workspace.on('click', '.j-scaleAvatar', function() {
                Helpers.scaleAvatar($(this));
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
                }, {
                    scope: QMCONFIG.fbAccount.scope
                });
            });

            $('.j-twitterDigits').on('click', function() {
                UserView.connectTwitterDigits();
                Helpers.log('connecting with twitterDigits');

                return false;
            });

            $('#signupQB').on('click', function() {
                Helpers.log('signup with QB');
                UserView.signupQB();
            });

            $('.j-login_QB').on('click', function() {
                Helpers.log('login wih QB');

                // removed class "active" (hotfix for input on qmdev.quickblox.com/qm.quickblox.com)
                $('#loginPage .j-prepare_inputs').removeClass('active');
                UserView.loginQB();

                return false;
            });

            /* button "back"
            ----------------------------------------------------- */
            $('.j-back_to_login_page').on('click', function() {
                UserView.loginQB();
                $('.j-success_callback').remove();
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
                    $('.j-popover_smile').addClass('is-active');
                }

                Cursor.setCursorToEnd($('.l-chat:visible .textarea')[0]);
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
                localStorage.setItem('QM.' + User.contact.id + '_logOut', true);
                UserView.logout();
            });

            $('.j-deleteConfirm').on('click', function() {
                var id = $(this).parents('.j-popupDelete').data('id');

                ContactListView.sendDelete(id, true);
                Helpers.log('delete contact');
            });

            $('#leaveConfirm').on('click', function() {
                Helpers.log('leave chat');
                DialogView.leaveGroupChat($(this));
            });

            $('.popup-control-button, .btn_popup_private').on('click', function(event) {
                event.preventDefault();

                var $self = $(this),
                    isProfile = $self.data('isprofile');

                if (!$self.is('.returnBackToPopup')) {
                    closePopup();
                }

                if (isProfile) {
                    openPopup($('#popupDetails'));
                }
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
            $('.j-globalSearch').on('keyup search submit', function(event) {
                var $self = $(this),
                    code = event.keyCode,
                    isText = $self.find('.form-input-search').val().length,
                    $cleanButton = $self.find('.j-clean-button'),
                    isNoBtn = $cleanButton.is(':hidden');

                if (code === 13) {
                    clearTimeout(keyupSearch);
                    startSearch();
                } else if (keyupSearch === undefined) {
                    keyupSearch = setTimeout(function() {
                        startSearch();
                    }, (code === 8) ? 0 : 1000);
                } else {
                    clearTimeout(keyupSearch);
                    keyupSearch = setTimeout(function() {
                        startSearch();
                    }, 1000);
                }

                function startSearch() {
                    keyupSearch = undefined;
                    ContactListView.globalSearch($self);
                }

                if (isText && isNoBtn) {
                    $cleanButton.show();
                } else if (!isText) {
                    $cleanButton.hide();
                }

                return false;
            });

            $('.localSearch').on('keyup search submit', function(event) {
                var $self = $(this),
                    scrollbar = document.querySelector('.j-scrollbar_aside'),
                    isText = $self.find('.form-input-search').val().length,
                    $cleanButton = $self.find('.j-clean-button'),
                    isNoBtn = $cleanButton.is(':hidden'),
                    type = event.type,
                    code = event.keyCode; // code=27 (Esc key), code=13 (Enter key)

                if ((type === 'keyup' && code !== 27 && code !== 13) || (type === 'search')) {
                    if (this.id === 'searchContacts') {
                        UserView.localSearch($self);
                    } else {
                        UserView.friendsSearch($self);
                    }

                    Ps.update(scrollbar);
                }

                if (isText && isNoBtn) {
                    $cleanButton.show();
                } else if (!isText) {
                    $cleanButton.hide();
                }

                return false;
            });

            $('.j-clean-button').on('click', function(event) {
                var $self = $(this),
                    $form = $self.parent('form.formSearch');

                $self.hide();
                $form.find('input.form-input-search').val('').focus();

                if ($form.is('.j-globalSearch')) {
                    ContactListView.globalSearch($form);
                } else if ($form.is('.j-localSearch')) {
                    UserView.localSearch($form);
                } else {
                    UserView.friendsSearch($form);
                }


                return false;
            });

            /* subscriptions
            ----------------------------------------------------- */
            $('.list_contacts').on('click', '.j-sendRequest', function() {
                var jid = $(this).parents('.j-listItem').data('jid');

                ContactListView.sendSubscribe(jid);
                Helpers.log('send subscribe');
            });

            $workspace.on('click', '.j-requestAgain', function() {
                var jid = $(this).parents('.j-chatItem').data('jid');

                ContactListView.sendSubscribe(jid, true);
                Helpers.log('send subscribe');
            });

            $('body').on('click', '.j-requestAction', function() {
                var jid = $(this).parents('.j-listItem').data('jid');

                ContactListView.sendSubscribe(jid);
                Helpers.log('send subscribe');
            });

            $('.list').on('click', '.j-requestConfirm', function() {
                var jid = $(this).parents('.j-incommingContactRequest').data('jid');

                ContactListView.sendConfirm(jid, true);
                Helpers.log('send confirm');
            });

            $('.list').on('click', '.j-requestCancel', function() {
                var jid = $(this).parents('.j-incommingContactRequest').data('jid');

                ContactListView.sendReject(jid, true);
                Helpers.log('send reject');
            });

            /* dialogs
            ----------------------------------------------------- */
            $('.list').on('click', '.contact', function(event) {
                if (event.target.tagName !== 'INPUT') {
                    event.preventDefault();
                }
            });

            $('#popupContacts').on('click', '.contact', function() {
                var obj = $(this).parent(),
                    popup = obj.parents('.popup'),
                    len;

                if (obj.is('.is-chosen')) {
                    obj.removeClass('is-chosen').find('input').prop('checked', false);
                } else {
                    obj.addClass('is-chosen').find('input').prop('checked', true);
                }

                len = obj.parent().find('li.is-chosen').length;
                if (len === 1 && !popup.is('.is-addition')) {
                    popup.removeClass('not-selected');
                    popup.find('.btn_popup_private').removeClass('is-hidden').siblings().addClass('is-hidden');

                    if (obj.is('li:last')) {
                        popup.find('.list_contacts').mCustomScrollbar("scrollTo", "bottom");
                    }
                } else if (len >= 1) {
                    popup.removeClass('not-selected');

                    if (popup.is('.add')) {
                        popup.find('.btn_popup_add').removeClass('is-hidden').siblings().addClass('is-hidden');
                    } else {
                        popup.find('.btn_popup_group').removeClass('is-hidden').siblings().addClass('is-hidden');
                    }

                    if (obj.is('li:last')) {
                        popup.find('.list_contacts').mCustomScrollbar("scrollTo", "bottom");
                    }
                } else {
                    popup.addClass('not-selected');
                }
            });

            $('#popupContacts .btn_popup_private').on('click', function() {
                var id = $('#popupContacts .is-chosen').data('id'),
                    dialogItem = $('.dialog-item[data-id="' + id + '"]').find('.contact');

                DialogView.htmlBuild(dialogItem);
            });

            $('body').on('click', '.writeMessage', function(event) {
                event.preventDefault();

                var id = $(this).data('id'),
                    dialogItem = $('.dialog-item[data-id="' + id + '"]').find('.contact');

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

            $workspace.on('click', '.j-btn_input_send', function() {
                var $msg = $('.j-message:visible'),
                    isLoading = $('.j-loading').length;

                if (!isLoading) {
                    MessageView.sendMessage($msg);
                    $msg.find('.textarea').empty();
                }

                removePopover();

                Cursor.setCursorToEnd($('.l-chat:visible .textarea')[0]);

                return false;
            });

            // show message status on hover event
            $('body').on('mouseenter', 'article.message.is-own', function() {
                var $self = $(this),
                    time = $self.find('.message-time'),
                    status = $self.find('.message-status');

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
                $('.j-scrollbar_message').mCustomScrollbar('scrollTo', 'bottom');
                $(this).hide();
            });

            // send typing statuses with keyup event
            $workspace.on('keypress', '.j-message', function(event) {
                var $self = $(this),
                    isEnterKey = (event.keyCode === 13) ? true : false,
                    shiftKey = event.shiftKey,
                    $chat = $self.parents('.l-chat'),
                    jid = $chat.data('jid'),
                    isLoading = $chat.find('.j-loading').length,
                    isEmpty = !$chat.find('.textarea').html().length;

                if (isEnterKey && (isLoading || isEmpty)) {
                    return false;
                } else if (isEnterKey && !shiftKey) {
                    isStopTyping();
                    MessageView.sendMessage($self);
                    $self.find('.textarea').empty();
                    removePopover();
                    return false;
                } else if (stopTyping === undefined) {
                    isStartTyping();
                    stopTyping = setTimeout(isStopTyping, 4000);
                    retryTyping = setInterval(isStartTyping, 4000);
                } else {
                    clearTimeout(stopTyping);
                    stopTyping = setTimeout(isStopTyping, 4000);
                }

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
            });

            $workspace.on('submit', '.j-message', function(event) {
                return false;
            });

            $workspace.on('keypress', '.j-message', function() {
                var $textarea = $('.l-chat:visible .textarea'),
                    $emj = $textarea.find('.j-em'),
                    val = $textarea.text().trim();

                if (val.length || $emj.length) {
                    $textarea.addClass('contenteditable');
                } else {
                    $textarea.removeClass('contenteditable').empty();
                    Cursor.setCursorToEnd($textarea[0]);
                }
            });

            // fix QMW-253
            // solution http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
            $('body').on('paste', '.j-message', function(e) {
                var text = (e.originalEvent || e).clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);

                return false;
            });

            $('.j-home').on('click', function() {
                var $selected = $('.is-selected'),
                    dialogId = $selected.data('dialog'),
                    $label = $('.j-newMessages[data-dialog="' + dialogId + '"]');

                $('.j-capBox').removeClass('is-hidden')
                    .siblings().removeClass('is-active');
                $('.j-chatWrap').addClass('is-hidden');

                if ($label.length) {
                    $label.remove();
                }

                $selected.removeClass('is-selected');

                return false;
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
                scrollAmount: 'auto',
                deltaFactor: 'auto'
            },
            live: true
        });
    }

    // Checking if the target is not an object run popover
    function clickBehaviour(e) {
        var objDom = $(e.target),
            selectors = '#profile, #profile *, .occupant, .occupant *, ' +
            '.j-btn_input_smile, .j-btn_input_smile *, .textarea, ' +
            '.textarea *, .j-popover_smile, .j-popover_smile *, ' +
            '.j-popover_gmap, .j-popover_gmap *, .j-btn_input_location, ' +
            '.j-btn_input_location *',
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

        objDom.prev().find('.avatar').css('background-image', "url(" + src + ")").siblings('span').text(fileName);
    }

    function removePopover() {
        var $openMap = $('.j-open_map');

        $('.is-contextmenu').removeClass('is-contextmenu');
        $('.is-active').removeClass('is-active');
        $('.popover').remove();

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
        if (attachType === 'video') {
            objDom.find('video.attach-video').attr('src', url);
        } else {
            objDom.find('.attach-photo').attr('src', url);
        }

        objDom.find('.attach-name').text(name);
        objDom.find('.attach-download').attr('href', url).attr('download', name);
        objDom.add('.popups').addClass('is-overlay');
    }

    function closePopup() {
        $('.j-popupDelete.is-overlay').removeData('id');
        $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
        $('.temp-box').remove();

        if ($('video.attach-video')[0]) {
            $('video.attach-video')[0].pause();
        }

        if ($('img.attach-photo')[0]) {
            $('img.attach-photo').attr('src', 'images/photo_preloader.gif');
        }
    }

    function setAttachType(type) {
        var otherType = type === 'photo' ? 'video' : 'photo';

        $('.attach-' + type).removeClass('is-hidden')
            .siblings('.attach-' + otherType).addClass('is-hidden');
    }

    function setTriagle(UpOrDown) {
        var $chat = $('.l-chat:visible'),
            $triangle = $chat.find('.triangle_' + UpOrDown);

        $triangle.removeClass('is-hidden')
            .siblings('.triangle').addClass('is-hidden');

        $chat.find('.chat-occupants-wrap').toggleClass('is-overlay');
        $chat.find('.l-chat-content').toggleClass('l-chat-content_min');
    }

    return Events;

});
