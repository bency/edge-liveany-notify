var getRandomToken = function() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex.substring(0, 32);
}

var setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

var getCookie = function (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

var checkCookie = function() {
    var user = getCookie("liveany_log");
    if (user == "") {
        var id = getRandomToken();
        setCookie("liveany_log", id, 365);
    }
    return getCookie("liveany_log");
}

var htmlEncode = function(value){
    return $('<div/>').text(value).html();
}

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
        icon: 'chrome-extension://' + extid + '/64.png',
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

var newConnection = function() {
    var userId = checkCookie();
    var count = $('#nowcounts').text();
    $.post('http://liveany-log.switchnbreak.com/conversation', {user_id: userId, count: count}).done( function(ret){
        conversation_hash = ret.hash;
    });
}

var enhanceMessage = function() {
    $orig_message = $(this).children().last();
    var $message = $orig_message.clone();
    var date = $message.children().clone();
    var message_text = $message.children().remove().end().text();
    var new_text = htmlEncode(message_text);
    var linkMatch = /(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/;
    var imgMatch = /(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(jpe?g|png|gif)(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/;
    var connectedMatch = /連線成功，正等著陌生人/;
    var match = null;
    if (new_text.match(connectedMatch)) {
        newConnection();
    }
    if (match = new_text.match(imgMatch)) {
        new_text = new_text.replace(/(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(jpe?g|png|gif)(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/g, '<a href="$1" target="_blank" >$1</a><br><img width="560" img-rounded" src="$1"><br>');
    } else if (match = new_text.match(linkMatch)) {
        new_text = new_text.replace(/(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/g, '<a href="$1" target="_blank" >$1</a>');
    }
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

if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

extid = chrome.i18n.getMessage("@@extension_id")
sound_path = 'chrome-extension://' + extid + '/msn-sound.mp3';
sound_frame = '<audio id="msn-sound" type="audio/mpeg" src="' + sound_path + '" style="display:none;"></audio>';
not_notify = true;
conversation_hash = null;
orig_title = $('title').text();
notification = null
$('body').append(sound_frame);

// 出現新訊息時的處理
$("#display_area").bind("DOMSubtreeModified", enhanceMessage);

$(window).bind('focus',function() {
    if (notification) {
        notification.close();
        $('title').text(orig_title);
    }
});

$('#base').css('right', 0);
$('#ads').remove();
$('#display_area').find('div').first().remove();
