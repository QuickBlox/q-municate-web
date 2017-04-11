/**
 * Helper Module
 */
define([
    'jquery',
    'quickblox',
    'underscore',
    'config',
    'QBNotification'
], function(
    $,
    QB,
    _,
    QMCONFIG,
    QBNotification
) {

    var Helpers = {};

    Helpers.Notifications = {

        show: function(title, options) {
            // show notification if all parameters are is
            if (title && options) {
                var notify = new QBNotification(title, options);
                notify.show();
            }
        },

        getTitle: function(message, params) {
            var contacts = params.contacts,
                roomName = params.roomName,
                contact = contacts[message.sender_id],
                title;

            title = roomName || contact.full_name;

            return title;
        },

        getOptions: function(message, params) {
            var myUser = params.user,
                contacts = params.contacts,
                roomPhoto = params.roomPhoto,
                contact = contacts[message.sender_id],
                chatType = message.type,
                photo = (chatType === 'chat') ? (contact.avatar_url || QMCONFIG.defAvatar.url_png) : (roomPhoto || QMCONFIG.defAvatar.group_url_png),
                type = message.notification_type || (message.callState && (parseInt(message.callState) + 7).toString()) || 'message',
                selectDialog = $('.dialog-item[data-dialog="' + message.dialog_id + '"] .contact'),
                occupants_ids,
                occupantsNames = '',
                options,
                text;

            // hot fix (local notifications can't shows image.svg)
            if (photo === 'images/ava-single.svg') {
                photo = QMCONFIG.defAvatar.url_png;
            }

            /**
             * [to prepare the text in the notification]
             * @param  {[type]} type [system notification type]
             * @return {[text]}      [notification description text]
             * 1 - groupchat created
             * 2 - about any changes in groupchat
             * 3 - not use yet
             * 4 - incomming contact request
             * 5 - contact request accepted
             * 6 - contact request rejected
             * 7 - about deleting from contact list
             * 8 - incomming call
             * 9 - about missed call
             * 10 - сamera and/or microphone wasn't found
             * 11 - incoming call
             * 12 - call accepted
             * default - message
             */
            switch (type) {
                // system notifications
                case '1':
                    occupants_ids = _.without(message.current_occupant_ids.split(',').map(Number), contact.id);
                    occupantsNames = Helpers.Messages.getOccupantsNames(occupants_ids, myUser, contacts);
                    text = contact.full_name + ' has added ' + occupantsNames + ' to the group chat';
                    break;

                // groupchat updated
                case '2':
                    text = 'Notification message';
                    break;

                // contacts
                case '4':
                    text = contact.full_name + ' has sent a request to you';
                    break;

                case '5':
                    text = 'Your request has been accepted by ' + contact.full_name;
                    break;

                case '6':
                    text = 'Your request has been rejected by ' + contact.full_name;
                    break;

                case '7':
                    text = 'You have been deleted from the contact list by ' + contact.full_name;
                    break;

                // calls
                case '8':
                    if (message.caller === myUser.contact.id) {
                        text = 'Call to ' + contacts[message.callee].full_name + ', duration ' + Helpers.getDuration(message.callDuration);
                    } else {
                        text = 'Call from ' + contacts[message.caller].full_name + ', duration ' + Helpers.getDuration(message.callDuration);
                    }
                    break;

                case '9':
                    if (message.caller === myUser.contact.id) {
                        text = 'Call to ' + contacts[message.callee].full_name + ', no answer';
                    } else {
                        text = 'Missed call from ' + contacts[message.caller].full_name;
                    }
                    break;

                case '10':
                    if (message.caller === myUser.contact.id) {
                        text = contacts[message.callee].full_name + ' doesn\'t have camera and/or microphone.';
                    } else {
                        text = 'Camera and/or microphone wasn\'t found.';
                    }
                    break;

                case '11':
                    text = 'Incomming ' + message.callType + ' Call from ' + contact.full_name;
                    break;

                case '12':
                    text = 'The ' + message.callType + ' Call accepted by ' + contact.full_name;
                    break;

                // messages
                default:
                    if (chatType === 'groupchat') {
                        text = contact.full_name + ': ' + message.body;
                    } else {
                        text = message.body;
                    }

                    break;
            }

            if (text) {
                text = text.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
                options = {
                    body: text,
                    icon: photo,
                    tag: message.dialog_id,
                    onClick: function() {
                        window.focus();
                        selectDialog.click();
                    },
                    timeout: QMCONFIG.notification.timeout,
                    closeOnClick: true
                };
            }

            return options;
        }
    };

    Helpers.Messages = {
        getOccupantsNames: function(occupants_ids, myUser, contacts) {
            var occupants_names = '',
                myContact = myUser.contact;

            for (var i = 0, len = occupants_ids.length, user; i < len; i++) {
                user = contacts[occupants_ids[i]] && contacts[occupants_ids[i]].full_name;
                if (user) {
                    occupants_names = (i + 1) === len ? occupants_names.concat(user) : occupants_names.concat(user).concat(', ');
                } else if (occupants_ids[i] === myContact.id) {
                    occupants_names = (i + 1) === len ? occupants_names.concat(myContact.full_name) : occupants_names.concat(myContact.full_name).concat(', ');
                }
            }

            return occupants_names;
        },

        parser: function(str) {
            var url, url_text;
            var URL_REGEXP = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;

            str = escapeHTML(str);

            // parser of paragraphs
            str = str.replace(/\n/g, '<br>');

            // parser of links
            str = str.replace(URL_REGEXP, function(match) {
                url = (/^[a-z]+:/i).test(match) ? match : 'http://' + match;
                url_text = match;
                return '<a href="' + escapeHTML(url) + '" target="_blank">' + escapeHTML(url_text) + '</a>';
            });

            return str;

            function escapeHTML(s) {
                return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }
        }
    };

    Helpers.Dialogs = {
        moveDialogToTop: function(dialogId) {
            var dialogItem = $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="' + dialogId + '"]');

            if (dialogItem.length > 0) {
                copyDialogItem = dialogItem.clone();
                dialogItem.remove();
                $('.j-recentList').prepend(copyDialogItem);
                if (!$('#searchList').is(':visible')) {
                    $('#recentList').removeClass('is-hidden');
                    this.isSectionEmpty($('#recentList ul.j-list'));
                }
            }
        },

        isSectionEmpty: function(list) {
            if (list.contents().length === 0) {
                list.parent().addClass('is-hidden');
            }

            if ($('#historyList ul.j-list').contents().length === 0) {
                $('#historyList ul.j-list').parent().addClass('is-hidden');
            }

            if ($('#requestsList').is('.is-hidden') &&
                $('#recentList').is('.is-hidden') &&
                $('#historyList').is('.is-hidden')) {


                $('#emptyList').removeClass('is-hidden');
            }
        },

        setScrollToNewMessages: function() {
            var $chat = $('.j-chatItem .j-scrollbar_message');

            if ($('.j-newMessages').length) {
                $chat.mCustomScrollbar('scrollTo', '.j-newMessages');
            }
        }
    };

    // smart console
    Helpers.log = function() {
        if (QMCONFIG.debug) {
            if (arguments.length <= 1) {
                console.group("[Q-MUNICATE debug mode]:");
                console.log(arguments[0]);
                console.groupEnd();
            } else {
                console.group("[Q-MUNICATE debug mode]:");
                for (var i = 0; i < arguments.length; i++) {
                    if ((typeof arguments[i] === "string") && (typeof arguments[i + 1] !== "string")) {
                        console.log(arguments[i], arguments[i + 1]);
                        i = i + 1;
                    } else {
                        console.log(arguments[i]);
                    }
                }
                console.groupEnd();
            }
        }
    };

    Helpers.isBeginOfChat = function() {
        if (!document.querySelector('.j-chatItem')) {
            return null;
        }

        var viewPort = document.querySelector('.j-scrollbar_message'),
            msgList = document.querySelector('.j-scrollbar_message .mCSB_container'),
            viewPortBottom = viewPort.clientHeight,
            msgListPosition = msgList.offsetTop,
            msgListHeight = msgList.clientHeight,
            msgListBottom = msgListPosition + msgListHeight,
            bottom = true;

        if (msgListPosition < 0) {
            bottom = false;

            if ((viewPortBottom + 350) > msgListBottom) {
                bottom = true;
            }
        }

        return bottom;
    };

    Helpers.getDuration = function(seconds, duration) {
        if (duration) {
            return Date.parse('Thu, 01 Jan 1970 ' + duration + ' GMT') / 1000;
        } else {
            return new Date(seconds*1000).toUTCString().split(/ /)[4];
        }
    };

    Helpers.getTime = function(time, isDate) {
        var messageDate = new Date(time * 1000),
            startOfCurrentDay = new Date();

        startOfCurrentDay.setHours(0, 0, 0, 0);

        if (messageDate > startOfCurrentDay) {
            return messageDate.getHours() + ':' + (messageDate.getMinutes().toString().length === 1 ? '0' + messageDate.getMinutes() : messageDate.getMinutes());
        } else if ((messageDate.getFullYear() === startOfCurrentDay.getFullYear()) && !isDate) {
            return $.timeago(messageDate);
        } else {
            return messageDate.getDate() + '/' + (messageDate.getMonth() + 1) + '/' + messageDate.getFullYear();
        }
    };

    Helpers.scaleAvatar = function($pic) {
        var $chat = $pic.parents('.l-chat'),
            name = $pic.data('name'),
            url = $pic.css('background-image').replace(/.*\s?url\([\'\"]?/, '')
                .replace(/[\'\"]?\).*/, ''), // take URL from css background source
            $popup = $('.j-popupAvatar'),
            dialog_id;

        if ($chat.is('.is-group')) {
            dialog_id = $chat.data('dialog');
            $popup.find('.j-changePic').removeClass('is-hidden')
                .data('dialog', dialog_id);
        } else {
            $popup.find('.j-changePic').addClass('is-hidden');
        }

        $popup.find('.j-avatarPic').attr('src', url);
        $popup.find('.j-avatarName').text(name);
        $popup.add('.popups').addClass('is-overlay');
    };

    Helpers.getOpenGraphInfo = function(params, callback) {
        var ajaxCall = {
            url: 'https://ogs.quickblox.com/?url=' + params.url + '&token=' + params.token,
            error: function(jqHXR, status, error) {
                callback(error, null);
            },
            success: function(data, status, jqHXR) {
                callback(null, data);
            }
        };

        $.ajax(ajaxCall);
    };

    Helpers.isValidUrl = function(url) {
        var validator = /^(?:([a-z]+):(?:([a-z]*):)?\/\/)?(?:([^:@]*)(?::([^:@]*))?@)?((?:[a-z0-9_-]+\.)+[a-z]{2,}|localhost|(?:(?:[01]?\d\d?|2[0-4]\d|25[0-5])\.){3}(?:(?:[01]?\d\d?|2[0-4]\d|25[0-5])))(?::(\d+))?(?:([^:\?\#]+))?(?:\?([^\#]+))?(?:\#([^\s]+))?$/i;
        return validator.test(url);
    };

    Helpers.isImageUrl = function(url) {
        return /.svg|.png|.jpg|.jpeg|.gif/i.test(url);
    };

    return Helpers;
});
