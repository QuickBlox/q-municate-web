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
        self.send = true;
        self.active = false;
        self.blob = null;
        self.stream = null;
        self.timerID = undefined;

        self.ui = {
            chat: undefined,
            title: undefined,
            control: undefined,
            cancel: undefined,
            progress: undefined,
            send: undefined
        };

        self.init();
    }

    VoiceMessage.prototype = {
        init: function() {
            if (QBMediaRecorder.isAvailable()) {
                self._initRecorder();
            } else {
                self._blockRecorder();
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
            self.ui.progress = document.querySelector('.record_progress');

            self.recorder = new QBMediaRecorder(options);
            self.active = true;

            self._initHandler();

            Helpers.log('Recorder\'s ready to use');
        },

        _blockRecorder: function() {
            self.active = false;
            Helpers.log('Recorder isn\'t supported is this browser');
        },

        _startStream: function () {
            navigator.mediaDevices.getUserMedia({
                audio: true
            }).then(function(stream) {
                self.stream = stream;
                self.recorder.start(self.stream);
            }).catch(function(err) {
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

                if (target === self.ui.control) {
                    if (controlElClassList.contains('is-active')) {
                        self.stopRecord();
                        controlElClassList.remove('is-active');
                        progressElClassList.remove('is-active');
                        titleElClassList.add('is-ready');
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

                if (target === self.ui.cancel) {
                    self.cancelRecord();
                    controlElClassList.remove('is-active');
                    progressElClassList.remove('is-active');
                    cancelElClassList.remove('is-active');
                    titleElClassList.remove('is-ready');
                    self.ui.title.innerHTML = 'RECORD';
                }

                if ( (target === self.ui.send) && self.blob ) {
                    self.sendRecord();
                    cancelElClassList.remove('is-active');
                    titleElClassList.remove('is-ready');
                    self.ui.title.innerHTML = 'RECORD';
                    self.ui.send = undefined;
                }

                return false;
            });
        },

        resetRecord: function() {
            self.cancelRecord();
            self.ui.control.classList.remove('is-active');
            self.ui.progress.classList.remove('is-active');
            self.ui.cancel.classList.remove('is-active');
            self.ui.title.classList.remove('is-ready');
            self.ui.title.innerHTML = 'RECORD';
        },

        startRecord: function() {
            self.blob = null;
            self._startStream();
        },

        stopRecord: function() {
            self.recorder.stop();
            self._stopStream();
            self.stream = null;
        },

        cancelRecord: function() {
            if (self.stream) {
                self._stopStream();
                self.stopRecord();
            }
            self.blob = null;
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
        }
    };

    return VoiceMessage;
});