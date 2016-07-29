/*
 *
 * Q-MUNICATE sync tabs models Module
 *
 */
define(['jquery'], function($) {
    'use strict';

    function SyncTabs(app) {
        var self = this,
            curTab = 1,
            currentUserId,
            countTabs,
            mainTab,
            closedTab,
            logOutAll,
            readBadge;

        this.app = app;

        this.init = function(userId) {
            currentUserId = userId;

            // set params to local storage
            _set();

            // enter to new page (listener)
            $(window).focus(function() {
                localStorage.setItem(mainTab, curTab);
            });

            // is closed page (listener)
            $(window).unload(function() {
                localStorage.setItem(closedTab, curTab); // informed about closed tab

                // remove all info about sync tabs if current tab was the last one
                if (+localStorage[countTabs] === 1) {
                    localStorage.removeItem(countTabs);
                    localStorage.removeItem(mainTab);
                    localStorage.removeItem(closedTab);
                }
            });

            // localStorage listener
            $(window).bind('storage', function(e) {
                _sync(e);
            });
        };

        this.get = function() {
            return (localStorage[mainTab] == curTab) ? true : false;
        };

        function _set() {
            countTabs = 'QM.' + currentUserId + '_countTabs',
            mainTab   = 'QM.' + currentUserId + '_mainTab',
            closedTab = 'QM.' + currentUserId + '_closedTab',
            logOutAll = 'QM.' + currentUserId + '_logOut';
            readBadge = 'QM.' + currentUserId + '_readBadge';

            if (localStorage[mainTab] && localStorage[countTabs]) {
                curTab = +localStorage[countTabs] + 1;   // set new order for current tab
                localStorage.setItem(countTabs, curTab); // set the number of existing tabs
                localStorage.setItem(mainTab, curTab);   // set the last active tab
            } else {
                localStorage.setItem(countTabs, curTab); // set the number of existing tabs
                localStorage.setItem(mainTab, curTab);   // set this tab as active
            }
        }

        function _sync(e) {
            var key    = e.originalEvent.key,
                oldVal = e.originalEvent.oldValue,
                newVal = e.originalEvent.newValue;

            // fire if has closed tab
            if (key === closedTab) {
                if (+localStorage[countTabs] === curTab) {
                    curTab = +newVal; // set new number for last tab if the number of tabs was changed
                    localStorage.setItem(countTabs, (+localStorage[countTabs] - 1)); // set the number of existing tabs

                    if (localStorage[countTabs] < localStorage[mainTab]) {
                        localStorage.setItem(mainTab, curTab);
                    }
                }
            }

            // fire if user's settings was changed
            if (key === ('QM.settings-' + currentUserId)) {
                self.app.views.Settings.setUp(currentUserId);
            }

            // fire if user log out from QM
            if (key === logOutAll) {
                localStorage.removeItem(countTabs);
                localStorage.removeItem(mainTab);
                localStorage.removeItem(closedTab);
                localStorage.removeItem(logOutAll);
                localStorage.removeItem(readBadge);

                window.location.reload();
            }

            // remove unread message count for opened chat in other tab
            if (key === readBadge && newVal !== null) {
                $('.dialog-item[data-dialog="' + newVal + '"]').find('.unread').text('');
                self.app.views.Dialog.decUnreadCounter(newVal);
            }
        }

    }

    return SyncTabs;
});
