not_notify = true;
notification = null
$('#ads').ready(function(){
    $('#base').css('right', 0);
    $(this).remove();
})
$('#display_area').ready(function(){
    $('#display_area > div').remove();
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
        if (notification.body.match(/陌生人離開～～/)) {
            $('title').text('陌生人已離開');
        }
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
            if (!not_notify) {
                notification.close();
                notification = null;
            }
            if (message.match(/陌生人離開～～/)) {
                $('title').text('陌生人已離開');
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
