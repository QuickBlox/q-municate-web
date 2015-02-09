/*
 * Q-municate chat application
 *
 * VideoChat View Module
 *
 */

var callTimer, win, videoStreamTime, maxHeight;

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
          callType = $(this).data('calltype'),
          audioSignal = $('#ringtoneSignal')[0];

      QB.webrtc.reject(opponentId, {
        dialog_id: dialogId
      });

      VideoChat.sendMessage(opponentId, '3', null, dialogId, callType);

      incomingCall.remove();
      if ($('#popupIncoming .mCSB_container').children().length === 0) {
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
          audioSignal = $('#ringtoneSignal')[0],
          params = self.build(dialogId),
          chat = $('.l-chat[data-dialog="'+dialogId+'"]');

      $(this).parents('.incoming-call').remove();
      $('#popupIncoming .mCSB_container').children().each(function() {
        $(this).find('.btn_decline').click();
      });
      closePopup();
      audioSignal.pause();

      params.isCallee = true;

      VideoChat.getUserMedia(params, callType, function(err, res) {
        if (err) {
          chat.find('.mediacall .btn_hangup').data('errorMessage', 1);
          chat.find('.mediacall .btn_hangup').click();
          fixScroll();
          return true;
        }

        if (callType === 'audio') {
          self.type = 'audio';
          $('.btn_camera_off').click();
        } else {
          self.type = 'video';
          self.unmute('video');
        }

        self.sessionID = sessionId;
      });
    });

    $('body').on('click', '.btn_hangup', function(event) {
      event.preventDefault();
      var chat = $(this).parents('.l-chat'),
          opponentId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          duration = $(this).parents('.mediacall').find('.mediacall-info-duration').text(),
          callingSignal = $('#callingSignal')[0],
          endCallSignal = $('#endCallSignal')[0],
          isErrorMessage = $(this).data('errorMessage');

      callingSignal.pause();
      endCallSignal.play();
      clearTimeout(callTimer);
      
      QB.webrtc.stop(opponentId, 'manually', {
        dialog_id: dialogId
      });

      if (VideoChat.caller) {
        if (!isErrorMessage) {
          VideoChat.sendMessage(opponentId, '1', duration, dialogId, null, null, self.sessionID);
        } else {
          $(this).removeAttr('data-errorMessage');
        }
        VideoChat.caller = null;
        VideoChat.callee = null;
      }

      self.type = null;
      chat.find('.mediacall').remove();
      chat.find('.l-chat-header').show();
      chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
    });

    $('body').on('click', '.btn_camera_off, .btn_mic_off', switchOffDevice);

    // full-screen-mode
    $('body').on('click', '.btn_full-mode', function() {
      var userId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          chat = $('.l-chat[data-dialog="'+dialogId+'"]'),
          mediacall = $('.mediacall').clone(),
          contact = ContactList.contacts[userId],
          selector, video, isHangUp;
  
      win = enableFullScreenMode();
      
      win.onload = function() {
        selector = $(win.document.body);
        selector.html(mediacall);

        destroyOldScreen();
        buildNewScreen(selector, 'full');

        win.onbeforeunload = disableFullScreenMode;

        selector.find('.btn_full-mode').on('click', function() {
          win.close();
        });

        selector.find('.btn_camera_off, .btn_mic_off').on('click', switchOffDevice);

        selector.find('.btn_hangup').on('click', function() {
          isHangUp = true;
          win.close();
        });

        function disableFullScreenMode() {
          mediacall = selector.find('.mediacall').clone();
          chat.prepend(mediacall);
          chat.find('.l-chat-header').hide();
          chat.find('.l-chat-content').css({height: 'calc(100% - '+maxHeight+' - 90px)'});
          if (screen.height > 768) {
            chat.find('.mediacall-remote-user').css({position: 'absolute', top: '16%', left: '10%', margin: 0});
          }

          $('.dialog-item[data-dialog="'+dialogId+'"]').find('.contact').click();

          buildNewScreen($(window.document.body), 'normal');
        }

        function destroyOldScreen() {
          chat.find('.mediacall').remove();
          chat.find('.l-chat-header').show();
          chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
        }

        function buildNewScreen(selector, mode) {
          if (mode === 'full') {
            selector.find('.mediacall').removeAttr('style');
            selector.find('.btn_full-mode img').attr('src', 'images/icon-full-mode-off.png');
          } else {
            selector.find('.mediacall').attr('style', 'max-height:'+maxHeight);
            selector.find('.btn_full-mode img').attr('src', 'images/icon-full-mode-on.png');
          }
          selector.find('#remoteStream')[0].play();
          selector.find('#localStream')[0].play();
          selector.find('#localStream')[0].muted = true;

          if (self.type === 'video' && !isHangUp) {
            video = selector.find('#remoteStream')[0];
            video.currentTime = videoStreamTime;
            video.addEventListener('timeupdate', function() {
              if (videoStreamTime === video.currentTime) return true;
              videoStreamTime = video.currentTime;
              var duration = getTimer(Math.floor(video.currentTime));
              selector.find('.mediacall-info-duration, .mediacall-remote-duration').text(duration);
            });
          }

          if (isHangUp) {
            selector.find('.mediacall .btn_hangup').click();
            videoStreamTime = null;
          }
        }
      };
    });

  };

  VideoChatView.prototype.onCall = function(id, extension) {
    var audioSignal = $('#ringtoneSignal')[0],
        incomings = $('#popupIncoming'),
        html;

    html = '<div class="incoming-call l-flexbox l-flexbox_column l-flexbox_flexbetween">';
    html += '<div class="incoming-call-info l-flexbox l-flexbox_column">';
    html += '<div class="message-avatar avatar contact-avatar_message info-avatar" style="background-image:url('+extension.avatar+')"></div>';
    html += '<span class="info-notice">'+capitaliseFirstLetter(extension.callType)+' Call from '+extension.full_name+'</span>';
    html += '</div>';
    html += '<div class="incoming-call-controls l-flexbox l-flexbox_flexcenter">';
    html += '<button class="btn_decline" data-callType="'+extension.callType+'" data-dialog="'+extension.dialog_id+'" data-id="'+id+'">Decline</button>';
    html += '<button class="btn_accept" data-callType="'+extension.callType+'" data-session="'+extension.sessionID+'" data-dialog="'+extension.dialog_id+'" data-id="'+id+'">Accept</button>';
    html += '</div></div>';

    incomings.find('.mCSB_container').prepend(html);
    openPopup(incomings);
    audioSignal.play();
  };

  VideoChatView.prototype.onAccept = function(id, extension) {
    var audioSignal = $('#callingSignal')[0],
        chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');

    audioSignal.pause();
    self.sessionID = extension.sessionID;
  };

  VideoChatView.prototype.onRemoteStream = function(stream) {
    var video = document.getElementById('remoteStream');

    QB.webrtc.attachMediaStream('remoteStream', stream);
    $('.mediacall .btn_full-mode').prop('disabled', false);

    if (self.type === 'video') {
      video.addEventListener('timeupdate', function() {
        videoStreamTime = video.currentTime;
        var duration = getTimer(Math.floor(video.currentTime));
        $('.mediacall-info-duration, .mediacall-remote-duration').text(duration);
      });

      $('#remoteUser').addClass('is-hidden');
      $('#remoteStream').removeClass('is-hidden');
      $('.mediacall-info-duration').removeClass('is-hidden');
      $('.mediacall-remote-duration').addClass('is-hidden');
    } else {
      setTimeout(function () {
        setDuration();

        $('#remoteStream').addClass('is-hidden');
        $('#remoteUser').removeClass('is-hidden');
        $('.mediacall-remote-duration').removeClass('is-hidden');
        $('.mediacall-info-duration').addClass('is-hidden');
      }, 2700);
    }
  };

  VideoChatView.prototype.onReject = function(id, extension) {
    var audioSignal = $('#callingSignal')[0],
        chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');

    VideoChat.caller = null;
    VideoChat.callee = null;
    self.type = null;
    audioSignal.pause();

    chat.find('.mediacall').remove();
    chat.find('.l-chat-header').show();
    chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
  };

  VideoChatView.prototype.onStop = function(id, extension) {
    var chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]'),
        declineButton = $('.btn_decline[data-dialog="'+extension.dialog_id+'"]'),
        callingSignal = $('#callingSignal')[0],
        endCallSignal = $('#endCallSignal')[0],
        ringtoneSignal = $('#ringtoneSignal')[0],
        incomingCall;

    if (chat[0] && (chat.find('.mediacall')[0] || win)) {
      if (win) win.close();
      callingSignal.pause();
      endCallSignal.play();
      clearTimeout(callTimer);
      VideoChat.caller = null;
      VideoChat.callee = null;
      self.type = null;
      videoStreamTime = null;

      chat.find('.mediacall').remove();
      chat.find('.l-chat-header').show();
      chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
    } else if (declineButton[0]) {
        incomingCall = declineButton.parents('.incoming-call');
        incomingCall.remove();

        if ($('#popupIncoming .mCSB_container').children().length === 0) {
          closePopup();
          ringtoneSignal.pause();
        }
    }
  };

  VideoChatView.prototype.onUpdateCall = function(id, extension) {
    var chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');
    var selector = win ? $(win.document.body) : $(window.document.body);
    if (chat[0] && (chat.find('.mediacall')[0] || win)) {
      if (extension.mute === 'video') {
        selector.find('#remoteStream').addClass('is-hidden');
        selector.find('#remoteUser').removeClass('is-hidden');
        selector.find('.mediacall-remote-duration').removeClass('is-hidden');
        selector.find('.mediacall-info-duration').addClass('is-hidden');
      }
      if (extension.unmute === 'video') {
        selector.find('#remoteStream').removeClass('is-hidden');
        selector.find('#remoteUser').addClass('is-hidden');
        selector.find('.mediacall-info-duration').removeClass('is-hidden');
        selector.find('.mediacall-remote-duration').addClass('is-hidden');
      }
    }
  };

  VideoChatView.prototype.startCall = function(className) {
    var audioSignal = $('#callingSignal')[0],
        params = self.build(),
        chat = $('.l-chat:visible'),
        callType = !!className.match(/audioCall/) ? 'audio' : 'video';

    VideoChat.getUserMedia(params, callType, function(err, res) {
      if (err) {
        chat.find('.mediacall .btn_hangup').click();
        showError(chat);
        fixScroll();
        return true;
      }

      audioSignal.play();
      if (callType === 'audio') {
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
        html;

    maxHeight = screen.height > 768 ? '420px' : '550px';

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
    html += '<img class="mediacall-info-logo" src="images/logo-qmunicate-transparent.svg" alt="Q-municate">';
    html += '<span class="mediacall-info-duration is-hidden"></span>';
    html += '</div>';
    html += '<div class="mediacall-controls l-flexbox l-flexbox_flexcenter">';
    html += '<button class="btn_mediacall btn_full-mode" data-id="'+userId+'" data-dialog="'+dialogId+'" disabled><img class="btn-icon_mediacall" src="images/icon-full-mode-on.png" alt="full mode"></button>';
    html += '<button class="btn_mediacall btn_camera_off" data-id="'+userId+'" data-dialog="'+dialogId+'"><img class="btn-icon_mediacall" src="images/icon-camera-off.svg" alt="camera"></button>';
    html += '<button class="btn_mediacall btn_mic_off" data-id="'+userId+'" data-dialog="'+dialogId+'"><img class="btn-icon_mediacall" src="images/icon-mic-off.svg" alt="mic"></button>';
    html += '<button class="btn_mediacall btn_hangup" data-id="'+userId+'" data-dialog="'+dialogId+'"><img class="btn-icon_mediacall" src="images/icon-hangup.svg" alt="hangup"></button>';
    html += '</div></div>';

    chat.prepend(html);
    chat.find('.l-chat-header').hide();
    chat.find('.l-chat-content').css({height: 'calc(100% - '+maxHeight+' - 90px)'});
    if (screen.height > 768) {
      chat.find('.mediacall-remote-user').css({position: 'absolute', top: '16%', left: '10%', margin: 0});
    }

    $('.dialog-item[data-dialog="'+dialogId+'"]').find('.contact').click();

    return {
      opponentId: userId,
      dialogId: dialogId
    };
  };

  VideoChatView.prototype.mute = function(callType) {
    QB.webrtc.mute(callType);
    if (callType === 'video') {
      $('#localStream').addClass('is-hidden');
      if (win) $(win.document.body).find('#localStream').addClass('is-hidden');
      $('#localUser').removeClass('is-hidden');
      if (win) $(win.document.body).find('#localUser').removeClass('is-hidden');
    }
  };

  VideoChatView.prototype.unmute = function(callType) {
    QB.webrtc.unmute(callType);
    if (callType === 'video') {
      $('#localStream').removeClass('is-hidden');
      if (win) $(win.document.body).find('#localStream').removeClass('is-hidden');
      $('#localUser').addClass('is-hidden');
      if (win) $(win.document.body).find('#localUser').addClass('is-hidden');
    }
  };

  function switchOffDevice(event) {
    event.preventDefault();
    var obj = $(event.target).data('id') ? $(event.target) : $(event.target).parent(),
        opponentId = obj.data('id'),
        dialogId = obj.data('dialog'),
        deviceType = !!obj.attr('class').match(/btn_camera_off/) ? 'video' : 'audio',
        msg = deviceType === 'video' ? 'Camera' : 'Mic';
    
    if (self.type !== deviceType && self.type === 'audio') {
      obj.addClass('off');
      obj.attr('title', msg + ' is off');
      return true;
    }

    if (obj.is('.off')) {
      self.unmute(deviceType);
      if (deviceType === 'video')
        QB.webrtc.update(opponentId, {
          dialog_id: dialogId,
          unmute: deviceType
        });
      obj.removeClass('off');
      obj.removeAttr('title');
    } else {
      self.mute(deviceType);
      if (deviceType === 'video')
        QB.webrtc.update(opponentId, {
          dialog_id: dialogId,
          mute: deviceType
        });
      obj.addClass('off');
      obj.attr('title', msg + ' is off');
    }
  }

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

function setDuration(currentTime) {
  var c = currentTime || 0;
  $('.mediacall-info-duration, .mediacall-remote-duration').text(getTimer(c));
  if (win) $(win.document.body).find('.mediacall-info-duration, .mediacall-remote-duration').text(getTimer(c));
  callTimer = setTimeout(function() {
    c++;
    setDuration(c);
  }, 1000);
}      

function getTimer(time) {
  var h, min, sec;

  h = Math.floor( time / 3600 );
  h = h >= 10 ? h : '0' + h;
  min = Math.floor( time / 60 );
  min = min >= 10 ? min : '0' + min;
  sec = Math.floor( time % 60 );
  sec = sec >= 10 ? sec : '0' + sec;

  return h + ':' + min + ':' + sec;
}

function showError(chat) {
  var html;
  html = '<article class="message message_service l-flexbox l-flexbox_alignstretch">';
  html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
  html += '<div class="message-container-wrap">';
  html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
  html += '<div class="message-content">';
  html += '<h4 class="message-author message-error">Devices are not found</h4>';
  html += '</div>';
  html += '</div></div></article>';
  chat.find('.mCSB_container').append(html);
}

function fixScroll() {
  var chat = $('.l-chat:visible'),
      containerHeight = chat.find('.l-chat-content .mCSB_container').height(),
      chatContentHeight = chat.find('.l-chat-content').height(),
      draggerContainerHeight = chat.find('.l-chat-content .mCSB_draggerContainer').height(),
      draggerHeight = chat.find('.l-chat-content .mCSB_dragger').height();

  chat.find('.l-chat-content .mCSB_container').css({top: chatContentHeight - containerHeight + 'px'});
  chat.find('.l-chat-content .mCSB_dragger').css({top: draggerContainerHeight - draggerHeight + 'px'});
}

function capitaliseFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function enableFullScreenMode() {
  var scrWidth, scrHeight, winWidth, winHeight, disWidth, disHeight;
  var url, params;
  
  scrWidth = window.screen.availWidth;
  scrHeight = window.screen.availHeight;
  winWidth = scrWidth / 2;
  winHeight = scrHeight / 2;
  disWidth = (scrWidth - winWidth) / 2;
  disHeight = (scrHeight - winHeight) / 2;
  
  url = window.location.origin + window.location.pathname + 'full-mode.html';
  params = 'width='+winWidth+',height='+winHeight+',left='+disWidth+',top='+disHeight+',resizable=yes';
  
  return window.open(url, 'call-full-mode', params);
}
