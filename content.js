let pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight);
let overId = "";
let overClass = "";
let mouse = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Typed: "",
    Time: 0
};

let voice = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Time: 0,
    Spoken: ""
};

let eye = {
    x: 512,
    y: 256
};

let lastX = 0;
let lastY = 0;

let typing = false;
let keyboard = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Typed: "",
    Time: 0
};
let lastKeyId = "";

//Time variables
const timeInterval = 200;
let freeze = 0;
let clocker = 0;
let eye_tick = 0;
let ticker;

function getScreenCoordinates(obj) {
    if (!obj) {
        return { x: 0, y: 0 };
    }
    let posX = obj.offsetLeft;
    let posY = obj.offsetTop;
    while (obj.offsetParent) {
        posX += obj.offsetParent.offsetLeft;
        posY += obj.offsetParent.offsetTop;
        if (obj === document.body) break;
        obj = obj.offsetParent;
    }
    return { x: posX, y: posY };
}


function setupMouseListeners() {
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        freeze = 0;
        sendMessage('move');
    });

    document.addEventListener('mouseover', (e) => {
        mouse.id = e.target.id;
        mouse.class = e.target.className;
        overId = e.target.id;
        overClass = e.target.className;
        sendMessage('mouseover');
    });

    document.addEventListener('mouseout', (e) => {
        mouse.id = '';
        mouse.class = '';
        sendMessage('mouseout');
    });

    document.addEventListener('wheel', (e) => {
        mouse.id = e.target.id;
        mouse.class = e.target.className;
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        freeze = 0;
        sendMessage('wheel');
    });

    document.addEventListener('click', (e) => {
        mouse.id = e.target.id;
        mouse.class = e.target.className;
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        freeze = 0;
        if (typing) {
            sendMessage('keyboard');
            keyboard.typed = '';
            keyboard.id = e.target.id;
            keyboard.class = e.target.className;
            typing = false;
        }
        sendMessage('click');
    });
}

function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        const keyID = e.keyCode;
        let actionTaken = false;
        if (keyID === 8 || keyID === 46) { // backspace or delete
            keyboard.typed = keyboard.typed.slice(0, -1);
            actionTaken = true;
        } else if (keyID === 13) { // enter
            sendMessage('keyboard');
            keyboard.typed = '';
            keyboard.id = e.target.id;
            keyboard.class = e.target.className;
            actionTaken = true;
        }
        if (actionTaken) {
            const obj = getScreenCoordinates(e.target);
            keyboard.x = Math.round(obj.x);
            keyboard.y = Math.round(obj.y);
            sendMessage('keydown');
        }
    });

    document.addEventListener('keypress', (e) => {
        typing = true;
        const obj = getScreenCoordinates(e.target);
        const char = String.fromCharCode(e.which);
        keyboard.typed += char;

        if (e.target.id !== keyboard.id) {
            sendMessage('keyboard');
            keyboard.typed = char; // Começa um novo texto digitado
            keyboard.id = e.target.id;
            keyboard.class = e.target.className;
        }

        keyboard.x = Math.round(obj.x);
        keyboard.y = Math.round(obj.y);
        sendMessage('keypress');
    });
}

function setupWebGazerVideo() {
    var video = document.getElementById('webgazerVideoFeed');
    if (video) {
        video.style.display = 'none';
        video.style.position = 'absolute';
        video.style.top = topDist;
        video.style.left = leftDist;
        video.width = width;
        video.height = height;
        video.style.margin = '0px';

        webgazer.params.imgWidth = width;
        webgazer.params.imgHeight = height;
    } else {
        chrome.runtime.sendMessage({
            type: "error",
            message: 'Elemento de vídeo do WebGazer não encontrado.'
          }, function(response) {
            console.log(response.message);
          });
    }
}

function setupMicrophoneListeners() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            // Cria uma nova instância de reconhecimento de voz
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            let recognition = new SpeechRecognition();

            // Define parâmetros
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'pt-BR';
            recognition.start();

            recognition.onresult = function(event) {
                // Processa os resultados detectados e obtém a última palavra falada
                let resultsLength = event.results.length - 1;
                let arrayLength = event.results[resultsLength].length - 1;
                let saidWord = event.results[resultsLength][arrayLength].transcript;

                if (voice.Spoken !== saidWord) {
                    voice.Spoken = saidWord;
                    chrome.runtime.sendMessage({
                        type: "log",
                        message: saidWord
                      }, function(response) {
                        console.log(response.message);
                      });
                    sendMessage('voice', saidWord); // Envia a palavra falada
                }
            };

            recognition.onerror = function(event) {
                chrome.runtime.sendMessage({
                    type: "error",
                    message: "Erro no reconhecimento de voz"
                  }, function(response) {
                    console.log(response.message);
                  });
            };
        }).catch((error) => {
            chrome.runtime.sendMessage({
                type: "error",
                message: "Erro ao acessar o microfone"
              }, function(response) {
                console.log(response.message);
              });
        });
}


function setupEventListeners() {
    browser.storage.sync.get(['mouse']).then((result) => {
        if (result.mouse) {
            setupMouseListeners();
        }
    });

    browser.storage.sync.get(['keyboard']).then((result) => {
        if (result.keyboard) {
            setupKeyboardListeners();
        }
    });

    browser.storage.sync.get(['camera']).then((result) => {
        if (result.camera) {
            webgazer.begin().then(function() {
                setupWebGazerVideo();
            });
        } else {
            chrome.runtime.sendMessage({
                type: "error",
                error: "CameraDisabled",
                message: "Câmera desabilitada ou não acessível, verifique as configurações do sistema."
              }, function(response) {
                console.log(response.message);
              });
        }
    });

    browser.storage.sync.get(['microphone']).then((result) => {
        if (result.microphone) {
            setupMicrophoneListeners();
        } else {
            chrome.runtime.sendMessage({
                type: "error",
                message: "Microfone desabilitado nas configurações ou reconhecimento de voz não suportado neste navegador."
              }, function(response) {
                console.log(response.message);
              });
        }
    });
}

function initializeExtension() {
    setupEventListeners();
    startAgain();
    startTimer();
}

/////////////////////////////////////////////////

function startAgain() {
    chrome.runtime.sendMessage(
        {
            type: "solicita"
        }
    );
}

function tick() {
    ////console.log(clocker);
    freeze += timeInterval/1000
    clocker += timeInterval/1000
    eye_tick += timeInterval/1000
    if (freeze >= 1) {
        sendMessage('freeze')
        freeze = 0
    }

    if (eye_tick >= 1) {
        eye_tick = 0;
        var prediction = webgazer.getCurrentPrediction();
        if (prediction) {
            var x = prediction.x;
            var y = prediction.y;
            eye.x = Math.round(x);
            eye.y = Math.round(y);
            sendMessage('eye')
        }
    }
}

function startTimer() {
    ticker = setInterval(tick, timeInterval)
}


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
    data.Time = clocker;
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

initializeExtension();