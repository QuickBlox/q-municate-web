/**
 * QMPlayer
 */
define([
    'underscore',
    'backbone',
    'config',
    'Helpers',
    'initTelInput',
    'intlTelInputUtils'
], function(
    _,
    Backbone,
    QMCONFIG,
    Helpers,
    initTelInput,
    intlTelInputUtils
) {
    'use strict';

    var widget;

    var FirebaseWidget = function(login) {
        FirebaseWidget.init();

        widget = this;
        widget.login = login;
        widget.container = $('#firebase');
        widget.resendTime = 30;
        widget._firebasePhoneNumberForm();
    };

    FirebaseWidget.init = function() {
        if (!FirebaseWidget.started) {
            FirebaseWidget.started = true;
            firebase.initializeApp(QMCONFIG.firebase);
        }
    };

    FirebaseWidget.prototype.sendSMS = function() {
        firebase.auth()
            .signInWithPhoneNumber(widget.myPhone, widget.recaptchaVerifier)
            .then(function(confirmationResult) {
                widget._firebaseDigitsNumberForm();
                widget.confirmationResult = confirmationResult;
            }).catch(function(error) {
                Helpers.log('Error:', error);
                if (error.message) alert(error.message);
                widget._firebasePhoneNumberForm();
            });
    };

    FirebaseWidget.prototype.confirmPhone = function(code) {
        widget.confirmationResult.confirm(code)
            .then(function(result) {
                widget._closeWidget();
                widget.login(result.user);
            }).catch(function (error) {
                Helpers.log('Error:', error);
                if (error.message) alert(error.message);
                widget._firebasePhoneNumberForm();
            });
    };

    FirebaseWidget.prototype.firebasePhoneNumberForm = Backbone.View.extend({
        tagName: 'form',
        className: 'firebase__form j-phone_number',
        template: _.template($('#firebasePhoneNumberForm').html()),

        events: {
            'submit': 'submitAction',
            'reset': 'cancelAction'
        },

        initialize: function() {
            this.render();
            this.addTelInput();
            this.addRecaptcha();
        },

        render: function() {
            this.$el.html(this.template());
            widget.phoneNumberForm = this.$el;
            widget.container.append(this.$el);
        },

        submitAction: function(event) {
            event.preventDefault();

            var $input = $('#firebase__phone_number_input');

            widget.myPhone = $input.intlTelInput('getNumber');

            if (widget.myPhone) {
                widget.sendSMS();
            } else {
                $input.addClass('error_highlight');

                setTimeout(function() {
                    $input.removeClass('error_highlight');
                }, 1000);
            }
        },

        cancelAction: function(event) {
            event.preventDefault();
            widget._closeWidget();
        },

        addTelInput: function() {
            var $input = $('#firebase__phone_number_input');

            $input.intlTelInput();
            $input.attr('autocomplete', 'on');
        },

        addRecaptcha: function() {
            widget.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('firebase__recaptcha_container', {
                'size': 'normal',
                'callback': function(response) {
                    $('.j-firebase__button_verify').attr('disabled', false);
                }
            });

            widget.recaptchaVerifier.render();
        }
    });

    FirebaseWidget.prototype.firebaseDigitsNumberForm = Backbone.View.extend({
        tagName: 'form',
        className: 'firebase__form j-digits_number',
        template: _.template($('#firebaseDigitsNumberForm').html()),

        events: {
            'submit': 'submitAction',
            'reset': 'cancelAction',
            'click .j-firebase__resend': 'resendCode',
        },


        initialize: function() {
            this.render();
        },

        render: function() {
            this.$el.html(this.template({phoneNumber: widget.myPhone}));
            widget.digitsNumberForm = this.$el;
            widget.container.append(this.$el);
            this.resendTimer(widget.resendTime);
        },

        submitAction: function(event) {
            event.preventDefault();
            widget.confirmPhone($('#firebase__code_input').val());
        },

        cancelAction: function(event) {
            event.preventDefault();
            widget._closeWidget();
        },

        resendCode: function(event) {
            event.preventDefault();
            widget._firebasePhoneNumberForm();
        },

        resendTimer: function(timeLeft) {
            var self = this,
                $text = $('.j-firebase__timer_text'),
                $timer = $('.j-firebase__resend_time'),
                $button = $('.j-firebase__resend');

            if (widget.resendTime === timeLeft) {
                $button.hide();
                $text.show();
            }

            if (timeLeft < 0) {
                $text.hide();
                $button.show();
            } else if (timeLeft < 10) {
                $timer.html('0' + timeLeft);
                next();
            } else {
                $timer.html(timeLeft);
                next();
            }

            function next() {
                setTimeout(function() {
                    self.resendTimer(--timeLeft);
                }, 1000);
            }
        }
    });

    FirebaseWidget.prototype._firebasePhoneNumberForm = function() {
        widget._cleanup();
        widget._show();
        new widget.firebasePhoneNumberForm();
    };

    FirebaseWidget.prototype._firebaseDigitsNumberForm = function() {
        widget.phoneNumberForm.hide();
        new widget.firebaseDigitsNumberForm();
    };

    FirebaseWidget.prototype._closeWidget = function() {
        widget._cleanup();
        widget._hide();
    };

    FirebaseWidget.prototype._show = function() {
        widget.container.css('visibility', 'visible');
    };

    FirebaseWidget.prototype._hide = function() {
        widget.container.css('visibility', 'hidden');
    };

    FirebaseWidget.prototype._cleanup = function() {
        if (widget.phoneNumberForm) {
            widget.phoneNumberForm.remove();
            widget.phoneNumberForm = null;
        }

        if (widget.digitsNumberForm) {
            widget.digitsNumberForm.remove();
            widget.digitsNumberForm = null;
        }

        widget.recaptchaVerifier = null;
        widget.recaptchaWidgetId = null;
        widget.confirmationResult = null;
    };

    return FirebaseWidget;
});