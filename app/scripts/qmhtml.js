/**
 * 
 * htmlQM Module
 * 
 */

define(['jquery', 'underscore', 'MainModule', 'config', 'Helpers'], function($, _, QM, QMCONFIG, Helpers) {
  var QMHtml = {};

  QMHtml.VideoChat = {

    onCallTpl: function(params) {
      var htmlTemplate = _.template('<div class="incoming-call l-flexbox l-flexbox_column l-flexbox_flexbetween">'+
          '<div class="incoming-call-info l-flexbox l-flexbox_column">'+
          '<div class="message-avatar avatar contact-avatar_message info-avatar" style="background-image:url(<%= userAvatar %>)"></div>'+
          '<span class="info-notice"><%= callTypeUС %> Call from <%= userName %></span></div>'+
          '<div class="incoming-call-controls l-flexbox l-flexbox_flexcenter">'+
          '<button class="btn_decline" data-callType="<%= callType %>" data-dialog="<%= dialogId %>"'+
          ' data-id="<%= userId %>">Decline</button>'+
          '<button class="btn_accept" data-callType="<%= callType %>" data-session="<%= sessionId %>"'+
          ' data-dialog="<%= dialogId %>" data-id="<%= userId %>">Accept</button>'+
          '</div></div>')(params);

      return htmlTemplate;
    },

    buildTpl: function(params) {
      var htmlTemplate = _.template('<div class="mediacall l-flexbox">'+
          '<video id="remoteStream" class="mediacall-remote-stream is-hidden"></video>'+
          '<video id="localStream" class="mediacall-local mediacall-local-stream is-hidden"></video>'+
          '<img id="localUser" class="mediacall-local mediacall-local-avatar" src="<%=userAvatar%>" alt="avatar">'+
          '<div id="remoteUser" class="mediacall-remote-user l-flexbox l-flexbox_column">'+
          '<img class="mediacall-remote-avatar" src="<%=contactAvatar%>" alt="avatar">'+
          '<span class="mediacall-remote-name"><%=contactName%></span>'+
          '<span class="mediacall-remote-duration">connecting...</span></div>'+
          '<div class="mediacall-info l-flexbox l-flexbox_column l-flexbox_flexcenter">'+
          '<img class="mediacall-info-logo" src="images/logo-qmunicate-transparent.svg" alt="Q-municate">'+
          '<span class="mediacall-info-duration is-hidden"></span></div>'+
          '<div class="mediacall-controls l-flexbox l-flexbox_flexcenter">'+
          '<button class="btn_mediacall btn_full-mode" data-id="<%=userId%>" data-dialog="<%=dialogId%>" disabled>'+
          '<div id="fullModeOn" class="btn-icon_mediacall"></div>'+
          '<div id="fullModeOff" class="btn-icon_mediacall"></div></button>'+
          '<button class="btn_mediacall btn_camera_off" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'+
          '<img class="btn-icon_mediacall" src="images/icon-camera-off.svg" alt="camera"></button>'+
          '<button class="btn_mediacall btn_mic_off" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'+
          '<img class="btn-icon_mediacall" src="images/icon-mic-off.svg" alt="mic"></button>'+
          '<button class="btn_mediacall btn_hangup" data-id="<%=userId%>" data-dialog="<%=dialogId%>">'+
          '<img class="btn-icon_mediacall" src="images/icon-hangup.svg" alt="hangup"></button>'+
          '</div></div>')(params);

      return htmlTemplate;
    },

    showError: function() {
      var $chat = $('.l-chat:visible'),
          htmlTemplate = _.template('<article class="message message_service l-flexbox l-flexbox_alignstretch">'+
                        '<span class="message-avatar contact-avatar_message request-button_pending"></span>'+
                        '<div class="message-container-wrap"><div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">'+
                        '<div class="message-content"><h4 class="message-author message-error">Devices are not found</h4></div></div></div></article>');

      $chat.find('.mCSB_container').append(htmlTemplate);

      $('.l-chat:visible .scrollbar_message').mCustomScrollbar("scrollTo", "bottom");
    },

    noWebRTC: function() {
      var $chat = $('.l-chat:visible'),
          htmlTemplate = _.template('<article class="message message_service l-flexbox l-flexbox_alignstretch">'+
                        '<span class="message-avatar contact-avatar_message request-button_pending"></span>'+
                        '<div class="message-container-wrap"><div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">'+
                        '<div class="message-content"><h4 class="message-author message-error">'+
                        'Audio and Video calls aren\'t supported by your browser. Please use Google Chrome, Opera or Firefox.</h4></div></div></div></article>');

      $chat.find('.mCSB_container').append(htmlTemplate);

      $('.l-chat:visible .scrollbar_message').mCustomScrollbar("scrollTo", "bottom");
    }

  };

  return QMHtml;
});
