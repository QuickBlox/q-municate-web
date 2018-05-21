/*
 * Q-municate chat application
 *
 * User View Module
 *
 */
define([
    'jquery',
    'config',
    'quickblox',
    'Entities',
    'Helpers',
    'QMHtml',
    'LocationView'
], function(
    $,
    QMCONFIG,
    QB,
    Entities,
    Helpers,
    QMHtml,
    Location
) {

    var User,
        ContactList,
        Contact,
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

        logInFirebase: function(callback) {
            if (typeof callback === 'function') {
                User.reLogInFirebasePhone(function(authParams) {
                    callback(authParams);
                });
            } else {
                new this.app.FirebaseWidget(User.logInFirebasePhone);
            }
        },

        logInFacebook: function() {
            User.logInFacebook();
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
            $('section:visible form').addClass('is-hidden').next('.l-spinner').removeClass('is-hidden');
        },

        removeSpinner: function() {
            $('section:visible form').removeClass('is-hidden').next('.l-spinner').addClass('is-hidden');
        },


        successFormCallback: function() {
            var $profileAvatar = $('#avatar-container');

            this.removeSpinner();
            $profileAvatar.addClass('profileUserAvatar').css('background-image', "url(" + User.contact.avatar_url + ")");
            $profileAvatar.attr('data-id', User.contact.id);
            $profileAvatar.attr('data-name', User.contact.full_name);
            switchPage($('#mainPage'));
            this.app.views.Dialog.createDataSpinner();
        },

        successSendEmailCallback: function() {
            var alert = '<div class="j-success_callback note l-form l-flexbox l-flexbox_column">';
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
                    Helpers.log('FB status response', response);
                    if (callback) {
                        // situation when you are recovering QB session via FB
                        // and FB accessToken has expired
                        if (response.status === 'connected') {
                            callback(response.authResponse.accessToken);
                        } else {
                            FB.login(function(response) {
                                Helpers.log('FB authResponse', response);
                                if (response.status === 'connected')
                                    callback(response.authResponse.accessToken);
                            });
                        }
                    }
                }, true);
            }
        },

        profilePopover: function(objDom) {
            var html = QMHtml.User.profilePopover();

            objDom.after(html);
            appearAnimation();
        },

        contactPopover: function(objDom) {
            var ids = objDom.parent().data('id'),
                dialog_id = objDom.parent().data('dialog'),
                roster = ContactList.roster,
                dialogs = Entities.Collections.dialogs,
                dialog = dialogs.get(dialog_id).toJSON(),
                htmlTpl;

            htmlTpl = QMHtml.User.contactPopover({
                'dialogId': dialog_id,
                'dialogType': dialog.type,
                'occupantsIds': dialog.occupants_ids,
                'ids': ids
            }, roster[ids]);

            objDom.after(htmlTpl)
                .parent().addClass('is-contextmenu');

            appearAnimation();

            var elemPosition = objDom.offset().top,
                list = document.querySelector('.j-scrollbar_aside'),
                topListOffset = list.offsetTop,
                listHeigth = list.offsetHeight,
                listViewPort = 0,
                botListOffset = listHeigth + topListOffset,
                dropList = objDom.next(),
                dropListElemCount = objDom.next().children().length,
                botElemPosition = botListOffset - elemPosition,
                elemPositionInList = elemPosition - topListOffset;

            $('.j-aside_list_item').each(function(index, element) {
                listViewPort += element.offsetHeight;
            });

            if ((botElemPosition <= dropListElemCount * 50) && (elemPositionInList > dropListElemCount * 40)) {
                dropList.addClass('margin-up');
            }

            if (listViewPort <= 400) {
                list.style.paddingBottom = (dropListElemCount * 40) + "px";
            }
        },

        occupantPopover: function(objDom, e) {
            var id = objDom.data('id'),
                jid = QB.chat.helpers.getUserJid(id, QMCONFIG.qbAccount.appId),
                roster = ContactList.roster,
                position = e.currentTarget.getBoundingClientRect(),
                htmlTpl = QMHtml.User.occupantPopover({
                    'id': id,
                    'jid': jid
                }, roster[id]);

            $('body').append(htmlTpl);

            appearAnimation();

            objDom.addClass('is-active');

            $('.list-actions_occupants').offset({
                top: (29 + position.top),
                left: position.left
            });
        },

        buildDetails: function(userId) {
            var popup = $('#popupDetails'),
                contact = ContactList.contacts[userId],
                roster = ContactList.roster,
                chatStatus = roster[userId] ? roster[userId] : null;

            if (!!navigator.userAgent.match(/Firefox/)) {
                popup.find('.userDetails-controls button').css('padding', '0 12px');
            }

            popup.find('.userDetails-avatar').attr('data-id', userId).css('background-image', 'url(' + contact.avatar_url + ')');
            popup.find('.userDetails-filename').attr('data-id', userId).text(contact.full_name);

            popup.find('.userDetails-status').attr('data-id', userId).text(contact.status);

            if (chatStatus && chatStatus.status) {
                popup.find('.userDetails-chatStatus').html('<span class="status status_online"></span><span class="status_text">Online</span>');
            } else {
                popup.find('.userDetails-chatStatus').html('<span class="status"></span><span class="status_text">Offline</span>');
            }

            popup.find('.writeMessage').data('id', userId);

            popup.find('.userDetails-field').attr('data-id', userId).html(
                contact.phone ?
                '<span class="userDetails-label">Phone:</span><span class="userDetails-phone">' + contact.phone + '</span>' :
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

                $('.profileUserName[data-id="' + contact.id + '"]').text(contact.full_name);
                $('.profileUserStatus[data-id="' + contact.id + '"]').text(contact.status);
                if (contact.phone) {
                    $('.profileUserPhone[data-id="' + contact.id + '"]').html(
                        '<span class="userDetails-label">Phone:</span><span class="userDetails-phone">' + contact.phone + '</span>'
                    );
                }
                $('.profileUserAvatar[data-id="' + contact.id + '"]').css('background-image', 'url(' + contact.avatar_url + ')');

                localStorage.setItem('QM.contact-' + contact.id, JSON.stringify(contact));
            });
        },

        logout: function() {
            var DialogView = this.app.views.Dialog;

            $('.mediacall .btn_hangup').click();

            User.logout(function() {
                switchOnWelcomePage();
                $('.j-capBox').removeClass('is-hidden');
                $('.j-chatWrap').addClass('is-hidden');
                $('.j-popover_const').removeClass('is-active');
                $('.l-chat').remove();
                Helpers.log('current User and Session were destroyed');
                DialogView.logoutWithClearData();
            });
        },

        localSearch: function(form) {
            var val = form.find('input[type="search"]').val().trim().toLowerCase(),
                selected = $('#searchList li.is-selected').data('dialog'),
                $notSearchLists = $('#recentList, #historyList, #requestsList');

            if (val.length > 0) {
                $('#searchList').removeClass('is-hidden').siblings('section').addClass('is-hidden');
                $('#searchList ul').html('').add('#searchList .note').removeClass('is-hidden');

                $('#recentList, #historyList, #oldHistoryList').find('.dialog-item').each(function() {
                    var name = $(this).find('.name').text().toLowerCase(),
                        li = $(this).clone();

                    if (name.indexOf(val) > -1) {
                        $('#searchList ul').append(li);
                        $('#searchList .note').addClass('is-hidden');
                    }

                });

                if ($('#searchList ul').find('li').length === 0) {
                    $('#searchList .note').removeClass('is-hidden').siblings('ul').addClass('is-hidden');
                }
            } else {

                $('#searchList').addClass('is-hidden');
                $notSearchLists.each(function() {
                    var $this = $(this);

                    if ($this.find('.list-item').length > 0) {
                        $this.removeClass('is-hidden');
                    }

                    if (selected) {
                        $this.find('.list-item[data-dialog="' + selected + '"]').addClass('is-selected');
                    }
                });
                if ($('.l-list-wrap section:not(#searchList) .list-item').length === 0) {
                    $('#emptyList').removeClass('is-hidden');
                }
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

                    if (name.indexOf(val) === -1) {
                        li.addClass('is-hidden');
                    }
                });

                if (result.find('ul li:visible').length === 0) {
                    result.find('.note').removeClass('is-hidden').siblings().addClass('is-hidden');
                }
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
            page.find('input:file').prev().find('.avatar').css('background-image', "url(" + QMCONFIG.defAvatar.url + ")").siblings('span').text(QMCONFIG.defAvatar.caption);
            page.find('input:checkbox').prop('checked', false);

            // start watch location if the option is enabled
            if (localStorage['QM.latitude'] && localStorage['QM.longitude']) {
                localStorage.removeItem('QM.latitude');
                localStorage.removeItem('QM.longitude');

                Location.toggleGeoCoordinatesToLocalStorage(true, function(res, err) {
                    Helpers.log('Location: ', err ? err : res);
                });
            }
        }
    };

    var switchOnWelcomePage = function() {
        $('body').addClass('is-welcome');
        $('#welcomePage').removeClass('is-hidden').siblings('section').addClass('is-hidden');
    };

    var appearAnimation = function() {
        $('.popover:not(.j-popover_const)').fadeIn(150);
    };

    return UserView;

});
