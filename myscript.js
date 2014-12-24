not_notify = true;
notification = null
$('#ads').ready(function(){
    $('#base').css('right', 0);
    $('#ads').remove();
})
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
    
    if (notification) {
        not_notify = false;
    }
    
    notification.onclick = function () {
        not_notify = true;
        window.focus();
        $('#inputText').focus();
    }
}
$(document).ready(function() {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    $("#display_area").bind("DOMSubtreeModified", function() {
        message = $(this).children().last().clone().children().remove().end().text();
        if (message.match(/^陌生人/) && !document.hasFocus()) {

            // 將訊息顯示在標題列上
            $('title').text(message);

            if (!not_notify) {
                notification.close();
                notification = null;
            }
            if (message.match(/陌生人離開～～/)) {
                setTimeout(function(){
                    if (notification) {
                        notification.close();
                    }
                }, 5000);
            }
            notifyMe(message);
        }
    });
    $(window).focus(function() {
        if (notification) {
            notification.close();
        }
    })
});
