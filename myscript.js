not_notify = true;
orig_title = $('title').text();
notification = null
$('#ads').ready(function(){
    $('#base').css('right', 0);
    $('#ads').remove();
});
$('#display_area').ready(function(){
    $('#display_area').find('div').first().remove();
});
var notifyMe = function (text) {
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
    var new_text = message_text.replace(
            /(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(\?\S*)?(#\S*)?)/g,
            '<a href="$1" target="_blank" >$1</a>');
    var new_message = new_text + '<small>' + date.text() + '</small>';
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
