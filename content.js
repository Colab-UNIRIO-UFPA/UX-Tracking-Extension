var pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight);
var overId = "";
var overClass = "";
var mouse = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Typed: "",
    Time: 0
};

var voice = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Time: 0,
    Spoken: ""
};

var eye = {
    x: 512,
    y: 256
};

var lastX = 0;
var lastY = 0;

var typing = false;
var keyboard = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Typed: "",
    Time: 0
};
var lastKeyId = "";

var freeze = 0;
var WebTracer_time = 0;

function GetScreenCordinates(obj) {
    var p = {};
    if (obj == null || (typeof obj == 'undefined')) {
        p.x = 0;
        p.y = 0;
        return p;
    }
    p.x = obj.offsetLeft;
    p.y = obj.offsetTop;
    while (obj.offsetParent) {
        p.x = p.x + obj.offsetParent.offsetLeft;
        p.y = p.y + obj.offsetParent.offsetTop;
        if (obj == document.getElementsByTagName("body")[0]) {
            break;
        }
        else {
            obj = obj.offsetParent;
        }
    }
    return p;
}

function startAgain() {
    chrome.runtime.sendMessage(
        {
            type: "solicita"
        }
    );
}

function tick() {
    ////console.log(WebTracer_time);
    freeze += 0.5
    WebTracer_time += 0.2
    if (freeze == 1) {
        sendMessage('freeze')
        freeze = 0
        //console.log("freeze at "+overId+" // "+overClass);
    }
    EyeTime += 1
    if (EyeTime > 0) {
        sendMessage('eye')
        EyeTime = 0
    }
}

function startTimer(secs) {
    secTime = parseInt(secs)
    ticker = setInterval(tick, 200)
}

browser.storage.sync.get(['mouse']).then((result) => {
    if (result && result.mouse) {
        document.addEventListener('mousemove', function (e) {
            mouse.X = e.pageX
            mouse.Y = e.pageY
            freeze = 0
            sendMessage('move')
            if (typing) {
                sendMessage('keyboard')
                keyboard.Typed = ''
                keyboard.Id = e.target.id
                keyboard.Class = e.target.className
                typing = false
            }
        })

        document.addEventListener('mouseover', function (e) {
            mouse.Id = e.target.id
            mouse.Class = e.target.className
        })

        document.addEventListener('mouseout', function (e) {
            mouse.Id = ''
            mouse.Class = ''
        })

        document.addEventListener('wheel', function (e) {
            mouse.Id = e.target.id
            mouse.Class = e.target.className
            //console.log("wheel " + e.pageX + " | " + e.pageY);
            mouse.X = e.pageX
            mouse.Y = e.pageY
            freeze = 0
            sendMessage('wheel')
        })

        $(window).on('navigate', function (event, data) {
            var direction = data.state.direction
            sendMessage(direction)
            //back, forward
        })

        document.addEventListener('click', function (e) {
            mouse.Id = e.target.id
            mouse.Class = e.target.className
            //console.log("click " + e.pageX + " | " + e.pageY);
            mouse.X = e.pageX
            mouse.Y = e.pageY
            freeze = 0
            if (typing) {
                sendMessage('keyboard')
                keyboard.Typed = ''
                keyboard.Id = e.target.id
                keyboard.Class = e.target.className
                typing = false
            }
            sendMessage('click')
        })
    }
})

browser.storage.sync.get(['keyboard']).then((result) => {
    if (result && result.keyboard) {
        document.addEventListener('keydown', KeyCheck)
        function KeyCheck(event) {
            var KeyID = event.keyCode
            switch (KeyID) {
                case 8:
                    //backspace
                    keyboard.Typed = keyboard.Typed.slice(0, -1)
                    break
                case 46:
                    //delete
                    keyboard.Typed += '-!-'
                    break
                case 13:
                    sendMessage('keyboard')
                    keyboard.Typed = ''
                    keyboard.Id = e.target.id
                    keyboard.Class = e.target.className
                    break
                default:
                    break
            }
        }

        document.onkeypress = function (e) {
            typing = true
            var obj = GetScreenCordinates(e.target)
            console.log(
                (e.target.id ? 'Press id ' + e.target.id : '') +
                ' pos ' +
                obj.x +
                ' | ' +
                obj.y
            )
            var get = window.event ? event : e
            var key = get.keyCode ? get.keyCode : get.charCode
            key = String.fromCharCode(key)
            if (e.target.id != keyboard.Id) {
                sendMessage('keyboard')
                keyboard.Typed = ''
                keyboard.Id = e.target.id
                keyboard.Class = e.target.className
            } else {
                keyboard.X = Math.round(obj.x)
                keyboard.Y = Math.round(obj.y)
            }
            keyboard.Typed += key
            keyboard.Typed.replace(/(?:\r\n|\r|\n)/g, ' - ')
            console.log(keyboard.Typed)
        }

        $(document).mouseover(function (e) {
            overId = e.target.id
            overClass = e.target.className
        })
    }
})

var EyeTime = 0;

startAgain();
startTimer();

function sendEye(x, y) {
    eye.x = Math.round(x);
    eye.y = Math.round(y);
}
browser.storage.sync.get(['microphone']).then((result) => {
    if (result && result.microphone) {
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            // new instance of speech recognition
            var recognition = new webkitSpeechRecognition()
            // set params
            recognition.continuous = true
            recognition.interimResults = false
            recognition.lang = 'pt-BR'
            recognition.start()
            recognition.onresult = function (event) {
                // delve into words detected results & get the latest
                // total results detected
                var resultsLength = event.results.length - 1
                // get length of latest results
                var ArrayLength = event.results[resultsLength].length - 1
                // get last word detected
                var saidWord = event.results[resultsLength][ArrayLength].transcript
                if (voice.spoken != saidWord) {
                    voice.spoken = saidWord
                    console.log(saidWord)
                    //save_speech();
                    sendMessage('voice')
                }
            }

            recognition.onerror = function (event) { }
        });
    }
})

function sendMessage(type) {
    var data = {};
    if (type == "keyboard") {
        data = keyboard;
        if (data.X == 0 && data.Y == 0) {
            data.X = Math.round(mouse.X);
            data.Y = Math.round(mouse.Y);
        }
    } else if (type == "voice") {
        data = voice;
        if (data.X == 0 && data.Y == 0) {
            data.X = Math.round(mouse.X);
            data.Y = Math.round(mouse.Y);
        }
    } else {
        data = {
            Id: mouse.Id,
            Class: mouse.Class,
            X: mouse.X,
            Y: mouse.Y,
            Typed: mouse.Typed,
            Time: mouse.Time
        };
        if (type == "eye") {
            data.X = Math.round(eye.x);
            data.Y = Math.round(eye.y);
        }
    }
    data.Time = WebTracer_time;
    data.imageName = "";
    data.pageHeight = Math.round(pageHeight);
    data.pageScroll = Math.round(document.documentElement.scrollTop);
    data.url = document.URL;
    data.mouseId = overId;
    data.mouseClass = overClass;
    //data.Typed = data.Typed.replace(/(?:\r\n|\r|\n)/g, " - ");
    //console.log("message send "+type);
    chrome.runtime.sendMessage({
        type: type,
        data: data
    });

}
