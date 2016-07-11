/*
 *
 * Q-MUNICATE custom cursor models Module
 *
 */
define([], function() {
    'use strict';

    function Cursor(app) {
        var self = this;

        this.setCursorAfterElement = function(el) {
            var range = document.createRange();

            range.setStartAfter(el);
            range.setEndAfter(el);

            setRange(range);
        };

        this.setCursorToEnd = function(el) {
            var isSelectionAndRangeAvaible = typeof window.getSelection !== 'undefined' &&
                                             typeof document.createRange !== 'undefined',
                isTextRangeAvaible = typeof document.body.createTextRange !== 'undefined';

            el.focus();

            if (isSelectionAndRangeAvaible) {
                var range = document.createRange();

                range.selectNodeContents(el);
                range.collapse(false);
                setRange(range);
            } else if (isTextRangeAvaible) {
                var textRange = document.body.createTextRange();

                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }
        };

        this.insertElement = function(element, newClassName) {
            if (window.getSelection) {
                var sel = window.getSelection();

                if (sel.getRangeAt && sel.rangeCount) {
                    var range = getRange();
                    var emoji = element.cloneNode(true);

                    emoji.classList.add(newClassName);
                    range.insertNode(emoji);
                    self.setCursorAfterElement(emoji);
                }
            }
        };

        function getRange() {
            var range;

            if (document.getSelection){
                var sel = document.getSelection();

                if (sel.rangeCount > 0) {
                    range = sel.getRangeAt(0);
                }
            } else {
                range = false;
            }

            return range;
        }

        function setRange(range) {
            if (document.getSelection) {
                var sel = window.getSelection();

                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }

    return Cursor;
});
