// Obter a altura da página
const pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight);

// Inicializar variáveis de mouse e teclado
let mouse = { id: "", class: "", x: 0, y: 0 };
let keyboard = { id: "", class: "", x: 0, y: 0, Typed: "" };

// Template do dicionário de interações
let dataDict = { type: [], time: [], class: [], id: [], x: [], y: [], value: [], scroll: [] };

// Variáveis de tempo
const timeInterval = 1000;
let freeze = 0, clocker = 0, eye_tick = 0, face_tick = 0, send_tick = 0;

// Função para obter coordenadas da tela
function getScreenCoordinates(obj) {
    let posX = 0, posY = 0;
    while (obj) {
        posX += obj.offsetLeft;
        posY += obj.offsetTop;
        obj = obj.offsetParent;
    }
    return { x: posX, y: posY };
}

// Função para adicionar evento de interações
function storeInter(interDict) {
    interDict.time = clocker;
    interDict.scroll = Math.round(document.documentElement.scrollTop);
    Object.keys(interDict).forEach(key => dataDict[key].push(interDict[key]));
}

// Configurar ouvintes de mouse
function setupMouseListeners() {
    document.addEventListener('mousemove', throttle(storeMouseData, 300));
    document.addEventListener('click', storeMouseData);
}
// Configurar ouvintes de teclado
function setupKeyboardListeners() {
    document.addEventListener('keydown', handleKeyDown);
}

function storeMouseData(e) {
    mouse.id = e.target.id;
    mouse.class = e.target.className;
    mouse.x = e.pageX;
    mouse.y = e.pageY;
    storeInter({
        type: e.type,
        x: mouse.x,
        y: mouse.y,
        id: mouse.id,
        class: mouse.class,
        value: null
    });
}

function handleKeyDown(e) {
    if (e.key.length === 1) keyboard.typed += e.key;
    if (e.key === 'Enter' || e.key === 'Backspace') {
        storeInter({
            type: 'keyboard',
            x: mouse.x,
            y: mouse.y,
            id: keyboard.id,
            class: keyboard.class,
            value: { key: keyboard.typed }
        });
        keyboard.typed = '';
    }
}

function throttle(callback, limit) {
    let waiting = false;
    return function () {
        if (!waiting) {
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
}

// Configurar ouvintes de WebGazer
function setupWebGazerVideo() {
    let video = document.getElementById('webgazerVideoFeed');
    if (!video) {
        video = document.createElement('video');
        video.id = 'webgazerVideoFeed';
        document.body.appendChild(video);
    }

    Object.assign(video.style, {
        display: 'none',
        position: 'absolute',
        top: '0px',  // Defina conforme necessário
        left: '0px', // Defina conforme necessário
        width: '320px', // Defina conforme necessário
        height: '240px' // Defina conforme necessário
    });

    // Configure webgazer aqui, se necessário
    if (typeof webgazer !== 'undefined') {
        webgazer.setGazeListener(function (data, elapsedTime) {
            if (data) {
                storeInter({
                    type: 'eye',
                    x: Math.round(data.x),
                    y: Math.round(data.y),
                    class: mouse.class,
                    id: mouse.id,
                    value: null
                });
            }
        }).begin();
    }
}


// Configurar ouvintes de microfone
function setupMicrophoneListeners() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'pt-BR';
            recognition.start();

            recognition.onresult = event => {
                const saidWord = event.results[event.results.length - 1][0].transcript;
                storeInter({
                    type: 'voice',
                    x: mouse.x,
                    y: mouse.y,
                    class: mouse.class,
                    id: mouse.id,
                    value: { text: saidWord },
                });
            };

            recognition.onerror = event => console.error("Erro no reconhecimento de voz: " + event.error);
        })
        .catch(error => console.error("Erro ao acessar o microfone: " + error.message));
}

// Configurar ouvintes de eventos
function setupEventListeners() {
    const settings = ['mouse', 'keyboard', 'camera', 'microphone'];
    settings.forEach(setting => {
        browser.storage.sync.get([setting]).then(result => {
            if (result[setting]) {
                if (setting === 'mouse') setupMouseListeners();
                if (setting === 'keyboard') setupKeyboardListeners();
                if (setting === 'camera') webgazer.begin().then(setupWebGazerVideo);
                if (setting === 'microphone') setupMicrophoneListeners();
            } else {
                console.error(`${setting} desabilitado ou não acessível.`);
            }
        });
    });
}

// Inicializar a extensão
function initializeExtension() {
    setupEventListeners();
    setInterval(tick, timeInterval);
}

// Funções temporizadas
function tick() {
    freeze += timeInterval / 1000;
    clocker += timeInterval / 1000;
    eye_tick += timeInterval / 1000;
    face_tick += timeInterval / 1000;
    send_tick += timeInterval / 1000;

    if (freeze >= 3) {
        storeInter({ type: 'freeze', x: mouse.x, y: mouse.y, id: mouse.id, class: mouse.class, value: null });
        freeze = 0;
    }

    if (eye_tick >= 2) {
        eye_tick = 0;
        webgazer.setGazeListener(data => {
            if (data) {
                storeInter({ type: 'eye', x: Math.round(data.x), y: Math.round(data.y), class: mouse.class, id: mouse.id, value: null });
            }
        }).begin();
    }

    if (face_tick >= 10) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(async stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                await new Promise(resolve => video.onloadedmetadata = resolve);
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                stream.getTracks().forEach(track => track.stop());
                const imageDataUrl = canvas.toDataURL('image/png');
                chrome.runtime.sendMessage({ type: "inferencia", data: imageDataUrl }, response => {
                    if (response) {
                        storeInter({
                            type: 'face',
                            x: mouse.x,
                            y: mouse.y,
                            class: mouse.class,
                            id: mouse.id,
                            value: response
                        });
                    }
                });
                face_tick = 0;
            });
    }

    if (send_tick >= 4) {
        chrome.runtime.sendMessage({ type: 'sendData', data: dataDict, pageHeight });
        Object.keys(dataDict).forEach(key => dataDict[key] = []);
        send_tick = 0;
    }
}

initializeExtension();
