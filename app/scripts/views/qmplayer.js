/**
 * QMPlayer
 */
define([
    'underscore',
    'backbone'
], function(
    _,
    Backbone
) {
    'use strict';

    var QMPlayer = {};

    QMPlayer.Model = Backbone.Model.extend({
        defaults: {
            id: '',
            name: '',
            source: ''
        },

        initialize: function() {
            this.buildView();
        },

        buildView: function() {
            new QMPlayer.View({model: this});
        }
    });

    QMPlayer.View = Backbone.View.extend({
        tagName: 'div',
        className: 'qm_audio_player',
        template: _.template(document.querySelector('#QMPlayer').innerHTML),

        initialize: function() {
            var id = this.model.get('id');

            this.render(id);
            this.start(id);
        },

        render: function(id) {
            var qmplayerTpl = this.template(this.model.toJSON()),
                qmplayerEl = this.el.innerHTML = qmplayerTpl;

            document.querySelector('#audio_player_' + id).innerHTML = qmplayerEl;
        },

        start: function(id) {
            new QMPlayer.init(id);
        }
    });

    QMPlayer.init = function(id) {
        var audioEl = document.querySelector('#audio_' + id),
            controlEl = document.querySelector('#qm_player_control_' + id),
            fillerEl = document.querySelector('#qm_player_filler_' + id),
            setterEl = document.querySelector('#qm_player_setter_' + id),
            progressEl = document.querySelector('#qm_player_progress_' + id),
            timeEl = document.querySelector('#qm_player_time_' + id),
            fullLength = document.querySelector('#qm_player_wrap_' + id).offsetWidth;

        var setTime = function(time) {
            var min,
                sec;

            min = Math.floor(time / 60);
            min = min >= 10 ? min : '0' + min;
            sec = Math.floor(time % 60);
            sec = sec >= 10 ? sec : '0' + sec;

            timeEl.innerHTML = ( min + ':' + sec );
        };

        setterEl.onclick = function(e) {
            audioEl.currentTime = audioEl.duration * (e.offsetX / fullLength);
        };

        controlEl.onclick = function() {
            if (this.classList.contains('is-paused')) {
                audioEl.play();
                fillerEl.classList.add('is-actived');
                controlEl.classList.add('is-playing');
                controlEl.classList.remove('is-paused');
            } else {
                audioEl.pause();
            }
        };

        audioEl.onended = function() {
            audioEl.pause();
        };

        audioEl.onpause = function() {
            controlEl.classList.add('is-paused');
            controlEl.classList.remove('is-playing');
        };

        audioEl.oncanplay = function() {
            setTime(audioEl.duration);
        };

        audioEl.ontimeupdate = function() {
            var time = audioEl.currentTime,
                length = Math.round(fullLength * (audioEl.currentTime / audioEl.duration));

            setTime(time);

            progressEl.style.width = length + 'px';
        };
    };

    return QMPlayer;
});

