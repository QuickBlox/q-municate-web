/*
 * Q-municate chat application
 *
 * Dialog View Module
 *
 */
define([
    'jquery',
    'config',
    'quickblox',
    'Entities',
    'Helpers',
    'QMHtml',
    'minEmoji',
    'underscore',
    'models/person',
    'views/profile',
    'views/change_password',
    'views/fb_import',
    'mCustomScrollbar',
    'nicescroll',
    'mousewheel'
], function(
    $,
    QMCONFIG,
    QB,
    Entities,
    Helpers,
    QMHtml,
    minEmoji,
    _,
    Person,
    ProfileView,
    ChangePassView,
    FBImportView
) {

    var User, Dialog, Message, ContactList;
    var unreadDialogs = {};
    var currentUser, profileView, changePassView, fbImportView;

    var TITLE_NAME = 'Q-municate',
        FAVICON_COUNTER = 'images/favicon_counter.png',
        FAVICON = 'images/favicon.png';

    function DialogView(app) {
        this.app = app;
        User = this.app.models.User;
        Dialog = this.app.models.Dialog;
        Message = this.app.models.Message;
        ContactList = this.app.models.ContactList;
    }

    DialogView.prototype = {

        // QBChat handlers
        chatCallbacksInit: function() {
            var self = this;

            var ContactListView = this.app.views.ContactList,
                MessageView = this.app.views.Message,
                VideoChat = this.app.models.VideoChat,
                VideoChatView = this.app.views.VideoChat;

            QB.chat.onMessageListener         = MessageView.onMessage;
            QB.chat.onMessageTypingListener   = MessageView.onMessageTyping;
            QB.chat.onSystemMessageListener   = MessageView.onSystemMessage;
            QB.chat.onDeliveredStatusListener = MessageView.onDeliveredStatus;
            QB.chat.onReadStatusListener      = MessageView.onReadStatus;

            QB.chat.onContactListListener      = ContactListView.onPresence;
            QB.chat.onSubscribeListener        = ContactListView.onSubscribe;
            QB.chat.onConfirmSubscribeListener = ContactListView.onConfirm;
            QB.chat.onRejectSubscribeListener  = ContactListView.onReject;

            if (QB.webrtc) {
                QB.webrtc.onCallListener          = VideoChatView.onCall;
                QB.webrtc.onAcceptCallListener    = VideoChatView.onAccept;
                QB.webrtc.onRejectCallListener    = VideoChatView.onReject;
                QB.webrtc.onInvalidEventsListener = VideoChatView.onIgnored;
                QB.webrtc.onStopCallListener      = VideoChatView.onStop;
                QB.webrtc.onUpdateCallListener    = VideoChatView.onUpdateCall;
                QB.webrtc.onRemoteStreamListener  = VideoChatView.onRemoteStream;
                QB.webrtc.onCallStatsReport       = VideoChatView.onCallStatsReport;
                QB.webrtc.onSessionCloseListener  = VideoChatView.onSessionCloseListener;
                QB.webrtc.onUserNotAnswerListener = VideoChatView.onUserNotAnswerListener;
            }

            QB.chat.onDisconnectedListener = function() {
                if ('div.popups.is-overlay') {
                    $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
                }
                $('.j-disconnect').addClass('is-overlay')
                    .parent('.j-overlay').addClass('is-overlay');
            };

            QB.chat.onReconnectListener = function() {
                $('.j-disconnect').removeClass('is-overlay')
                    .parent('.j-overlay').removeClass('is-overlay');
            };

            QB.chat.onReconnectFailedListener = function(error) {
                if (error) {
                    self.app.service.reconnectChat();
                }
            };

            currentUser = new Person(_.clone(User.contact), {
                app: this.app,
                parse: true
            });
            profileView = new ProfileView({
                model: currentUser
            });
            changePassView = new ChangePassView({
                model: currentUser
            });
            fbImportView = new FBImportView();
            this.app.views.Profile = profileView;
            this.app.views.ChangePass = changePassView;
            this.app.views.FBImport = fbImportView;
        },

        createDataSpinner: function(chat, groupchat, isAjaxDownloading) {
            this.removeDataSpinner();

            var spinnerBlock;
            if (isAjaxDownloading) {
                spinnerBlock = '<div class="message message_service"><div class="popup-elem spinner_bounce is-empty is-ajaxDownload">';
            } else if (groupchat) {
                spinnerBlock = '<div class="popup-elem spinner_bounce is-creating">';
            } else {
                spinnerBlock = '<div class="popup-elem spinner_bounce is-empty">';
            }

            spinnerBlock += '<div class="spinner_bounce-bounce1"></div>';
            spinnerBlock += '<div class="spinner_bounce-bounce2"></div>';
            spinnerBlock += '<div class="spinner_bounce-bounce3"></div>';
            spinnerBlock += '</div>';

            if (isAjaxDownloading) spinnerBlock += '</div>';

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

        prepareDownloading: function(roster) {
            Helpers.log('QB SDK: Roster has been got', roster);
            this.chatCallbacksInit();
            this.createDataSpinner();
            scrollbar();
            ContactList.saveRoster(roster);

            this.app.views.Settings.setUp(User.contact.id);
            this.app.models.SyncTabs.init(User.contact.id);
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
            unreadDialogs = {};
            $('title').text(TITLE_NAME);
            $('link[rel="icon"]').remove();
            $('head').append('<link rel="icon" href="' + FAVICON + '">');
            $('.mediacall-remote-duration').text('connecting...');
            $('.mediacall-info-duration').text('');
        },

        downloadDialogs: function(roster, ids) {
            var self = this,
                ContactListView = this.app.views.ContactList,
                hiddenDialogs = sessionStorage['QM.hiddenDialogs'] ? JSON.parse(sessionStorage['QM.hiddenDialogs']) : {},
                rosterIds = Object.keys(roster),
                notConfirmed,
                private_id,
                dialogId,
                dialogs,
                dialog,
                occupants_ids,
                chat;

            Dialog.download(function(dialogs) {
                self.removeDataSpinner();

                if (dialogs.length > 0) {

                    occupants_ids = _.uniq(_.flatten(_.pluck(dialogs, 'occupants_ids'), true));

                    // updating of Contact List whereto are included all people
                    // with which maybe user will be to chat (there aren't only his friends)
                    ContactList.add(occupants_ids, null, function() {

                        for (var i = 0, len = dialogs.length; i < len; i++) {
                            dialogId = Dialog.create(dialogs[i]);
                            dialogsCollection = Entities.Collections.dialogs;
                            dialog = dialogsCollection.get(dialogId);

                            // don't create a duplicate dialog in contact list
                            chat = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="' + dialog.get('id') + '"]');
                            if (chat[0] && dialog.get('unread_count')) {
                                chat.find('.unread').text(dialog.get('unread_count'));
                                self.getUnreadCounter(dialog.get('id'));
                                continue;
                            }

                            if (dialog.get('type') === 2) {
                                QB.chat.muc.join(dialog.get('room_jid'));
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

                            self.addDialogItem(dialog, true);
                        }

                        if ($('#requestsList').is('.is-hidden') &&
                            $('#recentList').is('.is-hidden') &&
                            $('#historyList').is('.is-hidden')) {

                            $('#emptyList').removeClass('is-hidden');
                        }

                    });

                } else {
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

            });
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
            $('.l-list').addClass('is-hidden');
            $('.l-list ul').html('');
        },

        addDialogItem: function(dialog, isDownload, isNew) {
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
                startOfCurrentDay,
                private_id,
                status,
                icon,
                name,
                html,
                self = this;

            private_id = dialog_type === 3 ? occupants_ids[0] : null;

            try {
                icon = private_id ? contacts[private_id].avatar_url : (room_photo || QMCONFIG.defAvatar.group_url);
                name = private_id ? contacts[private_id].full_name : room_name;
                status = roster[private_id] ? roster[private_id] : null;
            } catch (error) {
                console.error(error);
            }

            html  = '<li class="list-item dialog-item j-dialogItem presence-listener" data-dialog="' + dialog_id + '" data-id="' + private_id + '">';
            html += '<div class="contact l-flexbox" href="#">';
            html += '<div class="l-flexbox_inline">';
            html += '<div class="contact-avatar avatar profileUserAvatar" style="background-image:url(' + icon + ')" data-id="' + private_id + '"></div>';
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

            // checking if this dialog is recent OR no
            if (!last_message_date_sent || new Date(last_message_date_sent * 1000) > startOfCurrentDay || isNew) {
                if (isDownload) {
                    $('#recentList').removeClass('is-hidden').find('ul').append(html);
                } else if (!$('#searchList').is(':visible')) {
                    $('#recentList').removeClass('is-hidden').find('ul').prepend(html);
                    $('[data-dialog="' + dialog_id + '"] .contact').click();
                } else {
                    $('#recentList').removeClass('is-hidden').find('ul').prepend(html);
                    $('[data-dialog="' + dialog_id + '"] .contact').click();
                }
            } else if (!$('#searchList').is(':visible')) {
                $('#historyList').removeClass('is-hidden').find('ul').append(html);
            }

            $('#emptyList').addClass('is-hidden');
            if (unread_count) {
                self.getUnreadCounter(dialog_id);
            }
        },


        htmlBuild: function(objDom, messages) {
            var MessageView = this.app.views.Message,
                contacts = ContactList.contacts,
                dialogs = Entities.Collections.dialogs,
                roster = ContactList.roster,
                parent = objDom.parent(),
                dialog_id = parent.data('dialog'),
                user_id = parent.data('id'),
                dialog = dialogs.get(dialog_id),
                user = contacts[user_id],
                $chat = $('.l-chat[data-dialog="' + dialog_id + '"]'),
                readBadge = 'QM.' + User.contact.id + '_readBadge',
                unreadCount = Number(objDom.find('.unread').text()),
                occupants_ids = dialog.get('occupants_ids'),
                self = this,
                chatTpl,
                messageId,
                location,
                status,
                msgArr,
                userId,
                html,
                icon,
                name,
                jid;

            jid = dialog.get('room_jid') || user.user_jid;
            icon = user_id ? user.avatar_url : (dialog.get('room_photo') || QMCONFIG.defAvatar.group_url);
            name = dialog.get('room_name') || user.full_name;
            status = roster[user_id] ? roster[user_id] : null;
            location = (localStorage['QM.latitude'] && localStorage['QM.longitude']) ? 'btn_active' : '';

            $('.l-workspace-wrap .l-workspace').addClass('is-hidden');

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

            textAreaScrollbar();
            self.createDataSpinner(true);
            self.messageScrollbar();
            self.showChatWithNewMessages(dialog_id, unreadCount, messages);

            removeNewMessagesLabel($('.is-selected').data('dialog'), dialog_id);
            $('.is-selected').removeClass('is-selected');
            parent.addClass('is-selected').find('.unread').text('');
            self.decUnreadCounter(dialog.get('id'));

            // set dialog_id to localStorage wich must bee read in all tabs for same user
            localStorage.removeItem(readBadge);
            localStorage.setItem(readBadge, dialog_id);
        },

        messageScrollbar: function() {
            var $objDom = $('.l-chat:visible .scrollbar_message'),
                height = $objDom[0].scrollHeight,
                self = this;

            $objDom.mCustomScrollbar({
                theme: 'minimal-dark',
                scrollInertia: 'auto',
                mouseWheel: {
                    scrollAmount: 120,
                    deltaFactor: 'auto'
                },
                setTop: height + 'px',
                callbacks: {
                    onTotalScrollBack: function() {
                        ajaxDownloading($objDom, self);
                    },
                    onTotalScroll: function() {
                        var isBottom = Helpers.isBeginOfChat(),
                            $currentDialog = $('.dialog-item.is-selected'),
                            dialogId = $currentDialog.data('dialog');

                        if (isBottom) {
                            $('.j-toBottom').hide();
                            $currentDialog.find('.unread').text('');
                            self.decUnreadCounter(dialogId);
                        }
                    },
                    onScroll: function() {
                        var isBottom = Helpers.isBeginOfChat();
                        if (!isBottom) {
                            $('.j-toBottom').show();
                        }
                    }
                },
                live: true
            });

        },

        createGroupChat: function(type, dialog_id) {
            var contacts = ContactList.contacts,
                new_members = $('#popupContacts .is-chosen'),
                occupants_ids = $('#popupContacts').data('existing_ids') || [],
                groupName = occupants_ids.length > 0 ? [User.contact.full_name, contacts[occupants_ids[0]].full_name] : [User.contact.full_name],
                occupants_names = !type && occupants_ids.length > 0 ? [contacts[occupants_ids[0]].full_name] : [],
                self = this,
                new_ids = [],
                new_id, occupant,
                roster = ContactList.roster,
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
                    $('.dialog-item[data-dialog="' + dialog.get('id') + '"]').find('.contact').click();
                });
            }
        },

        leaveGroupChat: function(dialogParam, sameUser) {
            var dialogs = Entities.Collections.dialogs,
                dialog_id = (typeof dialogParam === 'string') ? dialogParam : dialogParam.data('dialog'),
                dialog = dialogs.get(dialog_id),
                li = $('.dialog-item[data-dialog="' + dialog_id + '"]'),
                chat = $('.l-chat[data-dialog="' + dialog_id + '"]'),
                list = li.parents('ul');

            if (sameUser) {
                removeDialogItem();
            } else {
                Dialog.leaveChat(dialog, function() {
                    removeDialogItem();
                });
            }

            function removeDialogItem() {
                li.remove();
                Helpers.Dialogs.isSectionEmpty(list);

                // delete chat section
                if (chat.is(':visible')) {
                    $('.j-capBox').removeClass('is-hidden')
                        .siblings().removeClass('is-active');

                    $('.j-chatWrap').addClass('is-hidden')
                        .children().remove();
                }

            }

        },

        showChatWithNewMessages: function(dialogId, unreadCount, messages) {
            var MessageView = this.app.views.Message,
                self = this,
                lastReaded,
                message,
                count;

            var MIN_STACK = 20,
                MAX_STACK = 100,
                lessThenMinStack = unreadCount < MIN_STACK,
                moreThenMinStack = unreadCount > (MIN_STACK - 1),
                lessThenMaxStack = unreadCount < MAX_STACK;

            if (lessThenMinStack) {
                lastReaded = unreadCount;
            } else if (moreThenMinStack && lessThenMaxStack) {
                lastReaded = unreadCount;
                count = unreadCount + 1;
            } else {
                lastReaded = MAX_STACK - 1;
                count = MAX_STACK;
            }


            if (messages) {
                addItems(messages);
            } else {
                messages = [];

                Message.download(dialogId, function(response) {
                    _.each(response, function(item) {
                        messages.push(Message.create(item));
                    });

                    addItems(messages);
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

                    MessageView.addItem(message, null, null, message.recipient_id);
                }

                setScrollToNewMessages();

                setTimeout(function () {
                    self.removeDataSpinner();
                    $history.css('opacity', '1');
                }, 120);
            }

        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function scrollbar() {
        $('.l-sidebar .scrollbar').mCustomScrollbar({
            theme: 'minimal-dark',
            scrollInertia: 150,
            mouseWheel: {
                scrollAmount: 100,
                deltaFactor: 0
            },
            live: true
        });
    }

    function textAreaScrollbar() {
        $('.l-chat:visible .textarea').niceScroll({
            cursoropacitymax: 0.5,
            railpadding: {
                right: -13
            },
            zindex: 1,
            enablekeyboard: false
        });
    }

    // ajax downloading of data through scroll
    function ajaxDownloading($chat, self) {
        var MessageView = self.app.views.Message,
            dialog_id = $chat.parents('.l-chat').data('dialog'),
            count = $chat.find('.message').length,
            message;

        var listHeightBefore = $chat.find('.mCSB_container').height(),
            draggerHeightBefore = $chat.find('.mCSB_dragger').height(),
            viewPort = $chat.find('.mCustomScrollBox').height();

        Message.download(dialog_id, function(messages) {
            for (var i = 0, len = messages.length; i < len; i++) {
                message = Message.create(messages[i], 'ajax');
                message.stack = Message.isStack(false, messages[i], messages[i + 1]);

                MessageView.addItem(message, true);

                if ((i + 1) === len) {
                    var listHeightAfter = $chat.find('.mCSB_container').height(),
                        draggerHeightAfter = $chat.find('.mCSB_dragger').height(),
                        thisStopList = listHeightBefore - listHeightAfter,
                        thisStopDragger = (draggerHeightAfter / (draggerHeightBefore + draggerHeightAfter)) * viewPort;

                    $('.l-chat-content .mCSB_container').css({
                        top: thisStopList + 'px'
                    });
                    $('.l-chat-content .mCSB_dragger').css({
                        top: thisStopDragger + 'px'
                    });
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

    function setScrollToNewMessages() {
        var $chat = $('.l-chat:visible .scrollbar_message'),
            isBottom = Helpers.isBeginOfChat(),
            isScrollDragger = $chat.find('.mCSB_draggerContainer').length;

        if ($('.j-newMessages').length) {
            $chat.mCustomScrollbar('scrollTo', '.j-newMessages');
        } else {
            $chat.mCustomScrollbar('scrollTo', 'bottom');
        }

        if (!isBottom && isScrollDragger) {
            $('.j-toBottom').show();
        }
    }

    function removeNewMessagesLabel(dialogId, curDialogId) {
        var $label = $('.j-newMessages[data-dialog="' + dialogId + '"]');

        if ($label.length && (dialogId !== curDialogId)) {
            $label.remove();
        }
    }

    return DialogView;

});
