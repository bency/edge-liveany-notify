extid = chrome.i18n.getMessage("@@extension_id")
userId = checkCookie();
not_notify = true;
conversation_hash = null;
orig_title = $('title').text();
notification = null
connected = false;
DOMAIN = 'http://liveany-log.switchnbreak.com';
matched = false;
dialogCount = 0;
version = 0;
platform = null;

(function () {
    $.get(chrome.extension.getURL('manifest.json')).done(function(data, status){
        manifest = JSON.parse(data);
        version = manifest.version;
    });
})();
window.uploadPhotos = function() {

    // Read in file
    var file = event.target.files[0];

    // Ensure it's an image
    if(file.type.match(/image.*/)) {

        // Load the image
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
            var base64 = readerEvent.target.result.replace(/.*,/, '');
            $.ajax({
                url: 'https://api.imgur.com/3/image',
                headers: {
                    'Authorization': 'Client-ID a5314187be28198'
                },
                type: 'POST',
                data: {
                    'image': base64,
                    'type': 'base64'
                },
                success: function(ret, status) {
                    if ('success' != status) {
                        return;
                    }
                    var url = ret.data.link;
                    $('#inputText').val(url);
                    $('#sendMessageButton').click();
                }
            });
        }
        reader.readAsDataURL(file);
    }
}

function extLocalStorage (namespace){
    var localStorage = window.localStorage || {};
    if(typeof namespace !== "string") {
        throw new Error("extLocalStorage: Namespace must be a string");
    }
    var getRealKey = function(key){
        return [namespace,".",key].join('');
    };
    var mainFunction = function(key, value){
        var realKey = getRealKey(key);
        if (value === undefined) {
            return localStorage[realKey];
        } else {
            return localStorage[realKey] = value;
        }
    };
    mainFunction.remove = function(key){
        var realKey = getRealKey(key);
        delete localStorage[realKey];
    };
    return mainFunction;
};


function getRandomToken () {
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

function setCookie (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function checkCookie () {
    var user = getCookie("liveany_log");
    if (user == "") {
        var id = getRandomToken();
        setCookie("liveany_log", id, 365);
    }
    return getCookie("liveany_log");
}

function htmlEncode (value){
    return $('<div/>').text(value).html();
}

var youtube_parser = function(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11) ? match[7] : false;
}
var notifyMe = function (text) {
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
var getConversationHash = function(ret, cb) {
        conversation_hash = ret.hash;
        socket.emit('login', {user: userId, conversation: conversation_hash, version: version});
        connected = true;
        if (cb) {cb();}
}

var newConnection = function(cb) {
    var count = $('#nowcounts').text();
    $.post(DOMAIN + '/conversation', {user_id: userId, count: count}).done(function(ret){
        getConversationHash(ret, cb);
    });
}

var embedOjbect = function (text) {

    var linkMatch = /(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/;
    var imgMatch = /(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(jpe?g|png|gif)(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/;

    if (match = text.match(imgMatch)) {
        text = text.replace(/(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(jpe?g|png|gif)(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/g, '<a href="$1" target="_blank" >$1</a><br><img width="560" img-rounded" src="$1"><br>');
    }
    if (match = text.match(linkMatch)) {
        text = text.replace(/(https?:\/\/[\w-\.]+(:\d+)?(\/[\w\/\.]*)?(\?\S*)?(-\S*)?(%\S*)?(#\S*)?)/g, '<a href="$1" target="_blank" >$1</a>');
    }
    if (youtube_id = youtube_parser(text)) {
        text = text + '<br><iframe width="560" height="315" src="//www.youtube.com/embed/' + youtube_id + '" frameborder="0" allowfullscreen></iframe>';
    }
    return text;
}

var enhanceMessage = function() {
    $orig_message = $(this).children().last();
    var $message = $orig_message.clone();
    var className = $message[0].className;
    if ('clear' == className) {
        return;
    }
    var date = $message.children().clone();
    if (1 > date.length) {
        return;
    }
    var message_text = $message.children().remove().end().text();
    var new_text = htmlEncode(message_text);
    var match = null;
    dialogCount++;
    var message_type = 'system';
    new_text = embedOjbect(new_text);
    var new_message = new_text + '<small>' + date[0].innerHTML + '</small>';
    if (null !== conversation_hash && conversation_hash.length > 0) {
        if (className.match(/left/)) {
            message_type = 'stranger';
        } else if (className.match(/right/)) {
            message_type = 'me';
        }
        $.post(
            DOMAIN + '/dialog',
            {hash: conversation_hash, content: new_text, message_type: message_type}
        )
    }
    $(this).unbind("DOMSubtreeModified", enhanceMessage);
    $orig_message.html(new_message);
    $(this).bind("DOMSubtreeModified", enhanceMessage);

    platform = platform || (date.text().split(' ')[1]);
    // 陌生人訊息
    if ('system' == message_type && !document.hasFocus()) {

        // 將訊息顯示在標題列上
        $('title').text(message_text);

        // 若還存在上一則提示，則強制關閉
        if (!not_notify && notification) {
            notification.close();
            notification = null;
        }

        var L = extLocalStorage(conversation_hash);
        (L('notification') === "1") ? notifyMe(message_text) : null;
        document.getElementById('msn-sound').play();
    }
    (matched || dialogCount < 10 || platform !== "web") ? socket.emit('show message', new_text) : socket.emit('compare message', new_text);
}
Config = new function () {
    this.setUnMute = function(){
        $('#mute').find('span').removeClass('glyphicon-volume-off').addClass('glyphicon-volume-up');
        var L = extLocalStorage(conversation_hash);
        document.getElementById('msn-sound').volume = L('volume');
        $('#volume').val(L('volume'));
        var Last = extLocalStorage('LastStatus');
        Last('last_volume', L('volume'));
    }

    this.setMute = function(){
        $('#mute').find('span').removeClass('glyphicon-volume-up').addClass('glyphicon-volume-off');
        var L = extLocalStorage(conversation_hash);
        L('volume', $('#volume').val());
        document.getElementById('msn-sound').volume = 0;
        $('#volume').val(0);
        var Last = extLocalStorage('LastStatus');
        Last('last_volume', 0);
    }

    this.setNotification = function(){
        $('#notification_btn').find('span').removeClass('glyphicon-remove').addClass('glyphicon-ok');
        var L = extLocalStorage(conversation_hash);
        L('notification', 1);
        var Last = extLocalStorage('LastStatus');
        Last('notification', 1);
    }

    this.setNoNotification = function(){
        $('#notification_btn').find('span').removeClass('glyphicon-ok').addClass('glyphicon-remove');
        var L = extLocalStorage(conversation_hash);
        L('notification', 0);
        var Last = extLocalStorage('LastStatus');
        Last('notification', 0);
    }
}

var init = function () {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    var Last = extLocalStorage('LastStatus');
    if (Last('last_volume') === undefined || !isFinite(Last('last_volume'))) {
        Last('last_volume', 0.5);
    }

    for (var key in localStorage) {
        if (local_match = key.match(/[A-Z0-9]{32,32}/)) {
            delete localStorage[key];
        }
    }

    // append sound element
    sound_path = 'chrome-extension://' + extid + '/msn-sound.mp3';
    sound_frame = '<audio id="msn-sound" type="audio/mpeg" src="' + sound_path + '" style="display:none;"></audio>';
    $('body').append(sound_frame);

    var btns = '<div style="float:right;top:0px">'
    + '<div class="btn-group" id="panel">'
    + '<input id="volume" type="range" min="0" max="1" step="0.1" value="0.5"/>'
    + '<button class="btn btn-default disabled" id="mute"><span class="glyphicon glyphicon-volume-up"></span> 音效</button>'
    + '<button class="btn btn-default disabled" id="notification_btn"><span class="glyphicon glyphicon-ok"></span> 彈出通知</button>'
    + '<div class="btn btn-primary" style="position: relative; overflow: hidden;">'
    + '<span>Upload</span>'
    + '<input id="uploadPhoto" name="files[]" type="file" style="position: absolute; top: 0; right: 0; margin: 0; padding: 0; font-size: 20px; cursor: pointer; opacity: 0; filter: alpha(opacity=0);">'
    + '</div>'
    + '</div>'
    + '<div class="input-group" style="width:240px">'
    + '<div class="input-group-addon">發語詞</div>'
    + '<input id="auto-send" class="form-control" type="text">'
    + '</div>';
    + '</div>';
    $('body').append(btns);
    var L = extLocalStorage(conversation_hash);
    var Last = extLocalStorage('LastStatus');
    L('mute', Last('mute'));
    L('notification', Last('notification'));
    document.getElementById('msn-sound').volume = Last('last_volume');
    $('#volume').val(Last('last_volume'));
    (L('notification') == "1") ? Config.setNotification() : Config.setNoNotification();
    $('#mute').removeClass('disabled');
    $('#notification_btn').removeClass('disabled');

    if ($('#auto-send').val() && $('#auto-send').val().length > 0) {
        $('#inputText').val($('#auto-send').val());
        $('#sendMessageButton').click();
    }

    // 出現新訊息時的處理
    $("#chat_area").bind("DOMSubtreeModified", enhanceMessage);

    $(window).bind('focus',function() {
        (notification) ? notification.close() : null;
    });

    $('body').on('click', '#mute', function(){
        ($(this).find('span.glyphicon-volume-off').length > 0) ? Config.setUnMute() :  Config.setMute();
    });

    $('body').on('click', '#notification_btn', function(){
        ($(this).find('span.glyphicon-ok').length > 0) ? Config.setNoNotification() : Config.setNotification();
    });

    $('body').on('change', '#uploadPhoto', uploadPhotos);

    $('body').on('change', '#volume', function(){
        var volume = $(this).val();
        document.getElementById('msn-sound').volume = volume;
        var Last = extLocalStorage('LastStatus');
        Last('last_volume', volume);
        if (volume == 0) {
            $('#mute').find('span').removeClass('glyphicon-volume-up').addClass('glyphicon-volume-off');
        } else {
            $('#mute').find('span').removeClass('glyphicon-volume-off').addClass('glyphicon-volume-up');
        }
    });
    var pre_send = Last('pre_send');

    if (pre_send.length > 0) {
        $('#auto-send').val(pre_send);
    }

    var part_pre_send;
    for (i = 1, part_pre_send = pre_send.substr(0, 100); part_pre_send.length > 0; part_pre_send = pre_send.substr(i * 100, 100), i++) {
        $('#inputText').val(part_pre_send);
        $('#sendMessageButton').click();
    }

    // 移除廣告
    $('#chat_area').find('div').first().remove();
    $('#auto-send').bind('keyup', function(){
        pre_send = $(this).val();
        Last('pre_send', pre_send);
    });
}

socket = io(DOMAIN + ':55688/');
socket.on('disconnect', function(){
    connected = false;
});

socket.on('connect', function(){
    if (!connected && conversation_hash) {
        this.emit('login', {user: userId, conversation: conversation_hash});
        connected = true;
    }
});

socket.on('matched', function(){
    matched = true;
    //$('#sendMessageButton').removeClass('btn-default').addClass('btn-info');
});

newConnection(init);
