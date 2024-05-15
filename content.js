// Obter a altura da página
const pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight);

// Injetar o iframe na página
const iframe = document.createElement('iframe');
iframe.src = chrome.runtime.getURL('iframe.html');
iframe.style.display = 'none';
iframe.allow = 'microphone; camera';
document.body.appendChild(iframe);

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
    // Solicitar início da captura de áudio
    iframe.onload = () => {
        iframe.contentWindow.postMessage({ action: 'startAudioCapture' }, '*');
    };
    // Receber os dados de áudio do iframe
    window.addEventListener('message', (event) => {
        if (event.data.action === 'error') {
            console.error(`Erro na captura de áudio: ${event.data.data}`);
        } else if (event.data.action === 'audioResult') {
            const saidWords = event.data.data; // Array de transcrições
            const combinedTranscript = saidWords.map(saidWord => saidWord.transcript).join(' ');

            storeInter({
                type: 'voice',
                x: mouse.x,
                y: mouse.y,
                class: mouse.class,
                id: mouse.id,
                value: { text: combinedTranscript },
            });
        }
    });
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

    if (freeze >= 10) {
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
        iframe.contentWindow.postMessage({ action: 'captureUserImage' }, '*');
        window.addEventListener('message', (event) => {
            if (event.data.action === 'userImageResult') { 
                imageDataUrl = event.data.data;
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
            }
        });
        
        face_tick = 0;
    }

    if (send_tick >= 4) {
        chrome.runtime.sendMessage({ type: 'sendData', data: dataDict, pageHeight });
        Object.keys(dataDict).forEach(key => dataDict[key] = []);
        send_tick = 0;
    }
}

initializeExtension();
