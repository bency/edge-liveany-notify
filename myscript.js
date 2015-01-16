extid = chrome.i18n.getMessage("@@extension_id")
sound_path = 'chrome-extension://' + extid + '/msn-sound.mp3';
sound_frame = '<audio id="msn-sound" type="audio/mpeg" src="' + sound_path + '" style="display:none;"></audio>';
not_notify = true;
count = 0;
conversation_hash = null;
orig_title = $('title').text();
notification = null
$('body').append(sound_frame);
var htmlEncode = function(value){
    return $('<div/>').text(value).html();
}
$('#ads').ready(function(){
    $('#base').css('right', 0);
    $('#ads').remove();
});
$.post('http://liveany-log.switchnbreak.com/conversation').done( function(ret){
            conversation_hash = ret.hash;
    });
$('#display_area').ready(function(){

    $('#display_area').find('div').first().remove();
});
function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[7].length==11){
        return match[7];
    }else{
        return false;
    }
}
var notifyMe = function (text) {
    document.getElementById('msn-sound').play();
    if (!Notification) {
        alert('Please us a modern version of Chrome, Firefox, Opera or Firefox.');
        return;
    }
    
    notification = new Notification('LiveAny', {
        icon: 'http://www.liveany.com/favicon.ico',
        body: text,
    });
    // 離開的訊息要設定 timeout
    if (text.match(/陌生人離開～～/)) {
        setTimeout(function(){
            notification.close();
        }, 5000);
    }
    
    if (notification) {
        not_notify = false;
    }
    
    notification.onclick = function () {
        not_notify = true;
        window.focus();
        $('#inputText').focus();
    }
}
var enhanceMessage = function() {
    $orig_message = $(this).children().last();
    var $message = $orig_message.clone();
    var date = $message.children().clone();
    var message_text = $message.children().remove().end().text();
    var new_text = htmlEncode(message_text).replace(
            /(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(\?\S*)?(-\S*)?(#\S*)?)/g,
            '<a href="$1" target="_blank" >$1</a>');
    if (youtube_id = youtube_parser(message_text)) {
        new_text = new_text + '<br><iframe width="560" height="315" src="//www.youtube.com/embed/' + youtube_id + '" frameborder="0" allowfullscreen></iframe>';
    }
    var new_message = new_text + '<small>' + date.text() + '</small>';
    if (null !== conversation_hash && conversation_hash.length > 0) {
        $.post(
            'http://liveany-log.switchnbreak.com/dialog',
            {hash: conversation_hash, content: new_text}
        )
    }
    $("#display_area").unbind("DOMSubtreeModified", enhanceMessage);
    $orig_message.html(new_message);
    $("#display_area").bind("DOMSubtreeModified", enhanceMessage);

    // 陌生人訊息
    if (message_text.match(/^陌生人/) && !document.hasFocus()) {

        // 將訊息顯示在標題列上
        $('title').text(message_text);

        // 若還存在上一則提示，則強制關閉
        if (!not_notify) {
            notification.close();
            notification = null;
        }

        notifyMe(message_text);
    }
}
$(document).ready(function() {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // 出現新訊息時的處理
    $("#display_area").bind("DOMSubtreeModified", enhanceMessage);
    $(window).focus(function() {
        if (notification) {
            notification.close();
            $('title').text(orig_title);
        }
    });
});
