let pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight);
let mouse = {
    id: "",
    class: "",
    x: 0,
    y: 0,
};

let keyboard = {
    id: "",
    class: "",
    x: 0,
    y: 0,
    Typed: ""
};


// template do dicionário de interações
let dataDict = {
    type: [],
    time: [],
    class: [],
    id: [],
    x: [],
    y: [],
    value: [],
    scroll: []
};


//Time variables
const timeInterval = 1000;
let freeze = 0;
let clocker = 0;
let eye_tick = 0;
let face_tick = 0;
let send_tick = 0;
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
        storeInter({
            type: 'move',
            x: mouse.x,
            y: mouse.y,
            id: mouse.id,
            class: mouse.class,
            value: null,
        });
    });

    document.addEventListener('wheel', (e) => {
        mouse.id = e.target.id;
        mouse.class = e.target.className;
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        freeze = 0;
        storeInter({
            type: 'wheel',
            x: mouse.x,
            y: mouse.y,
            id: mouse.id,
            class: mouse.class,
            value: null,
        });
    });

    document.addEventListener('click', (e) => {
        mouse.id = e.target.id;
        mouse.class = e.target.className;
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        freeze = 0;
        storeInter({
            type: 'click',
            x: mouse.x,
            y: mouse.y,
            id: mouse.id,
            class: mouse.class,
            value: null,
        });
    });
}

function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        const keyID = e.key;
        let actionTaken = false;
        if (e.key === 'Delete' || e.key === 'Backspace') { // backspace or delete
            keyboard.Typed = keyboard.Typed.slice(0, -1);
            actionTaken = true;
        } else if (e.key === 'Enter') { // enter
            keyboard.id = e.target.id;
            keyboard.class = e.target.className;
            storeInter({
                type: 'keyboard',
                x: mouse.x,
                y: mouse.y,
                id: keyboard.id,
                class: keyboard.class,
                value: { key: keyboard.Typed },
            });
            keyboard.Typed = '';
            actionTaken = true;
        }
        if (actionTaken) {
            const obj = getScreenCoordinates(e.target);
            storeInter({
                type: 'keyboard',
                x: Math.round(obj.x),
                y: Math.round(obj.y),
                id: keyboard.id,
                class: keyboard.class,
                value: { key: keyboard.Typed },
            });
        }
    });

    document.addEventListener('keypress', (e) => {
        const obj = getScreenCoordinates(e.target);
        const char = e.key;
        keyboard.Typed += char;

        if (e.target.id !== keyboard.id) {
            storeInter({
                type: 'keyboard',
                x: Math.round(obj.x),
                y: Math.round(obj.y),
                id: keyboard.id,
                class: keyboard.class,
                value: { key: keyboard.Typed },
            });
            keyboard.Typed = char; // Começa um novo texto digitado
            keyboard.id = e.target.id;
            keyboard.class = e.target.className;
        }
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

                storeInter({
                    type: 'voice',
                    x: mouse.x,
                    y: mouse.y,
                    class: mouse.class,
                    id: mouse.id,
                    value: { text: saidWord },
                });
                chrome.runtime.sendMessage({
                    type: "log",
                    message: saidWord
                }, function (response) {
                    console.log(response.message);
                });
            };

            recognition.onerror = function (event) {
                chrome.runtime.sendMessage({
                    type: "error",
                    message: "Erro no reconhecimento de voz" + event.error
                }, function (response) {
                    console.log(response.message);
                });
            };
        }).catch((error) => {
            chrome.runtime.sendMessage({
                type: "error",
                message: "Erro ao acessar o microfone: " + error.message
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
    startTimer();
}

// Funções temporizadas
function tick() {
    ////console.log(clocker);
    freeze += timeInterval / 1000;
    clocker += timeInterval / 1000;
    eye_tick += timeInterval / 1000;
    face_tick += timeInterval / 1000;
    send_tick += timeInterval / 1000;

    // 3 segundos
    if (freeze >= 3) {
        storeInter({
            type: 'freeze',
            x: mouse.x,
            y: mouse.y,
            class: mouse.class,
            id: mouse.id,
            value: null,
        });
        freeze = 0;
    };

    // 2 segundos
    if (eye_tick >= 2) {
        eye_tick = 0;
        webgazer.setGazeListener(function (data, elapsedTime) {
            if (data == null) {
                return;
            };
            var xprediction = data.x; //these x coordinates are relative to the viewport
            var yprediction = data.y; //these y coordinates are relative to the viewport
            storeInter({
                type: 'eye',
                x: Math.round(xprediction),
                y: Math.round(yprediction),
                class: mouse.class,
                id: mouse.id,
                value: null,
            });
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
                    type: "inferencia",
                    data: imageDataUrl
                }, function (response) {
                    if (chrome.runtime.lastError) {
                        chrome.runtime.sendMessage({
                            type: "error",
                            message: chrome.runtime.lastError.message
                        }, function (resp) {
                            console.log(resp.message);
                        });
                        return;
                    }

                    if (response) {
                        storeInter({
                            type: 'face',
                            x: mouse.x,
                            y: mouse.y,
                            class: mouse.class,
                            id: mouse.id,
                            value: {
                                anger: response.anger,
                                contempt: response.contempt,
                                disgust: response.disgust,
                                fear: response.fear,
                                happy: response.happy,
                                neutral: response.neutral,
                                sad: response.sad,
                                surprise: response.surprise
                            },
                        });
                    }

                    face_tick = 0;
                });
            })
    };

    // 4 segundos
    if (send_tick >= 4) {
        chrome.runtime.sendMessage({
            type: 'sendData',
            data: dataDict,
            pageHeight: pageHeight
        });
        // clear dataDict
        for (var key in dataDict) {
            dataDict[key] = [];
        }
        send_tick = 0;
    }

}

function startTimer() {
    ticker = setInterval(tick, timeInterval)
}

function storeInter(interDict) {
    interDict.time = clocker;
    interDict.scroll = Math.round(document.documentElement.scrollTop);
    // verifica as chaves do dicionário de interações
    for (var key in interDict) {
        dataDict[key].push(interDict[key]); // Adiciona o novo valor à chave correspondente
    };
}

initializeExtension();