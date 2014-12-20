/*
 * Q-municate chat application
 *
 * VideoChat View Module
 *
 */

define(['jquery', 'quickblox'], function($, QB) {

  var self;
  var User, ContactList, VideoChat;

  function VideoChatView(app) {
    this.app = app;

    self = this;
    User = this.app.models.User;
    ContactList = this.app.models.ContactList;
    VideoChat = this.app.models.VideoChat;
  }

  VideoChatView.prototype.cancelCurrentCalls = function() {
    if ($('.mediacall').length > 0)
      $('.mediacall').find('.btn_hangup').click();
  };

  VideoChatView.prototype.init = function() {
    var DialogView = this.app.views.Dialog;

    $('body').on('click', '.videoCall, .audioCall', function(event) {
      event.preventDefault();
      var className = $(this).attr('class');
      self.cancelCurrentCalls();
      self.startCall(className);
    });

    $('#popupIncoming').on('click', '.btn_decline', function(event) {
      event.preventDefault();
      var incomingCall = $(this).parents('.incoming-call'),
          opponentId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          sessionId = $(this).data('session'),
          audioSignal = $('#ringtoneSignal')[0];

      QB.webrtc.reject(opponentId, {
        sessionID: sessionId,
        dialog_id: dialogId
      });

      incomingCall.remove();
      if ($('#popupIncoming').children().length === 0) {
        closePopup();
        audioSignal.pause();
      }
    });

    $('#popupIncoming').on('click', '.btn_accept', function(event) {
      event.preventDefault();
      self.cancelCurrentCalls();

      var id = $(this).data('id'),
          dialogItem = $('.dialog-item[data-id="'+id+'"]').find('.contact');
      
      DialogView.htmlBuild(dialogItem);

      var incomingCall = $(this).parents('.incoming-call'),
          opponentId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          sessionId = $(this).data('session'),
          callType = $(this).data('calltype'),
          sdp = incomingCall.data('sdp'),
          audioSignal = $('#ringtoneSignal')[0],
          params = self.build(dialogId);

      $(this).parents('.incoming-call').remove();
      $('#popupIncoming').children().each(function() {
        $(this).find('.btn_decline').click();
      });
      closePopup();
      audioSignal.pause();

      params.isCallee = true;
      params.sessionId = sessionId;
      params.sdp = sdp;

      VideoChat.getUserMedia(params, callType, function() {
        if (callType === 2) {
          self.type = 'audio';
          $('.btn_camera_off').click();
        } else {
          self.type = 'video';
          self.unmute('video');
        }
      });
    });

    $('body').on('click', '.btn_hangup', function(event) {
      event.preventDefault();
      var chat = $(this).parents('.l-chat'),
          opponentId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          callingSignal = $('#callingSignal')[0],
          endCallSignal = $('#endCallSignal')[0];

      callingSignal.pause();
      endCallSignal.play();
      QB.webrtc.stop(opponentId, 'manually', {
        dialog_id: dialogId
      });
      if (QB.webrtc.localStream) {
        QB.webrtc.hangup();
      }

      chat.find('.mediacall').remove();
      chat.find('.l-chat-header').show();
      chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
    });

    $('body').on('click', '.btn_camera_off, .btn_mic_off', function(event) {
      event.preventDefault();
      var obj = $(this),
          opponentId = obj.data('id'),
          dialogId = obj.data('dialog'),
          deviceType = !!$(this).attr('class').match(/btn_camera_off/) ? 'video' : 'audio';
      
      if (obj.is('.off')) {
        self.unmute(deviceType);
        if (deviceType === 'video')
          QB.webrtc.changeCall(opponentId, {
            dialog_id: dialogId,
            unmute: deviceType
          });
        obj.removeClass('off');
      } else {
        self.mute(deviceType);
        if (deviceType === 'video')
          QB.webrtc.changeCall(opponentId, {
            dialog_id: dialogId,
            mute: deviceType
          });
        obj.addClass('off');
      }
    });
  };

  VideoChatView.prototype.onCall = function(id, extension) {
    var audioSignal = $('#ringtoneSignal')[0],
        incomings = $('#popupIncoming'),
        html;

    html = '<div class="incoming-call l-flexbox l-flexbox_column l-flexbox_flexbetween" data-sdp="'+extension.sdp+'">';
    html += '<div class="incoming-call-info l-flexbox l-flexbox_column">';
    // html += '<img class="info-avatar" src="'+extension.avatar+'" alt="avatar">';
    html += '<div class="message-avatar avatar contact-avatar_message info-avatar" style="background-image:url('+extension.avatar+')"></div>';
    html += '<span class="info-notice">'+(extension.callType === '2' ? 'Audio' : 'Video')+' Call from '+extension.full_name+'</span>';
    html += '</div>';
    html += '<div class="incoming-call-controls l-flexbox l-flexbox_flexcenter">';
    html += '<button class="btn_decline" data-session="'+extension.sessionID+'" data-dialog="'+extension.dialog_id+'" data-id="'+id+'">Decline</button>';
    html += '<button class="btn_accept" data-callType="'+extension.callType+'" data-session="'+extension.sessionID+'" data-dialog="'+extension.dialog_id+'" data-id="'+id+'">Accept</button>';
    html += '</div></div>';

    incomings.prepend(html);
    openPopup(incomings);
    audioSignal.play();
  };

  VideoChatView.prototype.onAccept = function(id, extension) {
    var audioSignal = $('#callingSignal')[0],
        chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');

    audioSignal.pause();
  };

  VideoChatView.prototype.onRemoteStream = function(stream) {
    var video = document.getElementById('remoteStream');

    // console.log(stream);
    QB.webrtc.attachMediaStream('remoteStream', stream);
    
    video.addEventListener('timeupdate', function() {
      var duration = getDuration(video.currentTime);
      $('.mediacall-info-duration, .mediacall-remote-duration').text(duration);
    });

    if (self.type === 'video') {
      $('#remoteUser').addClass('is-hidden');
      $('#remoteStream').removeClass('is-hidden');
      $('.mediacall-info-duration').removeClass('is-hidden');
      $('.mediacall-remote-duration').addClass('is-hidden');
    } else {
      $('#remoteStream').addClass('is-hidden');
      $('#remoteUser').removeClass('is-hidden');
      $('.mediacall-remote-duration').removeClass('is-hidden');
      $('.mediacall-info-duration').addClass('is-hidden');
    }
  };

  VideoChatView.prototype.onReject = function(id, extension) {
    var audioSignal = $('#callingSignal')[0],
        chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');

    QB.webrtc.hangup();
    audioSignal.pause();

    chat.find('.mediacall').remove();
    chat.find('.l-chat-header').show();
    chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
  };

  VideoChatView.prototype.onStop = function(id, extension) {
    var chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]'),
        declineButton = $('.btn_decline[data-dialog="'+extension.dialog_id+'"]'),
        endCallSignal = $('#endCallSignal')[0],
        ringtoneSignal = $('#ringtoneSignal')[0],
        incomingCall;

    if (chat[0] && chat.find('.mediacall')[0]) {
      endCallSignal.play();
      QB.webrtc.hangup();

      chat.find('.mediacall').remove();
      chat.find('.l-chat-header').show();
      chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
    } else if (declineButton[0]) {
        incomingCall = declineButton.parents('.incoming-call');
        incomingCall.remove();

        if ($('#popupIncoming').children().length === 0) {
          closePopup();
          ringtoneSignal.pause();
        }
    }
  };

  VideoChatView.prototype.onChangeCall = function(id, extension) {
    var chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');
    if (chat[0] && chat.find('.mediacall')[0]) {
      if (extension.mute === 'video') {
        $('#remoteStream').addClass('is-hidden');
        $('#remoteUser').removeClass('is-hidden');
        $('.mediacall-remote-duration').removeClass('is-hidden');
        $('.mediacall-info-duration').addClass('is-hidden');
      }
      if (extension.unmute === 'video') {
        $('#remoteStream').removeClass('is-hidden');
        $('#remoteUser').addClass('is-hidden');
        $('.mediacall-info-duration').removeClass('is-hidden');
        $('.mediacall-remote-duration').addClass('is-hidden');
      }
    }
  };

  VideoChatView.prototype.startCall = function(className) {
    var audioSignal = $('#callingSignal')[0],
        params = self.build();

    VideoChat.getUserMedia(params, className, function() {
      audioSignal.play();
      if (!!className.match(/audioCall/)) {
        self.type = 'audio';
        $('.btn_camera_off').click();
      } else {
        self.type = 'video';
        self.unmute('video');
      }
    });
  };

  VideoChatView.prototype.build = function(id) {
    var chat = id ? $('.l-chat[data-dialog="'+id+'"]') : $('.l-chat:visible'),
        userId = chat.data('id'),
        dialogId = chat.data('dialog'),
        contact = ContactList.contacts[userId],
        maxHeight = screen.height > 768 ? '420px' : '550px',
        html;

    html = '<div class="mediacall l-flexbox" style="max-height:'+maxHeight+'">';
    html += '<video id="remoteStream" class="mediacall-remote-stream is-hidden"></video>';
    html += '<video id="localStream" class="mediacall-local mediacall-local-stream is-hidden"></video>';
    html += '<img id="localUser" class="mediacall-local mediacall-local-avatar" src="'+User.contact.avatar_url+'" alt="avatar">';
    html += '<div id="remoteUser" class="mediacall-remote-user l-flexbox l-flexbox_column">';
    html += '<img class="mediacall-remote-avatar" src="'+contact.avatar_url+'" alt="avatar">';
    html += '<span class="mediacall-remote-name">'+contact.full_name+'</span>';
    html += '<span class="mediacall-remote-duration">connecting...</span>';
    html += '</div>';
    html += '<div class="mediacall-info l-flexbox l-flexbox_column l-flexbox_flexcenter">';
    html += '<img class="mediacall-info-logo" src="images/logo-qmunicate-transparent.png" alt="Q-municate">';
    html += '<span class="mediacall-info-duration is-hidden"></span>';
    html += '</div>';
    html += '<div class="mediacall-controls l-flexbox l-flexbox_flexcenter">';
    html += '<button class="btn_mediacall btn_camera_off" data-id="'+userId+'" data-dialog="'+dialogId+'"><img class="btn-icon_mediacall" src="images/icon-camera-off.png" alt="camera"></button>';
    html += '<button class="btn_mediacall btn_mic_off" data-id="'+userId+'" data-dialog="'+dialogId+'"><img class="btn-icon_mediacall" src="images/icon-mic-off.png" alt="mic"></button>';
    html += '<button class="btn_mediacall btn_hangup" data-id="'+userId+'" data-dialog="'+dialogId+'"><img class="btn-icon_mediacall" src="images/icon-hangup.png" alt="hangup"></button>';
    html += '</div></div>';

    chat.prepend(html);
    chat.find('.l-chat-header').hide();
    chat.find('.l-chat-content').css({height: 'calc(100% - '+maxHeight+' - 90px)'});
    if (screen.height > 768) {
      chat.find('.mediacall-remote-user').css({position: 'absolute', top: '16%', left: '10%', margin: 0});
    }    

    return {
      opponentId: userId,
      dialogId: dialogId
    };
  };

  VideoChatView.prototype.mute = function(callType) {
    QB.webrtc.mute(callType);
    if (callType === 'video') {
      $('#localStream').addClass('is-hidden');
      $('#localUser').removeClass('is-hidden');
    }
  };

  VideoChatView.prototype.unmute = function(callType) {
    QB.webrtc.unmute(callType);
    if (callType === 'video') {
      $('#localStream').removeClass('is-hidden');
      $('#localUser').addClass('is-hidden');      
    }
  };

  return VideoChatView;
});

/* Private
-------------------------------------------------------------*/
function openPopup(objDom) {
  objDom.add('.popups').addClass('is-overlay');
}

function closePopup() {
  $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
  $('.temp-box').remove();
  if ($('.attach-video video')[0]) $('.attach-video video')[0].pause();
}

function getDuration(currentTime) {
  var time = Math.floor(currentTime),
      h, min, sec;

  h = Math.floor( time / 3600 );
  h = h >= 10 ? h : '0' + h;
  min = Math.floor( time / 60 );
  min = min >= 10 ? min : '0' + min;
  sec = Math.floor( time % 60 );
  sec = sec >= 10 ? sec : '0' + sec;

  return h + ':' + min + ':' + sec;
}
