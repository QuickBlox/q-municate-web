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
                self.supported = true;
                self._initRecorder();
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

            Helpers.log('Recorder is ready to use');
        },

        blockRecorder: function(message) {
            var recorders = document.querySelectorAll('.j-btn_audio_record'),
                error = message ? (' ' + message) : '(microphone wasn\'t found)';

            if (recorders.length) {
                recorders.forEach(function(recorder) {
                    recorder.disabled = true;
                    recorder.classList.remove('is-active');
                    recorder.classList.add('is-unavailable');
                    recorder.setAttribute('data-balloon-length', 'medium');
                    recorder.setAttribute('data-balloon', 'Recorder unavailable' + error);
                });
            }

            if (message) {
                Helpers.log('Recorder unavailable' + error);
            } else {
                Helpers.log('Recorder isn\'t supported is this browser');
            }
        },

        _startStream: function (callback) {
            navigator.mediaDevices.getUserMedia({
                audio: true
            }).then(function(stream) {
                self.stream = stream;
                callback();
            }).catch(function(err) {
                self.resetRecord();
                self.blockRecorder();
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

            self.ui.progress.classList.add('is-active');

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
                    cancelElClassList = self.ui.cancel.classList;

                // recorder's controls
                if ( target === self.ui.control || target === self.ui.title ) {
                    // send recorded voicemessage as attachment
                    if ( controlElClassList.contains('is-send') && self.blob ) {
                        self.sendRecord();
                        self.resetRecord();
                    // stop recorder and prepare to sending
                    } else if ( controlElClassList.contains('is-active') ) {
                        self.stopRecord();

                        progressElClassList.remove('is-active');
                        controlElClassList.remove('is-active');
                        controlElClassList.add('is-send');
                        self.ui.title.innerHTML = 'SEND';

                        self.ui.send = self.ui.title;
                    // start recorder
                    } else {
                        self.startRecord();

                        controlElClassList.remove('is-send');
                        controlElClassList.add('is-active');
                        cancelElClassList.add('is-active');

                        self.ui.title.innerHTML = '00:00';
                    }
                }

                // cancel recording
                if ( target === self.ui.cancel ) {
                    self.cancelRecord();

                    controlElClassList.remove('is-active');
                    controlElClassList.remove('is-send');
                    progressElClassList.remove('is-active');
                    cancelElClassList.remove('is-active');

                    self.ui.title.innerHTML = 'RECORD';
                }

                return false;
            });
        },

        _toggleActiveState: function(bool) {
            var buttons = document.querySelectorAll('.j-footer_btn'),
                textarea = document.querySelector('.j-textarea'),
                contenteditable = !bool,
                opacityLevel = bool ? 0.4 : 1;

            // send recording state
            self.active = bool;
            // disable footer buttons
            textarea.setAttribute('contenteditable', contenteditable);
            buttons.forEach(function(elem) {
                elem.disabled = bool;
                elem.style.opacity = opacityLevel;
            });
        },

        resetRecord: function(dialogId) {
            var popover = document.querySelector('.j-popover_record'),
                button = document.querySelector('.j-btn_audio_record'),
                activeDialogId = self.app.entities.active;

            if ((dialogId && (dialogId !== activeDialogId)) || !button) {
                return false;
            }

            // close recorder's popover
            popover.classList.remove('is-active');
            button.classList.remove('is-active');
            button.classList.remove('is-unavailable');
            button.setAttribute('data-balloon', 'Record audio');
            button.removeAttribute('data-balloon-length');

            // reset recorder's elements to start position
            self.ui.control.classList.remove('is-send');
            self.ui.control.classList.remove('is-active');
            self.ui.progress.classList.remove('is-active');
            self.ui.cancel.classList.remove('is-active');
            self.ui.title.innerHTML = 'RECORD';

            // cancel recording and change state
            self.cancelRecord();
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

            // prepare file from blob object
            var recordedAudioFile = new File([self.blob], 'Voice message', {
                type: self.blob.type,
                lastModified: Date.now()
            });

            // send file as attachment
            self.app.views.Attach.changeInput(null, recordedAudioFile);

            self.blob = null;
            self._toggleActiveState(false);
        }
    };

    return VoiceMessage;
});