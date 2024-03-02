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

let keyboard = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Typed: "",
    Time: 0
};

let emotion = {
    Id: "",
    Class: "",
    X: 0,
    Y: 0,
    Time: 0,
    anger: 0,
    contempt: 0, 
    disgust: 0, 
    fear: 0, 
    happy: 0, 
    neutral: 0, 
    sad: 0, 
    surprise: 0
};

//Time variables
const timeInterval = 1000;
let freeze = 0;
let clocker = 0;
let eye_tick = 0;
let face_tick = 0;
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
        mouse.X = e.pageX;
        mouse.Y = e.pageY;
        freeze = 0;
        sendMessage('move');
    });

    document.addEventListener('wheel', (e) => {
        mouse.id = e.target.id;
        mouse.class = e.target.className;
        mouse.X = e.pageX;
        mouse.Y = e.pageY;
        freeze = 0;
        sendMessage('wheel');
    });

    document.addEventListener('click', (e) => {
        mouse.id = e.target.id;
        mouse.class = e.target.className;
        mouse.X = e.pageX;
        mouse.Y = e.pageY;
        freeze = 0;
        sendMessage('click');
    });
}

function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        const keyID = e.key;
        let actionTaken = false;
        if (e.key === 'Delete' || e.key === 'Backspace') { // backspace or delete
            keyboard.Typed = keyboard.typed.slice(0, -1);
            actionTaken = true;
        } else if (e.key === 'Enter') { // enter
            sendMessage('keyboard');
            keyboard.Typed = '';
            keyboard.id = e.target.id;
            keyboard.class = e.target.className;
            actionTaken = true;
        }
        if (actionTaken) {
            const obj = getScreenCoordinates(e.target);
            keyboard.X = Math.round(obj.x);
            keyboard.Y = Math.round(obj.y);
            sendMessage('keyboard');
        }
    });

    document.addEventListener('keypress', (e) => {
        const obj = getScreenCoordinates(e.target);
        const char = e.key;
        keyboard.Typed += char;

        if (e.target.id !== keyboard.id) {
            sendMessage('keyboard');
            keyboard.Typed = char; // Começa um novo texto digitado
            keyboard.id = e.target.id;
            keyboard.class = e.target.className;
        }

        keyboard.X = Math.round(obj.x);
        keyboard.Y = Math.round(obj.y);
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
        }, function (response) {
            console.log(response.message);
        });
    }
}

function setupMicrophoneListeners() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
            // Cria uma nova instância de reconhecimento de voz
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            let recognition = new SpeechRecognition();

            // Define parâmetros
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'pt-BR';
            recognition.start();

            recognition.onresult = function (event) {
                // Processa os resultados detectados e obtém a última palavra falada
                let resultsLength = event.results.length - 1;
                let arrayLength = event.results[resultsLength].length - 1;
                let saidWord = event.results[resultsLength][arrayLength].transcript;

                if (voice.Spoken !== saidWord) {
                    voice.Spoken = saidWord;
                    chrome.runtime.sendMessage({
                        type: "log",
                        message: saidWord
                    }, function (response) {
                        console.log(response.message);
                    });
                    sendMessage('voice', saidWord); // Envia a palavra falada
                }
            };

            recognition.onerror = function (event) {
                chrome.runtime.sendMessage({
                    type: "error",
                    message: "Erro no reconhecimento de voz"
                }, function (response) {
                    console.log(response.message);
                });
            };
        }).catch((error) => {
            chrome.runtime.sendMessage({
                type: "error",
                message: "Erro ao acessar o microfone"
            }, function (response) {
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
            webgazer.begin().then(function () {
                setupWebGazerVideo();
            });
        } else {
            chrome.runtime.sendMessage({
                type: "error",
                message: "Câmera desabilitada ou não acessível, verifique as configurações do sistema."
            }, function (response) {
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
            }, function (response) {
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

function startAgain() {
    chrome.runtime.sendMessage(
        {
            type: "solicita"
        }
    );
}

// Funções temporizadas
function tick() {
    ////console.log(clocker);
    freeze += timeInterval / 1000;
    clocker += timeInterval / 1000;
    eye_tick += timeInterval / 1000;
    face_tick += timeInterval / 1000;

    // 3 segundos
    if (freeze >= 3) {
        sendMessage('freeze');
        freeze = 0;
    };

    // 5 segundos
    if (eye_tick >= 5) {
        eye_tick = 0;
        webgazer.setGazeListener(function (data, elapsedTime) {
            if (data == null) {
                return;
            };
            var xprediction = data.x; //these x coordinates are relative to the viewport
            var yprediction = data.y; //these y coordinates are relative to the viewport
            eye.x = Math.round(xprediction);
            eye.y = Math.round(yprediction);
            sendMessage('eye');
        }).begin();
    };

    // 10 segundos
    if (face_tick >= 10) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(async function (stream) {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                // Espera o vídeo estar pronto para ser exibido
                await new Promise(resolve => video.onloadedmetadata = () => resolve());
                // Captura o frame
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);

                // Pode-se parar o stream se desejar
                stream.getTracks().forEach(track => track.stop());
                let imageDataUrl = canvas.toDataURL('image/png');
                chrome.runtime.sendMessage({
                    type: 'inferencia',
                    data: imageDataUrl
                });
            })
    };
}

function startTimer() {
    ticker = setInterval(tick, timeInterval)
}

function sendMessage(type) {
    var data = {};
    if (type == "keyboard") {
        data = keyboard;
        if (data.X == 0 && data.Y == 0) {
            data.Id = mouse.Id;
            data.Class = mouse.Class;
            data.X = Math.round(mouse.X);
            data.Y = Math.round(mouse.Y);
        }
    } else if (type == "voice") {
        data = voice;
        if (data.X == 0 && data.Y == 0) {
            data.Id = mouse.Id;
            data.Class = mouse.Class;
            data.X = Math.round(mouse.X);
            data.Y = Math.round(mouse.Y);
        }
    } else if (type == "face") {
        data = emotion;
        if (data.X == 0 && data.Y == 0) {
            data.Id = mouse.Id;
            data.Class = mouse.Class;
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
        };
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "inferencia") {
        if (request.sucess === true) {
            emotion.anger = request.data[0];
            emotion.contempt = request.data[1];
            emotion.disgust = request.data[2];
            emotion.fear = request.data[3];
            emotion.happy = request.data[4];
            emotion.neutral = request.data[5];
            emotion.sad = request.data[6];
            emotion.surprise = request.data[7];
            sendMessage("face")
        } else {
            emotion.anger = 0;
            emotion.contempt = 0;
            emotion.disgust = 0;
            emotion.fear = 0;
            emotion.happy = 0;
            emotion.neutral = 0;
            emotion.sad = 0;
            emotion.surprise = 0;
            sendMessage("face")
        }
    }
});

initializeExtension();