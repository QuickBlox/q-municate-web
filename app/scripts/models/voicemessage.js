/**
 * AudioRecorder
 */
define(['Helpers'], function(Helpers) {
    'use strict';

    var self;

    function VoiceMessage(app) {
        this.app = app;

        self = this;
        self.active = false;
        self.stream = null;
        self.timerID = undefined;
        self.chatEl = undefined;
        self.timerEl = undefined;
        self.controlEl = undefined;

        self.init();
    }

    VoiceMessage.prototype = {
        init: function() {
            if (qbMediaRecorder.isAvailable()) {
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

                    // TODO: for testing
                    self.useBlob(blob);
                    self.recorder.download('Audio record - ' + new Date().toString());
                },
                mimeType: 'audio',
                ignoreMutedMedia: true
            };

            self.chatEl = document.querySelector('.j-workspace-wrap');
            self.timerEl = document.querySelector('.j-time_record');
            self.controlEl = document.querySelector('.j-start_record');

            self.recorder = new qbMediaRecorder(options);
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
                audio: true,
                video: false
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
            var time = 0,
                min,
                sec;

            self.timerID = setInterval(function() {
                self.timerEl.innerHTML = timerValue();
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
            self.chatEl.addEventListener('click', function(event) {
                var targetEl = event.target;

                if (targetEl === self.controlEl) {
                    var elemClassList = targetEl.classList;

                    if (elemClassList.contains('is-active')) {
                        elemClassList.remove('is-active');
                        self.stopRecord();
                        self.timerEl.innerHTML = 'RECORD';
                    } else {
                        elemClassList.add('is-active');
                        self.startRecord();
                        self.timerEl.innerHTML = '00:00';
                    }
                }

                return false;
            });
        },

        startRecord: function() {
            self._startStream(function() {
                self.recorder.start(self.stream);
            });
        },

        stopRecord: function() {
            self.recorder.stop();
            self._stopStream();
            self.stream = null;
        },

        useBlob: function(blob) {
            console.info(blob);
        }
    };

    return VoiceMessage;
});