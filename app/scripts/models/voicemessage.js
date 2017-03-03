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
        self.stream = null;
        self.timerID = undefined;

        self.ui = {
            chat: undefined,
            timer: undefined,
            control: undefined,
            cancel: undefined
        };

        self._duration = {
            timeMarkStart: 0,
            timeMarkEnd: 0,

            start: function() {
                this.reset();
                this.timeMarkStart = performance.now();
            },
            end: function() {
                this.timeMarkEnd = performance.now();
            },
            get: function() {
                return Math.round( (this.timeMarkEnd - this.timeMarkStart) / 1000 );
            },
            reset: function() {
                this.timeMarkStart = 0;
                this.timeMarkEnd = 0;
            }
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
                    self._duration.start();
                    self._startTimer();
                },
                onstop: function onStop(blob) {
                    self._stopTimer();
                    self.sendRecord(blob);
                },
                mimeType: 'audio/mp3'
            };

            self.ui.chat = document.querySelector('.j-workspace-wrap');
            self.ui.timer = document.querySelector('.j-time_record');
            self.ui.control = document.querySelector('.j-start_record');
            self.ui.cancel = document.querySelector('.j-cancel_record');

            self.recorder = new QBMediaRecorder(options);
            self.active = true;

            self._initHandler();

            Helpers.log('Recorder\'s ready to use');
        },

        _blockRecorder: function() {
            self.active = false;
            Helpers.log('Recorder isn\'t supported is this browser');
        },

        _startStream: function (callback) {
            navigator.mediaDevices.getUserMedia({
                audio: true
            }).then(function(stream) {
                self.stream = stream;
                callback();
            }).catch(function(err) {
                console.error(err);
            });
        },

        _stopStream: function () {
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

                self.ui.timer.innerHTML = timerValue();

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
                    controlElClassList = self.ui.control.classList;

                if (target === self.ui.control) {
                    if (controlElClassList.contains('is-active')) {
                        controlElClassList.remove('is-active');
                        self.stopRecord();
                        self.ui.timer.innerHTML = 'RECORD';
                    } else {
                        controlElClassList.add('is-active');
                        self.startRecord();
                        self.ui.timer.innerHTML = '00:00';
                    }
                }

                if (target === self.ui.cancel) {
                    controlElClassList.remove('is-active');
                    self.cancelRecord();
                    self.ui.timer.innerHTML = 'RECORD';
                }

                return false;
            });
        },

        startRecord: function() {
            self.send = true;
            self._startStream(function() {
                self.recorder.start(self.stream);
            });
        },

        stopRecord: function() {
            self._duration.end();
            self.recorder.stop();
            self._stopStream();
            self.stream = null;
        },

        cancelRecord: function() {
            self._duration.reset();
            self.send = false;
            self.stopRecord();
        },

        sendRecord: function(blob) {
            if (!self.send) {
                self.send = true;
                return;
            }

            var recordedAudioFile = new File([blob], 'Voicemessage', {
                type: blob.type,
                lastModified: Date.now()
            });

            recordedAudioFile.duration = self._duration.get();

            self.app.views.Attach.changeInput(null, recordedAudioFile);
        }
    };

    return VoiceMessage;
});