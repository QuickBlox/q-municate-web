/*
 * Q-municate chat application
 *
 * VideoChat View Module
 *
 */

var callTimer, win, videoStreamTime;

define(['jquery', 'quickblox', 'config', 'Helpers', 'QBNotification'], function($, QB, QMCONFIG, Helpers, QBNotification) {

  var self;
  var User,
      ContactList,
      VideoChat,
      curSession = {};

  function VideoChatView(app) {
    this.app = app;

    self = this;
    User = this.app.models.User;
    ContactList = this.app.models.ContactList;
    VideoChat = this.app.models.VideoChat;
  }

  VideoChatView.prototype.cancelCurrentCalls = function() {
    if ($('.mediacall').length > 0) {
      $('.mediacall').find('.btn_hangup').click();
    }
  };

  VideoChatView.prototype.init = function() {
    var DialogView = this.app.views.Dialog;

    $('body').on('click', '.videoCall, .audioCall', function() {
      var $className = $(this).attr('class');

      self.cancelCurrentCalls();
      self.startCall($className);
      
      curSession = self.app.models.VideoChat.session;

      return false;
    });

    $('#popupIncoming').on('click', '.btn_decline', function() {
      var $incomingCall = $(this).parents('.incoming-call'),
          opponentId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          callType = $(this).data('calltype'),
          audioSignal = $('#ringtoneSignal')[0];

      curSession.reject({
        opponent_id: opponentId,
        dialog_id: dialogId
      });

      VideoChat.sendMessage(opponentId, '3', null, dialogId, callType);

      $incomingCall.remove();

      if ($('#popupIncoming .mCSB_container').children().length === 0) {
        closePopup();
        audioSignal.pause();
      }

      return false;
    });

    $('#popupIncoming').on('click', '.btn_accept', function() {
      self.cancelCurrentCalls();

      var id = $(this).data('id'),
          $dialogItem = $('.dialog-item[data-id="'+id+'"]').find('.contact');
      
      DialogView.htmlBuild($dialogItem);

      var opponentId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          sessionId = $(this).data('session'),
          callType = $(this).data('calltype'),
          audioSignal = $('#ringtoneSignal')[0],
          params = self.build(dialogId),
          $chat = $('.l-chat[data-dialog="'+dialogId+'"]');

      $(this).parents('.incoming-call').remove();
      $('#popupIncoming .mCSB_container').children().each(function() {
        $(this).find('.btn_decline').click();
      });
      closePopup();
      audioSignal.pause();

      params.isCallee = true;

      VideoChat.getUserMedia(params, callType, function(err, res) {
        if (err) {
          $chat.find('.mediacall .btn_hangup').data('errorMessage', 1);
          $chat.find('.mediacall .btn_hangup').click();
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
        addCallTypeIcon(id, callType);
      });

      return false;
    });

    $('body').on('click', '.btn_hangup', function() {
      var $chat = $(this).parents('.l-chat'),
          opponentId = $(this).data('id'),
          dialogId = $(this).data('dialog'),
          duration = $(this).parents('.mediacall').find('.mediacall-info-duration').text(),
          callingSignal = $('#callingSignal')[0],
          endCallSignal = $('#endCallSignal')[0],
          isErrorMessage = $(this).data('errorMessage');

      callingSignal.pause();
      endCallSignal.play();
      clearTimeout(callTimer);
      
      curSession.stop({
        opponent_id: opponentId, 
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
      $chat.find('.mediacall').remove();
      $chat.find('.l-chat-header').show();
      $chat.find('.l-chat-content').css({height: 'calc(100% - 165px)'});

      addCallTypeIcon(opponentId, null);

      return false;
    });

    $('body').on('click', '.btn_camera_off, .btn_mic_off', switchOffDevice);

    // full-screen-mode
    $('body').on('click', '.btn_full-mode', function() {
      var mediaScreen = document.getElementsByClassName("mediacall")[0],
          isFullScreen = false;

      if (mediaScreen.requestFullscreen) {      
        if (document.fullScreenElement) {
            document.cancelFullScreen();
            isFullScreen = false;
        } else {
          mediaScreen.requestFullscreen();
          isFullScreen = true;
        }
      } else if (mediaScreen.msRequestFullscreen) {
        if (document.msFullscreenElement) {
            document.msExitFullscreen();
            isFullScreen = false;
          } else {
          mediaScreen.msRequestFullscreen();
          isFullScreen = true;
        }
      } else if (mediaScreen.mozRequestFullScreen) {      
        if (document.mozFullScreenElement) {
            document.mozCancelFullScreen();
            isFullScreen = false;
        } else {
          mediaScreen.mozRequestFullScreen();
          isFullScreen = true;
        }
      } else if (mediaScreen.webkitRequestFullscreen) {
        if (document.webkitFullscreenElement) {
            document.webkitCancelFullScreen();
            isFullScreen = false;
          } else {
          mediaScreen.webkitRequestFullscreen();
          isFullScreen = true;
        }
      }

      if (isFullScreen) {
        $('#fullModeOn').hide();
        $('#fullModeOff').show();
      } else {
        $('#fullModeOn').show();
        $('#fullModeOff').hide();
      }

      return false;
    });

  };

  VideoChatView.prototype.onCall = function(session, extension) {
    var audioSignal = document.getElementById('ringtoneSignal'),
        $incomings = $('#popupIncoming'),
        id = session.initiatorID,
        contact = ContactList.contacts[id],
        callType = extension.call_type || (session.callType == 1 ? 'video' : 'audio'),
        userName = extension.full_name || contact.full_name,
        userAvatar = extension.avatar || contact.avatar_url,
        dialogId = $('li.list-item.dialog-item[data-id="'+id+'"]').data('dialog'),
        htmlTemplate,
        templateParams;

    templateParams = {
      userAvatar: userAvatar,
      callTypeUС: capitaliseFirstLetter(callType),
      callType: callType,
      userName: userName,
      dialogId: dialogId,
      sessionId: session.ID,
      userId: id
    };

    htmlTemplate = onCallTemplate(templateParams);

    $incomings.find('.mCSB_container').prepend(htmlTemplate);
    openPopup($incomings);
    audioSignal.play();

    self.app.models.VideoChat.session = session;
    curSession = self.app.models.VideoChat.session;

    createAndShowNotification({
      'id': id,
      'dialogId': dialogId,
      'callState': '5',
      'callType': callType
    });
  };

  VideoChatView.prototype.onAccept = function(session, id, extension) {
    var audioSignal = document.getElementById('callingSignal'),
        dialogId = $('li.list-item.dialog-item[data-id="'+id+'"]').data('dialog'),
        callType = self.type;

    audioSignal.pause();
    self.sessionID = session.ID;

    addCallTypeIcon(id, callType);

    createAndShowNotification({
      'id': id,
      'dialogId': dialogId,
      'callState': '6',
      'callType': callType
    });
  };

  VideoChatView.prototype.onRemoteStream = function(session, id, stream) {
    var video = document.getElementById('remoteStream');

    curSession.attachMediaStream('remoteStream', stream);
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

  VideoChatView.prototype.onReject = function(session, id, extension) {
    var audioSignal = document.getElementById('callingSignal'),
        $chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');

    VideoChat.caller = null;
    VideoChat.callee = null;
    self.type = null;
    audioSignal.pause();

    $chat.find('.mediacall').remove();
    $chat.find('.l-chat-header').show();
    $chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
  };

  VideoChatView.prototype.onStop = function(session, id, extension) {
    var dialogId = $('li.list-item.dialog-item[data-id="'+id+'"]').data('dialog'),
        $chat = $('.l-chat[data-dialog="'+dialogId+'"]'),
        $declineButton = $('.btn_decline[data-dialog="'+dialogId+'"]'),
        callingSignal = document.getElementById('callingSignal'),
        endCallSignal = document.getElementById('endCallSignal'),
        ringtoneSignal = document.getElementById('ringtoneSignal'),
        incomingCall;

    if ($chat[0] && ($chat.find('.mediacall')[0] || win)) {
      if (win) win.close();
      callingSignal.pause();
      endCallSignal.play();
      clearTimeout(callTimer);
      VideoChat.caller = null;
      VideoChat.callee = null;
      self.type = null;
      videoStreamTime = null;

      $chat.find('.mediacall').remove();
      $chat.find('.l-chat-header').show();
      $chat.find('.l-chat-content').css({height: 'calc(100% - 75px - 90px)'});
    } else if ($declineButton[0]) {
        incomingCall = $declineButton.parents('.incoming-call');
        incomingCall.remove();

        if ($('#popupIncoming .mCSB_container').children().length === 0) {
          closePopup();
          ringtoneSignal.pause();
        }
    }

    addCallTypeIcon(id, null);
  };

  VideoChatView.prototype.onUpdateCall = function(session, id, extension) {
    var $chat = $('.l-chat[data-dialog="'+extension.dialog_id+'"]');
    var $selector = win ? $(win.document.body) : $(window.document.body);
    if ($chat[0] && ($chat.find('.mediacall')[0] || win)) {
      if (extension.mute === 'video') {
        $selector.find('#remoteStream').addClass('is-hidden');
        $selector.find('#remoteUser').removeClass('is-hidden');
        $selector.find('.mediacall-remote-duration').removeClass('is-hidden');
        $selector.find('.mediacall-info-duration').addClass('is-hidden');
      }
      if (extension.unmute === 'video') {
        $selector.find('#remoteStream').removeClass('is-hidden');
        $selector.find('#remoteUser').addClass('is-hidden');
        $selector.find('.mediacall-info-duration').removeClass('is-hidden');
        $selector.find('.mediacall-remote-duration').addClass('is-hidden');
      }
    }
  };

  VideoChatView.prototype.startCall = function(className) {
    var audioSignal = document.getElementById('callingSignal'),
        params = self.build(),
        $chat = $('.l-chat:visible'),
        callType = !!className.match(/audioCall/) ? 'audio' : 'video';

    VideoChat.getUserMedia(params, callType, function(err, res) {
      if (err) {
        $chat.find('.mediacall .btn_hangup').click();
        showError($chat);
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
    var $chat = id ? $('.l-chat[data-dialog="'+id+'"]') : $('.l-chat:visible'),
        userId = $chat.data('id'),
        dialogId = $chat.data('dialog'),
        contact = ContactList.contacts[userId],
        htmlTemplate,
        templateParams;

    templateParams = {
      userAvatar: User.contact.avatar_url,
      contactAvatar: contact.avatar_url,
      contactName: contact.full_name,
      dialogId: dialogId,
      userId: userId
    };

    htmlTemplate = buildTemplate(templateParams);

    $chat.prepend(htmlTemplate);
    $chat.find('.l-chat-header').hide();
    $chat.find('.l-chat-content').css({height: 'calc(50% - 90px)'});
    if (screen.height > 768) {
      $chat.find('.mediacall-remote-user').css({position: 'absolute', top: '16%', left: '10%', margin: 0});
    }

    $('.dialog-item[data-dialog="'+dialogId+'"]').find('.contact').click();

    return {
      opponentId: userId,
      dialogId: dialogId
    };
  };

  VideoChatView.prototype.mute = function(callType) {
    curSession.mute(callType);
    if (callType === 'video') {
      $('#localStream').addClass('is-hidden');
      if (win) $(win.document.body).find('#localStream').addClass('is-hidden');
      $('#localUser').removeClass('is-hidden');
      if (win) $(win.document.body).find('#localUser').removeClass('is-hidden');
    }
  };

  VideoChatView.prototype.unmute = function(callType) {
    curSession.unmute(callType);
    if (callType === 'video') {
      $('#localStream').removeClass('is-hidden');
      if (win) $(win.document.body).find('#localStream').removeClass('is-hidden');
      $('#localUser').addClass('is-hidden');
      if (win) $(win.document.body).find('#localUser').addClass('is-hidden');
    }
  };

  function switchOffDevice(event) {
    var $obj = $(event.target).data('id') ? $(event.target) : $(event.target).parent(),
        opponentId = $obj.data('id'),
        dialogId = $obj.data('dialog'),
        deviceType = !!$obj.attr('class').match(/btn_camera_off/) ? 'video' : 'audio',
        msg = deviceType === 'video' ? 'Camera' : 'Mic';
    
    if (self.type !== deviceType && self.type === 'audio') {
      $obj.addClass('off');
      $obj.attr('title', msg + ' is off');
      return true;
    }

    if ($obj.is('.off')) {
      self.unmute(deviceType);
      if (deviceType === 'video')
        curSession.update(opponentId, {
          dialog_id: dialogId,
          unmute: deviceType
        });
      $obj.removeClass('off');
      $obj.removeAttr('title');
    } else {
      self.mute(deviceType);
      if (deviceType === 'video')
        curSession.update(opponentId, {
          dialog_id: dialogId,
          mute: deviceType
        });
      $obj.addClass('off');
      $obj.attr('title', msg + ' is off');
    }

    return false;
  }

  function createAndShowNotification(options) {
    var msg = {
      'callState': options.callState,
      'dialog_id': options.dialogId,
      'sender_id': options.id,
      'caller': options.id,
      'type': 'chat',
      'callType': capitaliseFirstLetter(options.callType)
    };

    var params = {
      'user': User,
      'dialogs': ContactList.dialogs,
      'contacts': ContactList.contacts
    };

    var title = Helpers.Notifications.getTitle(msg, params),
        options = Helpers.Notifications.getOptions(msg, params);

    if (QMCONFIG.notification && QBNotification.isSupported() && !window.isQMAppActive) {
      if(!QBNotification.needsPermission()) {
        Helpers.Notifications.show(title, options);
      } else {
        QBNotification.requestPermission(function(state) {
          if (state === "granted") {
            Helpers.Notifications.show(title, options);
          } 
        });
      }
    }
  }

  function addCallTypeIcon(id, callType) {
    var $status = $('li.dialog-item[data-id="'+id+'"]').find('span.status');

    if (callType === 'video') {
      $status.addClass('icon_videocall');
    } else if (callType === 'audio') {
      $status.addClass('icon_audiocall');
    } else {
      $status.hasClass('icon_videocall') ? $status.removeClass('icon_videocall') : $status.removeClass('icon_audiocall')
    }
  }

  return VideoChatView;
});

/* Private
-------------------------------------------------------------*/
function openPopup($objDom) {
  $objDom.add('.popups').addClass('is-overlay');
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
  var htmlTemplate = _.template('<article class="message message_service l-flexbox l-flexbox_alignstretch">'
      +'<span class="message-avatar contact-avatar_message request-button_pending"></span>'
      +'<div class="message-container-wrap"><div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">'
      +'<div class="message-content"><h4 class="message-author message-error">Devices are not found</h4></div></div></div></article>');

  chat.find('.mCSB_container').append(htmlTemplate);
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

function onCallTemplate(params) {
  var htmlTemplate = _.template('<div class="incoming-call l-flexbox l-flexbox_column l-flexbox_flexbetween">'
      +'<div class="incoming-call-info l-flexbox l-flexbox_column">'
      +'<div class="message-avatar avatar contact-avatar_message info-avatar" style="background-image:url(<%= userAvatar %>)"></div>'
      +'<span class="info-notice"><%= callTypeUС %> Call from <%= userName %></span></div>'
      +'<div class="incoming-call-controls l-flexbox l-flexbox_flexcenter">'
      +'<button class="btn_decline" data-callType="<%= callType %>" data-dialog="<%= dialogId %>"'
      +' data-id="<%= userId %>">Decline</button>'
      +'<button class="btn_accept" data-callType="<%= callType %>" data-session="<%= sessionId %>"'
      +' data-dialog="<%= dialogId %>" data-id="<%= userId %>">Accept</button>'
      +'</div></div>')(params);

  return htmlTemplate;
}

function buildTemplate(params) {
  var htmlTemplate = _.template('<div class="mediacall l-flexbox">'
      +'<video id="remoteStream" class="mediacall-remote-stream is-hidden"></video>'
      +'<video id="localStream" class="mediacall-local mediacall-local-stream is-hidden"></video>'
      +'<img id="localUser" class="mediacall-local mediacall-local-avatar" src="<%=userAvatar%>" alt="avatar">'
      +'<div id="remoteUser" class="mediacall-remote-user l-flexbox l-flexbox_column">'
      +'<img class="mediacall-remote-avatar" src="<%=contactAvatar%>" alt="avatar">'
      +'<span class="mediacall-remote-name"><%=contactName%></span>'
      +'<span class="mediacall-remote-duration">connecting...</span></div>'
      +'<div class="mediacall-info l-flexbox l-flexbox_column l-flexbox_flexcenter">'
      +'<img class="mediacall-info-logo" src="images/logo-qmunicate-transparent.svg" alt="Q-municate">'
      +'<span class="mediacall-info-duration is-hidden"></span></div>'
      +'<div class="mediacall-controls l-flexbox l-flexbox_flexcenter">'
      +'<button class="btn_mediacall btn_full-mode" data-id="<%=userId%>" data-dialog="<%=dialogId%>" disabled>'
      +'<div id="fullModeOn" class="btn-icon_mediacall"></div>'
      +'<div id="fullModeOff" class="btn-icon_mediacall"></div></button>'
      +'<button class="btn_mediacall btn_camera_off" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'
      +'<img class="btn-icon_mediacall" src="images/icon-camera-off.svg" alt="camera"></button>'
      +'<button class="btn_mediacall btn_mic_off" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'
      +'<img class="btn-icon_mediacall" src="images/icon-mic-off.svg" alt="mic"></button>'
      +'<button class="btn_mediacall btn_hangup" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'
      +'<img class="btn-icon_mediacall" src="images/icon-hangup.svg" alt="hangup"></button>'
      +'</div></div>')(params);

  return htmlTemplate;
}