/*
 * Q-municate chat application
 *
 * Dialog View Module
 *
 */
define([
    'jquery',
    'underscore',
    'config',
    'quickblox',
    'Entities',
    'Helpers',
    'QMHtml',
    'minEmoji',
    'perfectscrollbar',
    'mCustomScrollbar',
    'nicescroll',
    'mousewheel'
], function(
    $,
    _,
    QMCONFIG,
    QB,
    Entities,
    Helpers,
    QMHtml,
    minEmoji,
    Ps
) {

    var self;

    var User,
        Dialog,
        Message,
        ContactList,
        VoiceMessage,
        Listeners,
        errorDialogsLoadingID,
        errorMessagesLoadingID,
        UPDATE_PERIOD = 10000;

    var unreadDialogs = {};

    var TITLE_NAME = 'Q-municate',
        FAVICON_COUNTER = 'images/favicon_counter.png',
        FAVICON = 'images/favicon.png';

    function DialogView(app) {
        self = this;

        this.app = app;
        User = this.app.models.User;
        Dialog = this.app.models.Dialog;
        Message = this.app.models.Message;
        ContactList = this.app.models.ContactList;
        VoiceMessage = this.app.models.VoiceMessage;
        Listeners = this.app.listeners;
    }

    DialogView.prototype = {

        createDataSpinner: function(chat, groupchat, isAjaxDownloading) {
            this.removeDataSpinner();

            var spinnerBlock;
            if (isAjaxDownloading) {
                spinnerBlock = '<div class="message message_service msg_preloader">' +
                    '<div class="popup-elem j-loading spinner_bounce is-empty is-ajaxDownload">';
            } else if (groupchat) {
                spinnerBlock = '<div class="popup-elem j-loading spinner_bounce is-creating">';
            } else {
                spinnerBlock = '<div class="popup-elem j-loading spinner_bounce is-empty">';
            }

            spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
            spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
            spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
            spinnerBlock += '</div>';

            if (isAjaxDownloading) {
                spinnerBlock += '</div>';
            }

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

        prepareDownloading: function() {
            scrollbarAside();
            Listeners.setQBHandlers();
            User.initProfile();
            self.createDataSpinner();
            self.app.views.Settings.setUp(User.contact.id);
            self.app.models.SyncTabs.init(User.contact.id);
        },

        getUnreadCounter: function(dialog_id) {
            var counter;

            if (typeof unreadDialogs[dialog_id] === 'undefined') {
                unreadDialogs[dialog_id] = true;
                counter = Object.keys(unreadDialogs).length;

                $('title').text('(' + counter + ') ' + TITLE_NAME);
                $('link[rel="icon"]').remove();
                $('head').append('<link rel="icon" href="' + FAVICON_COUNTER + '">');
            }
        },

        decUnreadCounter: function(dialog_id) {
            var counter;

            if (typeof unreadDialogs[dialog_id] !== 'undefined') {
                delete unreadDialogs[dialog_id];
                counter = Object.keys(unreadDialogs).length;

                if (counter > 0) {
                    $('title').text('(' + counter + ') ' + TITLE_NAME);
                } else {
                    $('title').text(TITLE_NAME);
                    $('link[rel="icon"]').remove();
                    $('head').append('<link rel="icon" href="' + FAVICON + '">');
                }
            }
        },

        logoutWithClearData: function() {
            scrollbarAside(true);
            unreadDialogs = {};
            $('title').text(TITLE_NAME);
            $('link[rel="icon"]').remove();
            $('head').append('<link rel="icon" href="' + FAVICON + '">');
            $('.mediacall-remote-duration').text('connecting...');
            $('.mediacall-info-duration').text('');
        },

        downloadDialogs: function(ids, skip) {
            var ContactListView = this.app.views.ContactList,
                hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
                parameter = !skip ? null : 'old_dialog',
                dialogsCollection = Entities.Collections.dialogs,
                activeId = Entities.active,
                roster = ContactList.roster,
                rosterIds = Object.keys(roster),
                totalEntries,
                localEntries,
                occupants_ids,
                notConfirmed,
                private_id,
                dialogId,
                dialogs,
                dialog,
                chat;

            self.removeDataSpinner();
            self.createDataSpinner();

            Dialog.download({
                'sort_desc': 'last_message_date_sent',
                'skip': skip || 0
            }, function(error, result) {
                if (error) {
                    self.removeDataSpinner();

                    errorDialogsLoadingID = setTimeout(function() {
                        self.downloadDialogs(ids, skip);
                    }, UPDATE_PERIOD);

                    return false;
                } else {
                    clearTimeout(errorDialogsLoadingID);
                }

                dialogs = result.items;
                totalEntries = result.total_entries;
                localEntries = result.limit + result.skip;

                if (dialogs.length > 0) {
                    occupants_ids = _.uniq(_.flatten(_.pluck(dialogs, 'occupants_ids'), true));
                    // updating of Contact List whereto are included all people
                    // with which maybe user will be to chat (there aren't only his friends)
                    ContactList.add(occupants_ids, null, function() {
                        for (var i = 0, len = dialogs.length; i < len; i++) {
                            dialogId = Dialog.create(dialogs[i]);
                            dialog = dialogsCollection.get(dialogId);

                            // don't create a duplicate dialog in contact list
                            chat = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="' + dialog.get('id') + '"]');
                            if (chat[0] && dialog.get('unread_count')) {
                                chat.find('.unread').text(dialog.get('unread_count'));
                                self.getUnreadCounter(dialog.get('id'));
                                continue;
                            }

                            if ((dialog.get('type') === 2) && !dialog.get('joined')) {
                                QB.chat.muc.join(dialog.get('room_jid'));
                                dialog.set('joined', true);
                            }

                            // update hidden dialogs
                            private_id = dialog.get('type') === 3 ? dialog.get('occupants_ids')[0] : null;
                            hiddenDialogs[private_id] = dialog.get('id');
                            ContactList.saveHiddenDialogs(hiddenDialogs);

                            // not show dialog if user has not confirmed this contact
                            notConfirmed = localStorage['QM.notConfirmed'] ? JSON.parse(localStorage['QM.notConfirmed']) : {};
                            if (private_id && (!roster[private_id] ||
                                (roster[private_id] && roster[private_id].subscription === 'none' &&
                                !roster[private_id].ask && notConfirmed[private_id]))) {
                                continue;
                            }

                            self.addDialogItem(dialog, true, parameter);
                        }

                        if ($('#requestsList').is('.is-hidden') &&
                            $('#recentList').is('.is-hidden') &&
                            $('#historyList').is('.is-hidden')) {

                            $('#emptyList').removeClass('is-hidden');
                        }

                    });

                } else if (!skip) {
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
                self.removeDataSpinner();

                if (totalEntries >= localEntries) {
                    self.downloadDialogs(ids, localEntries);
                } else if (activeId) {
                    dialogsCollection.get(activeId)
                                     .set({opened: false});
                    dialogsCollection.selectDialog(activeId);
                }
            });
        },

        showOldHistory: function(callback) {
            var hiddenDialogs = $('#oldHistoryList ul').children('.j-dialogItem'),
                visibleDialogs = $('#historyList ul'),
                total = hiddenDialogs.length,
                limit = total > 100 ? 100 : total,
                offListener = false;

            if (total === limit) {
                offListener = true;
            }

            visibleDialogs.append(hiddenDialogs.slice(0, limit));
            callback(offListener);
        },

        getAllUsers: function(rosterIds) {
            var QBApiCalls = this.app.service,
                Contact = this.app.models.Contact,
                ContactList = this.app.models.ContactList,
                params = {
                    filter: {
                        field: 'id',
                        param: 'in',
                        value: rosterIds
                    },
                    per_page: 100
                };

            QBApiCalls.listUsers(params, function(users) {
                users.items.forEach(function(qbUser) {
                    var user = qbUser.user;
                    var contact = Contact.create(user);

                    ContactList.contacts[contact.id] = contact;

                    $('.profileUserName[data-id="' + contact.id + '"]').text(contact.full_name);
                    $('.profileUserStatus[data-id="' + contact.id + '"]').text(contact.status);
                    $('.profileUserPhone[data-id="' + contact.id + '"]').html(
                        '<span class="userDetails-label">Phone:</span><span class="userDetails-phone">' + contact.phone + '</span>'
                    );
                    $('.profileUserAvatar[data-id="' + contact.id + '"]').css('background-image', 'url(' + contact.avatar_url + ')');

                    localStorage.setItem('QM.contact-' + contact.id, JSON.stringify(contact));
                });
            });
        },

        hideDialogs: function() {
            $('.j-aside_list_item').addClass('is-hidden');
            $('.j-list').each(function(index, element){
                $(element).html('');
            });
        },

        addDialogItem: function(dialog, isDownload, parameter) {
            if (!dialog) {
                Helpers.log('Dialog is undefined');
                return false;
            }

            var contacts = ContactList.contacts,
                roster = ContactList.roster,
                last_message_date_sent = dialog.get('last_message_date_sent'),
                occupants_ids = dialog.get('occupants_ids'),
                unread_count = dialog.get('unread_count'),
                room_photo = dialog.get('room_photo'),
                room_name = dialog.get('room_name'),
                dialog_type = dialog.get('type'),
                dialog_id =  dialog.get('id'),
                lastTime = Helpers.getTime(last_message_date_sent, true),
                lastMessage = minEmoji(Helpers.Messages.parser(dialog.get('last_message'))),
                defaultAvatar = private_id ? QMCONFIG.defAvatar.url : QMCONFIG.defAvatar.group_url,
                startOfCurrentDay,
                private_id,
                status,
                icon,
                name,
                html;

            private_id = dialog_type === 3 ? occupants_ids[0] : null;

            try {
                icon = (private_id && contacts[private_id]) ? contacts[private_id].avatar_url : (room_photo || defaultAvatar);
                name = (private_id && contacts[private_id]) ? contacts[private_id].full_name : room_name;
                status = roster[private_id] ? roster[private_id] : null;
            } catch (error) {
                console.error(error);
            }

            html  = '<li class="list-item dialog-item j-dialogItem presence-listener" data-dialog="' + dialog_id + '" data-id="' + private_id + '">';
            html += '<div class="contact l-flexbox" href="#">';
            html += '<div class="l-flexbox_inline">';
            html += '<div class="contact-avatar avatar profileUserAvatar j-avatar" style="background-image: url(' + icon + ')" data-id="' + private_id + '"></div>';
            html += '<div class="dialog_body"><span class="name name_dialog profileUserName" data-id="' + private_id + '">' + name + '</span>';
            html += '<span class="last_message_preview j-lastMessagePreview">' + lastMessage + '</span></div></div>';

            if (dialog_type === 3) {
                html += getStatus(status);
            } else {
                html += '<span class="status"></span>';
            }

            html += '<span class="last_time_preview j-lastTimePreview">' + lastTime + '</span>';
            html += '<span class="unread">' + unread_count + '</span>';
            html += '</a></li>';

            startOfCurrentDay = new Date();
            startOfCurrentDay.setHours(0, 0, 0, 0);

            // remove duplicate and replace to newest
            var $dialogItem = $('.j-dialogItem[data-dialog="'+dialog_id+'"]');

            if ($dialogItem.length) {
                $dialogItem.remove();
            }

            // checking if this dialog is recent OR no
            if (!last_message_date_sent ||
                (new Date(last_message_date_sent * 1000) > startOfCurrentDay) ||
                parameter === 'new_dialog') {

                if (isDownload) {
                    $('#recentList').removeClass('is-hidden').find('ul').append(html);
                } else if (!$('#searchList').is(':visible')) {
                    $('#recentList').removeClass('is-hidden').find('ul').prepend(html);
                } else {
                    $('#recentList').removeClass('is-hidden').find('ul').prepend(html);
                }
            } else if (parameter === 'old_dialog') {
                $('#oldHistoryList').find('ul').append(html);
            } else if (!$('#searchList').is(':visible')) {
                $('#historyList').removeClass('is-hidden').find('ul').append(html);
            }

            $('#emptyList').addClass('is-hidden');
            if (unread_count) {
                self.getUnreadCounter(dialog_id);
            }

            if (icon !== defaultAvatar) {
                self.validateAvatar({
                    privateId: private_id,
                    dialogId: dialog_id,
                    iconURL: icon
                });
            }
        },


        htmlBuild: function(elemOrId, messages) {
            Entities.Collections.dialogs.saveDraft();

            var QBApiCalls = this.app.service,
                contacts = ContactList.contacts,
                dialogs = Entities.Collections.dialogs,
                roster = ContactList.roster,
                $dialog = (typeof elemOrId === 'object') ? elemOrId :
                    $('.j-dialogItem[data-dialog="'+ elemOrId + '"]'),
                dialog_id = $dialog.data('dialog'),
                user_id = $dialog.data('id'),
                dialog = dialogs.get(dialog_id),
                user = contacts[user_id],
                readBadge = 'QM.' + User.contact.id + '_readBadge',
                unreadCount = Number($dialog.find('.unread').text()),
                occupants_ids = dialog.get('occupants_ids'),
                $chatWrap = $('.j-chatWrap'),
                $chatView = $('.chatView'),
                $selected = $('.is-selected'),
                isBlocked,
                isCall,
                location,
                status,
                html,
                icon,
                name,
                jid;

            // remove the private dialog with deleted user
            if (user_id && !user) {
                QBApiCalls.getUser(user_id, function(res) {
                    if (!res.items.length) {
                        self.deleteChat(dialog_id);
                    }
                });

                return false;
            }

            Entities.active = dialog_id;
            isBlocked = $('.icon_videocall, .icon_audiocall').length;
            isCall = $dialog.find('.icon_videocall').length || $dialog.find('.icon_audiocall').length;
            jid = dialog.get('room_jid') || user.user_jid;
            icon = user_id ? user.avatar_url : (dialog.get('room_photo') || QMCONFIG.defAvatar.group_url);
            name = dialog.get('room_name') || user.full_name;
            status = roster[user_id] ? roster[user_id] : null;
            location = (localStorage['QM.latitude'] && localStorage['QM.longitude']) ? 'btn_active' : '';
            Message.skip = 0;

            $('.l-workspace-wrap .l-workspace').addClass('is-hidden');

            $chatView.each(function(index, element) {
                var $element = $(element);

                if ($element.hasClass('j-mediacall')) {
                    $element.addClass('is-hidden');
                } else {
                    $element.remove();
                }
            });

            if (isCall) {
                $chatWrap.removeClass('is-hidden');
                $chatView.removeClass('is-hidden');
            } else {
                buildChat();
            }

            textAreaScrollbar('#textarea_'+dialog_id);
            messageScrollbar('#mCS_'+dialog_id);

            self.showChatWithNewMessages(dialog_id, unreadCount, messages);

            removeNewMessagesLabel($selected.data('dialog'), dialog_id);

            $selected.removeClass('is-selected');
            $dialog.addClass('is-selected')
                   .find('.unread').text('');
            self.decUnreadCounter(dialog.get('id'));

            // set dialog_id to localStorage wich must bee read in all tabs for same user
            localStorage.removeItem(readBadge);
            localStorage.setItem(readBadge, dialog_id);


            // reset recorder state
            VoiceMessage.resetRecord();

            if (isBlocked) {
                VoiceMessage.blockRecorder('during a call');
            }

            function buildChat() {
                new Entities.Models.Chat({
                    'occupantsIds': occupants_ids,
                    'status': getStatus(status),
                    'dialog_id': dialog_id,
                    'draft': dialog.get('draft'),
                    'location': location,
                    'type': dialog.get('type'),
                    'user_id': user_id,
                    'name': name,
                    'icon': icon,
                    'jid': jid
                });

                // build occupants of room
                if (dialog.get('type') === 2) {
                    html = '<div class="chat-occupants">';
                    for (var i = 0, len = occupants_ids.length, id; i < len; i++) {
                        id = occupants_ids[i];
                        if (!contacts[id]) continue;
                        if (id != User.contact.id) {
                            html += '<a class="occupant l-flexbox_inline presence-listener" data-id="' + id + '" href="#">';
                            html += getStatus(roster[id]);
                            html += '<span class="name name_occupant">' + contacts[id].full_name + '</span>';
                            html += '</a>';
                        }
                    }
                    html += '</div>';

                }

                $('.l-chat[data-dialog="' + dialog_id + '"] .j-chatOccupants').append($(html));

                if (dialog.get('type') === 3 && (!status || status.subscription === 'none')) {
                    $('.l-chat:visible').addClass('is-request');
                }

                if (!VoiceMessage.supported) {
                    VoiceMessage.blockRecorder();
                }
            }
        },

        createGroupChat: function(type, dialog_id) {
            var contacts = ContactList.contacts,
                new_members = $('#popupContacts .is-chosen'),
                occupants_ids = $('#popupContacts').data('existing_ids') || [],
                groupName = occupants_ids.length > 0 ? [User.contact.full_name, contacts[occupants_ids[0]].full_name] : [User.contact.full_name],
                occupants_names = !type && occupants_ids.length > 0 ? [contacts[occupants_ids[0]].full_name] : [],
                new_ids = [],
                chat = $('.l-chat[data-dialog="' + dialog_id + '"]');

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
                Dialog.updateGroup(occupants_names, {
                    dialog_id: dialog_id,
                    occupants_ids: occupants_ids,
                    new_ids: new_ids
                }, function(dialog) {
                    self.removeDataSpinner();
                    var dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="' + dialog.get('id') + '"]');
                    if (dialogItem.length > 0) {
                        copyDialogItem = dialogItem.clone();
                        dialogItem.remove();
                        $('#recentList ul.j-list').prepend(copyDialogItem);
                        if (!$('#searchList').is(':visible')) {
                            $('#recentList').removeClass('is-hidden');
                            Helpers.Dialogs.isSectionEmpty($('#recentList ul.j-list'));
                        }
                    }
                    $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
                });
            } else {
                Dialog.createGroup(occupants_names, {
                    name: groupName,
                    occupants_ids: occupants_ids,
                    type: 2
                }, function(dialog) {
                    self.removeDataSpinner();
                    $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
                    $('[data-dialog="' + dialog_id + '"] .contact').click();
                    $('.dialog-item[data-dialog="' + dialog.get('id') + '"]').find('.contact').click();
                });
            }
        },

        deleteChat: function(dialogParam, sameUser) {
            var dialogs = Entities.Collections.dialogs,
                dialogId = (typeof dialogParam === 'string') ? dialogParam : dialogParam.data('dialog'),
                dialog = dialogs.get(dialogId);

            // reset recorder state
            VoiceMessage.resetRecord(dialogId);

            if (!sameUser) {
                Dialog.deleteChat(dialog);
            }

            self.removeDialogItem(dialogId);
        },

        removeDialogItem: function(dialogId) {
            var $dialogItem = $('.dialog-item[data-dialog="' + dialogId + '"]'),
                $chat = $('.l-chat[data-dialog="' + dialogId + '"]'),
                $dialogList = $dialogItem.parents('ul'),
                $mediacall = $chat.find('.mediacall');

            if ($mediacall.length > 0) {
                $mediacall.find('.btn_hangup').click();
            }

            $dialogItem.remove();

            Helpers.Dialogs.isSectionEmpty($dialogList);

            // delete chat section
            if ($chat.is(':visible')) {
                $('.j-capBox').removeClass('is-hidden')
                    .siblings().removeClass('is-active');

                $('.j-chatWrap').addClass('is-hidden')
                    .children().remove();
            }

            if (Entities.active === dialogId) {
                Entities.active = '';
            }

            if ($chat.length > 0) {
                $chat.remove();
            }
        },

        removeForbiddenDialog: function(dialogId) {
            var dialogs = Entities.Collections.dialogs,
                $mediacall = $('.mediacall');

            if ($mediacall.length > 0) {
                $mediacall.find('.btn_hangup').click();
            }

            this.removeDialogItem(dialogId);
            this.decUnreadCounter(dialogId);

            dialogs.remove(dialogId);

            return false;
        },

        showChatWithNewMessages: function(dialogId, unreadCount, messages) {
            var MessageView = this.app.views.Message,
                lastReaded,
                message,
                count;

            var MIN_STACK = QMCONFIG.stackMessages,
                MAX_STACK = 100,
                lessThenMinStack = unreadCount < MIN_STACK,
                moreThenMinStack = unreadCount > (MIN_STACK - 1),
                lessThenMaxStack = unreadCount < MAX_STACK;

            if (lessThenMinStack) {
                lastReaded = unreadCount;
                count = MIN_STACK;
            } else if (moreThenMinStack && lessThenMaxStack) {
                lastReaded = unreadCount;
                count = unreadCount + 1;
            } else {
                lastReaded = MAX_STACK - 1;
                count = MAX_STACK;
            }

            self.createDataSpinner(true);

            if (messages) {
                addItems(messages);
            } else {
                messages = [];

                Message.download(dialogId, function(response, error) {
                    if (error) {
                        if (error.code === 403) {
                            self.removeForbiddenDialog(dialogId);
                        } else {
                            self.removeDataSpinner();

                            errorMessagesLoadingID = setTimeout(function() {
                                self.showChatWithNewMessages(dialogId, unreadCount, messages);
                            }, UPDATE_PERIOD);
                        }
                    } else {
                        clearTimeout(errorMessagesLoadingID);

                        _.each(response, function(item) {
                            messages.push(Message.create(item));
                        });

                        addItems(messages);
                    }
                }, count);
            }

            function addItems(items) {
                var $history;

                $history = $('section.l-chat-content').children('div:not(.spinner_bounce)');
                $history.css('opacity', '0');

                for (var i = 0, len = items.length; i < len; i++) {
                    message = items[i];
                    message.stack = Message.isStack(false, items[i], items[i + 1]);

                    if (unreadCount) {
                        switch (i) {
                            case (lastReaded - 1):
                                message.stack = false;
                                break;
                            case lastReaded:
                                setLabelForNewMessages(dialogId);
                                break;
                            default:
                                break;
                        }
                    }

                    MessageView.addItem(message, null, null);
                }

                setScrollToNewMessages('#mCS_'+dialogId);

                setTimeout(function() {
                    self.removeDataSpinner();
                    $history.css('opacity', '1');
                }, 150);
            }

        },

        validateAvatar: function(params) {
            var img = new Image();

            img.addEventListener('load', function() {
                img = undefined;
            });

            img.addEventListener('error', function() {
                setTimeout(function() {
                    var avatar = document.querySelector('.j-dialogItem[data-dialog="' + params.dialogId + '"] .j-avatar');

                    avatar.style.backgroundImage = '';

                    if (params.privateId) {
                        var user = ContactList.contacts[params.privateId];

                        user.avatar_url = QMCONFIG.defAvatar.url;
                        avatar.classList.add('default_single_avatar');
                    } else {
                        var dialog = Entities.Collections.dialogs.get(params.dialogId);

                        dialog.set('room_photo', QMCONFIG.defAvatar.group_url);
                        avatar.classList.add('default_group_avatar');
                    }
                }, 100);

                img = undefined;
            });

            img.src = params.iconURL;
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function messageScrollbar(selector) {
        var isBottom;

        $(selector).mCustomScrollbar({
            theme: 'minimal-dark',
            scrollInertia: 0,
            mouseWheel: {
                scrollAmount: 120
            },
            callbacks: {
                onTotalScrollBack: function() {
                    ajaxDownloading(selector);
                },
                onTotalScroll: function() {
                    var $currentDialog = $('.dialog-item.is-selected'),
                        dialogId = $currentDialog.data('dialog');

                    isBottom = Helpers.isBeginOfChat();

                    if (isBottom) {
                        $('.j-toBottom').hide();
                        $currentDialog.find('.unread').text('');
                        self.decUnreadCounter(dialogId);
                    }
                },
                onScroll: function() {
                    isBottom = Helpers.isBeginOfChat();

                    if (!isBottom) {
                        $('.j-toBottom').show();
                    }

                    Listeners.setChatViewPosition($(this).find('.mCSB_container').offset().top);
                    isNeedToStopTheVideo();
                }
            }
        });
    }

    function scrollbarAside(destroy) {
        var sidebar = document.getElementById('aside_container');

        if (destroy) {
            Ps.destroy(sidebar);
        } else {
            Ps.initialize(sidebar, {
                wheelSpeed: 1,
                wheelPropagation: true,
                minScrollbarLength: 20
            });

            Listeners.listenToPsTotalEnd(true);
        }
    }

    function textAreaScrollbar(selector) {
        $(selector).niceScroll({
            cursoropacitymax: 0.3,
            railpadding: {
                top: 3,
                bottom: 3,
                right: -13
            },
            smoothscroll: false,
            enablemouselockapi: false,
            cursorwidth: '6px',
            autohidemode: "scroll",
            enabletranslate3d: false,
            enablekeyboard: false
        });
    }

    // ajax downloading of data through scroll
    function ajaxDownloading(selector) {
        var MessageView = self.app.views.Message,
            $chat = $('.j-chatItem:visible'),
            dialogId = $chat.data('dialog'),
            messages = $chat.find('.message'),
            firstMsgId = messages.first().attr('id'),
            count = messages.length,
            message;


        Message.download(dialogId, function(messages, error) {
            for (var i = 0, len = messages.length; i < len; i++) {
                if (error && error.code === 403) {
                    self.removeForbiddenDialog(dialogId);

                    return false;
                }

                message = Message.create(messages[i], 'ajax');
                message.stack = Message.isStack(false, messages[i], messages[i + 1]);

                MessageView.addItem(message, true, null);

                if ((i + 1) === len) {
                    $(selector).mCustomScrollbar('scrollTo', '#'+firstMsgId);
                }
            }
        }, count, 'ajax');
    }

    function openPopup(objDom) {
        objDom.add('.popups').addClass('is-overlay');
    }

    function getStatus(status) {
        var str = '';

        if (!status || status.subscription === 'none') {
            str += '<span class="status status_request"></span>';
        } else if (status && status.status) {
            str += '<span class="status status_online"></span>';
        } else {
            str += '<span class="status"></span>';
        }

        return str;
    }

    function setLabelForNewMessages(dialogId) {
        var $chatContainer = $('.l-chat[data-dialog="' + dialogId + '"]').find('.l-chat-content .mCSB_container'),
            $newMessages = $('<div class="new_messages j-newMessages" data-dialog="' + dialogId + '">' +
                '<span class="newMessages">New messages</span></div>');

        $chatContainer.prepend($newMessages);
    }

    function setScrollToNewMessages(selector) {
        var $chat = $('.j-chatItem:visible'),
            isBottom = Helpers.isBeginOfChat(),
            isScrollDragger = $chat.find('.mCSB_draggerContainer').length;

        if ($('.j-newMessages').length) {
            scrollToThrArea('.j-newMessages');
            if (!isBottom && isScrollDragger) {
                $('.j-toBottom').show();
            }
        } else {
            scrollToThrArea('bottom');
        }

        function scrollToThrArea(area) {
            $(selector).mCustomScrollbar('scrollTo', area);
        }
    }

    function removeNewMessagesLabel(dialogId, curDialogId) {
        var $label = $('.j-newMessages[data-dialog="' + dialogId + '"]');

        if ($label.length && (dialogId !== curDialogId)) {
            $label.remove();
        }
    }
    
    function isNeedToStopTheVideo() {
        $('.j-videoPlayer').each(function(index, element) {
            var $element = $(element);

            if (!element.paused) {
                if (($element.offset().top <= 0) || ($element.offset().top >= 750)) {
                    element.pause();
                }
            }
        });
    }

    return DialogView;

});
