/*
 * Q-municate chat application
 *
 * VideoChat View Module
 *
 */

var callTimer, videoStreamTime;

define(['jquery', 'quickblox', 'config', 'Helpers', 'QBNotification', 'QMHtml'], function($, QB, QMCONFIG, Helpers, QBNotification, QMHtml) {

  var self;
  var User,
      ContactList,
      VideoChat,
      curSession = {},
      network = {},
      stopStreamFF,
      sendAutoReject,
      is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

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
      if (QB.webrtc) {
        var className = $(this).attr('class');

        self.cancelCurrentCalls();
        self.startCall(className);
        
        curSession = self.app.models.VideoChat.session;
      } else {
        QMHtml.VideoChat.noWebRTC();
      }

      return false;
    });

    $('#popupIncoming').on('click', '.btn_decline', function() {
      var $self = $(this),
          $incomingCall = $self.parents('.incoming-call'),
          opponentId = $self.data('id'),
          dialogId = $self.data('dialog'),
          callType = $self.data('calltype'),
          audioSignal = $('#ringtoneSignal')[0];

      curSession.reject({});

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

      clearTimeout(sendAutoReject);
      sendAutoReject = undefined;

      var $self = $(this),
          id = $self.data('id'),
          $dialogItem = $('.dialog-item[data-id="'+id+'"]').find('.contact');
      
      DialogView.htmlBuild($dialogItem);

      var opponentId = $self.data('id'),
          dialogId = $self.data('dialog'),
          sessionId = $self.data('session'),
          callType = $self.data('calltype'),
          audioSignal = $('#ringtoneSignal')[0],
          params = self.build(dialogId),
          $chat = $('.l-chat[data-dialog="'+dialogId+'"]');

      $self.parents('.incoming-call').remove();
      $('#popupIncoming .mCSB_container').children().each(function() {
        $self.find('.btn_decline').click();
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
      var $self = $(this),
          $chat = $self.parents('.l-chat'),
          opponentId = $self.data('id'),
          dialogId = $self.data('dialog'),
          duration = $self.parents('.mediacall').find('.mediacall-info-duration').text(),
          callingSignal = $('#callingSignal')[0],
          endCallSignal = $('#endCallSignal')[0],
          isErrorMessage = $self.data('errorMessage');

      if (VideoChat.caller) {
        if (!isErrorMessage && duration !== 'connect...') {
          VideoChat.sendMessage(opponentId, '1', duration, dialogId, null, null, self.sessionID);
        } else {
          $self.removeAttr('data-errorMessage');
        }
      }

      callingSignal.pause();
      endCallSignal.play();
      clearTimeout(callTimer);

      curSession.stop({});

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

    $(window).on('resize', function() {
      setScreenStyle();
    });

  };

  VideoChatView.prototype.onCall = function(session, extension) {
    if ('div.popups.is-overlay') {
      $('.is-overlay:not(.chat-occupants-wrap)').removeClass('is-overlay');
    }

    var audioSignal = document.getElementById('ringtoneSignal'),
        $incomings = $('#popupIncoming'),
        id = session.initiatorID,
        contact = ContactList.contacts[id],
        callType = (session.callType == 1 ? 'video' : 'audio') || extension.call_type,
        userName = contact.full_name || extension.full_name,
        userAvatar = contact.avatar_url || extension.avatar,
        dialogId = $('li.list-item.dialog-item[data-id="'+id+'"]').data('dialog'),
        autoReject = QMCONFIG.QBconf.webrtc.answerTimeInterval * 1000,
        htmlTpl,
        tplParams;

    tplParams = {
      userAvatar: userAvatar,
      callTypeUС: capitaliseFirstLetter(callType),
      callType: callType,
      userName: userName,
      dialogId: dialogId,
      sessionId: session.ID,
      userId: id
    };

    htmlTpl = QMHtml.VideoChat.onCallTpl(tplParams);

    $incomings.find('.mCSB_container').prepend(htmlTpl);
    openPopup($incomings);
    audioSignal.play();

    VideoChat.session = session;
    curSession = VideoChat.session;

    createAndShowNotification({
      'id': id,
      'dialogId': dialogId,
      'callState': '5',
      'callType': callType
    });

    sendAutoReject = setTimeout(function() {
      $('.btn_decline').click();
    }, autoReject);
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
        $('.mediacall-info-duration').text(duration);
      });

      $('#remoteUser').addClass('is-hidden');
      $('#remoteStream').removeClass('is-hidden');
    } else {
      setTimeout(function () {
        setDuration();

        $('#remoteStream').addClass('is-hidden');
        $('#remoteUser').removeClass('is-hidden');
      }, 2700);
    }
  };

  VideoChatView.prototype.onReject = function(session, id, extension) {
    var audioSignal = document.getElementById('callingSignal'),
        dialogId = $('li.list-item.dialog-item[data-id="'+id+'"]').data('dialog'),
        $chat = $('.l-chat[data-dialog="'+dialogId+'"]');

    curSession = {};
    VideoChat.session = null;
    VideoChat.caller = null;
    VideoChat.callee = null;
    self.type = null;
    audioSignal.pause();

    $chat.find('.mediacall').remove();
    $chat.find('.l-chat-header').show();
    $chat.find('.l-chat-content').css({height: 'calc(100% - 165px)'});
  };

  VideoChatView.prototype.onStop = function(session, id, extension) {
    closeStreamScreen(id);
  };

  VideoChatView.prototype.onUpdateCall = function(session, id, extension) {
    var dialogId = $('li.list-item.dialog-item[data-id="'+id+'"]').data('dialog'),
        $chat = $('.l-chat[data-dialog="'+dialogId+'"]');
    var $selector = $(window.document.body);

    if ($chat[0] && ($chat.find('.mediacall')[0])) {
      if (extension.mute === 'video') {
        $selector.find('#remoteStream').addClass('is-hidden');
        $selector.find('#remoteUser').removeClass('is-hidden');
      }
      if (extension.unmute === 'video') {
        $selector.find('#remoteStream').removeClass('is-hidden');
        $selector.find('#remoteUser').addClass('is-hidden');
      }
    }
  };

  VideoChatView.prototype.onCallStatsReport = function(session, userId, stats) {
    /**
     * Hack for Firefox
     * (https://bugzilla.mozilla.org/show_bug.cgi?id=852665)
     */
    if(is_firefox) {
      var inboundrtp = _.findWhere(stats, {type: 'inboundrtp'});

      if (!inboundrtp || !isBytesReceivedChanges(userId, inboundrtp)) {
        if (!stopStreamFF) {      
          stopStreamFF = setTimeout(function() {
            console.warn("This is Firefox and user " + userId + " has lost his connection.");

            if(!_.isEmpty(curSession)) {
              curSession.closeConnection(userId);
              $('.btn_hangup').click();
            }
          }, 30000);
        }
      } else {
        clearTimeout(stopStreamFF);
        stopStreamFF = undefined;
      }
    }
  };

  VideoChatView.prototype.onSessionCloseListener = function(session) {
    var opponentId = User.contact.id === VideoChat.callee ? VideoChat.caller : VideoChat.callee;

    closeStreamScreen(opponentId);
  };

  VideoChatView.prototype.onUserNotAnswerListener = function(session, userId) {
    $('.btn_hangup').click();
  };

  VideoChatView.prototype.startCall = function(className) {
    var audioSignal = document.getElementById('callingSignal'),
        params = self.build(),
        $chat = $('.l-chat:visible'),
        callType = !!className.match(/audioCall/) ? 'audio' : 'video';

    VideoChat.getUserMedia(params, callType, function(err, res) {
      if (err) {
        $chat.find('.mediacall .btn_hangup').click();
        QMHtml.VideoChat.showError();
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
        htmlTpl,
        tplParams;

    tplParams = {
      userAvatar: User.contact.avatar_url,
      contactAvatar: contact.avatar_url,
      contactName: contact.full_name,
      dialogId: dialogId,
      userId: userId
    };

    htmlTpl = QMHtml.VideoChat.buildTpl(tplParams);

    $chat.prepend(htmlTpl);
    $chat.find('.l-chat-header').hide();
    $chat.find('.l-chat-content').css({height: 'calc(50% - 90px)'});

    setScreenStyle();

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
      $('#localUser').removeClass('is-hidden');
    }
  };

  VideoChatView.prototype.unmute = function(callType) {
    curSession.unmute(callType);
    if (callType === 'video') {
      $('#localStream').removeClass('is-hidden');
      $('#localUser').addClass('is-hidden');
    }
  };

  function closeStreamScreen(id) {
    var dialogId = $('li.list-item.dialog-item[data-id="'+id+'"]').data('dialog'),
        $chat = $('.l-chat[data-dialog="'+dialogId+'"]'),
        $declineButton = $('.btn_decline[data-dialog="'+dialogId+'"]'),
        callingSignal = document.getElementById('callingSignal'),
        endCallSignal = document.getElementById('endCallSignal'),
        ringtoneSignal = document.getElementById('ringtoneSignal'),
        incomingCall;

    if ($chat[0] && ($chat.find('.mediacall')[0])) {
      callingSignal.pause();
      endCallSignal.play();
      clearTimeout(callTimer);
      curSession = {};
      VideoChat.session = null;
      VideoChat.caller = null;
      VideoChat.callee = null;
      self.type = null;
      videoStreamTime = null;

      $chat.find('.mediacall').remove();
      $chat.find('.l-chat-header').show();
      $chat.find('.l-chat-content').css({height: 'calc(100% - 165px)'});
    } else if ($declineButton[0]) {
        incomingCall = $declineButton.parents('.incoming-call');
        incomingCall.remove();

        if ($('#popupIncoming .mCSB_container').children().length === 0) {
          closePopup();
          ringtoneSignal.pause();
        }
    }

    addCallTypeIcon(id, null);
  }

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

  function createAndShowNotification(paramsObg) {
    var msg = {
      'callState': paramsObg.callState,
      'dialog_id': paramsObg.dialogId,
      'sender_id': paramsObg.id,
      'caller': paramsObg.id,
      'type': 'chat',
      'callType': capitaliseFirstLetter(paramsObg.callType)
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
      $status.hasClass('icon_videocall') ? $status.removeClass('icon_videocall') : $status.removeClass('icon_audiocall');
    }
  }

  function isBytesReceivedChanges(userId, inboundrtp) {
    var res = true,
        inbBytesRec = inboundrtp.bytesReceived;

    if(network[userId] === undefined) {
      network[userId] = {
        'bytesReceived': inbBytesRec
      };
    } else {
      if(network[userId].bytesReceived === inbBytesRec) {
        res = false;
      } else {
        network[userId] = {
          'bytesReceived': inbBytesRec
        };
      }
    }

    return res;
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
  $('.mediacall-info-duration').text(getTimer(c));
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

function fixScroll() {
  var $chat = $('.l-chat:visible'),
      containerHeight = $chat.find('.l-chat-content .mCSB_container').height(),
      chatContentHeight = $chat.find('.l-chat-content').height(),
      draggerContainerHeight = $chat.find('.l-chat-content .mCSB_draggerContainer').height(),
      draggerHeight = $chat.find('.l-chat-content .mCSB_dragger').height();

  $chat.find('.l-chat-content .mCSB_container').css({top: chatContentHeight - containerHeight + 'px'});
  $chat.find('.l-chat-content .mCSB_dragger').css({top: draggerContainerHeight - draggerHeight + 'px'});
}

function capitaliseFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function setScreenStyle() {
  if ($('.mediacall').outerHeight() <= 260) {
    $('.mediacall').addClass('small_screen');
  } else {
    $('.mediacall').removeClass('small_screen');
  }
}