/**
 * AudioRecorder
 */
define([
    'config',
    'Helpers',
    'lamejs',
    'QBMediaRecorder'
], function(
    QMCONFIG,
    Helpers,
    lamejs,
    QBMediaRecorder
) {
    'use strict';

    var self;

    function VoiceMessage(app) {
        this.app = app;

        self = this;
        self.active = false;
        self.supported = false;
        self.blob = null;
        self.stream = null;
        self.timerID = undefined;

        self.ui = {
            chat: undefined,
            title: undefined,
            control: undefined,
            cancel: undefined,
            progress: undefined
        };

        self.init();
    }

    VoiceMessage.prototype = {
        init: function() {
            if (QBMediaRecorder.isAvailable()) {
                self._initRecorder();
                self.supported = true;
            } else {
                self.supported = false;
            }
        },

        _initRecorder: function() {
            var options = {
                onstart: function onStart() {
                    self._startTimer();
                },
                onstop: function onStop(blob) {
                    self._stopTimer();
                    self.blob = blob;
                },
                mimeType: 'audio/mp3'
            };

            self.ui.chat = document.querySelector('.j-workspace-wrap');
            self.ui.title = document.querySelector('.j-record_title');
            self.ui.control = document.querySelector('.j-start_record');
            self.ui.cancel = document.querySelector('.j-cancel_record');
            self.ui.progress = document.querySelector('.j-record_progress');
            self.recorder = new QBMediaRecorder(options);
            self._initHandler();

            Helpers.log('Recorder\'s ready to use');
        },

        blockRecorder: function() {
            var recorder = document.querySelector('.j-btn_audio_record');

            if ( recorder ) {
                recorder.classList.remove('is-active');
                recorder.disabled = true;
                recorder.style.opacity = 0.4;
            }

            Helpers.log('Recorder isn\'t supported is this browser');
        },

        _startStream: function (callback) {
            navigator.mediaDevices.getUserMedia({
                audio: true
            }).then(function(stream) {
                self.stream = stream;
                callback();
            }).catch(function(err) {
                self.blockRecorder();
                self.resetRecord();
                console.error(err);
            });
        },

        _stopStream: function () {
            if (!self.stream) {
                return;
            }

            self.stream.getTracks().forEach(function(track) {
                track.stop();
            });
        },

        _startTimer: function() {
            var step = 0,
                time = 0,
                min,
                sec;

            self.timerID = setInterval(function() {
                ++step;

                self.ui.title.innerHTML = timerValue();

                if (step === QMCONFIG.MAX_RECORD_TIME) {
                    self.ui.control.click();
                }
            }, 1000);

            function timerValue() {
                ++time;

                min = Math.floor(time / 60);
                min = min >= 10 ? min : '0' + min;
                sec = Math.floor(time % 60);
                sec = sec >= 10 ? sec : '0' + sec;

                return min + ':' + sec;
            }
        },

        _stopTimer: function() {
            clearInterval(self.timerID);
            self.timerID = undefined;
        },

        _initHandler: function () {
            self.ui.chat.addEventListener('click', function(event) {
                var target = event.target,
                    controlElClassList = self.ui.control.classList,
                    progressElClassList = self.ui.progress.classList,
                    cancelElClassList = self.ui.cancel.classList,
                    titleElClassList = self.ui.title.classList;

                if ( target === self.ui.control ) {
                    if ( controlElClassList.contains('is-active') ) {
                        self.stopRecord();
                        controlElClassList.remove('is-active');
                        progressElClassList.remove('is-active');
                        titleElClassList.add('is-ready-to-send');
                        self.ui.title.innerHTML = 'SEND';
                        self.ui.send = self.ui.title;
                    } else {
                        self.startRecord();
                        controlElClassList.add('is-active');
                        progressElClassList.add('is-active');
                        cancelElClassList.add('is-active');
                        self.ui.title.innerHTML = '00:00';
                    }
                }

                if ( target === self.ui.cancel ) {
                    self.cancelRecord();
                    controlElClassList.remove('is-active');
                    progressElClassList.remove('is-active');
                    cancelElClassList.remove('is-active');
                    titleElClassList.remove('is-ready-to-send');
                    self.ui.title.innerHTML = 'RECORD';
                }

                if (target === self.ui.title) {
                    if ( titleElClassList.contains('is-ready-to-send') && self.blob ) {
                        self.sendRecord();
                        self.resetRecord();
                    } else {
                        self.ui.control.click();
                    }
                }

                return false;
            });
        },

        _toggleActiveState: function(bool) {
            var buttons = document.querySelectorAll('.j-footer_btn'),
                textarea = document.querySelector('.textarea'),
                selectable = !bool,
                opacityLevel = bool ? 0.4 : 1;

            self.active = bool;

            textarea.setAttribute('contenteditable', selectable);
            buttons.forEach(function(elem) {
                elem.disabled = bool;
                elem.style.opacity = opacityLevel;
            });
        },

        resetRecord: function() {
            document.querySelector('.j-popover_record').classList.remove('is-active');
            document.querySelector('.j-btn_audio_record').classList.remove('is-active');

            self.cancelRecord();
            self.ui.control.classList.remove('is-active');
            self.ui.progress.classList.remove('is-active');
            self.ui.cancel.classList.remove('is-active');
            self.ui.title.classList.remove('is-ready-to-send');
            self.ui.title.innerHTML = 'RECORD';
            self._toggleActiveState(false);
        },

        startRecord: function() {
            self.blob = null;
            self._startStream(function() {
                self.recorder.start(self.stream);
                self._toggleActiveState(true);
            });
        },

        stopRecord: function() {
            self.recorder.stop();
            self._stopStream();
            self.stream = null;
        },

        cancelRecord: function() {
            if (self.stream) {
                self.stopRecord();
            }
            self.blob = null;
            self._toggleActiveState(false);
        },

        sendRecord: function() {
            if (!self.blob) {
                return;
            }

            var recordedAudioFile = new File([self.blob], 'Voicemessage', {
                type: self.blob.type,
                lastModified: Date.now()
            });

            self.app.views.Attach.changeInput(null, recordedAudioFile);
            self.blob = null;
            self._toggleActiveState(false);
        }
    };

    return VoiceMessage;
});