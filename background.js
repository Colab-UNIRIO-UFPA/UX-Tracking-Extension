//const serverUrl = "https://uxtracking.andrepereira.eng.br/external";
const serverUrl = "http://localhost:5000/external";

// Cria um objeto Date com a data e hora atuais
var datetime = new Date();
var timeInternal = 0;
var userId = '';
var domain = "";
var lastTime = 0;
var timeInitial = Math.round(Date.now() / 1000);

var isPopupPending = false; // Flag para verificar se uma popup está pendente
var popupTimeout; // Referência para o timeout
var popupInterval = 0;


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    chrome.storage.sync.get(['authToken', 'record'], function (data) {
        if (data.authToken) {
            userId = data.authToken;
            if (data.record) {
                handleRequest(request, sendResponse);
            }
        } else {
            handleNoAuthToken();
        }
    });
    return true; // Para tratamento assíncrono de sendResponse
});

function handleRequest(request, sendResponse) {
    switch (request.type) {
        case "inferencia":
            sendFace(request.data)
                .then(responseData => sendResponse(JSON.parse(responseData)))
                .catch(error => console.error("Erro no reconhecimento facial: ", error));
            return true; // Mantém sendResponse ativo
        case "error":
            console.error(`Erro recebido: ${request.message}`);
            break;
        case "log":
            console.error(`Log recebido: ${request.message}`);
            break;
        case "sendData":
            capture(request.data, request.pageHeight);
            break;
    }
}

function handleNoAuthToken() {
    if (popupInterval >= 30000) {
        notifyLoginRequired();
        console.log('User ID is not set.');
        popupInterval = 0; // Reset interval
    }
    popupInterval += 1000;
}

function capture(data, pageHeight) {
    chrome.windows.getCurrent(function (win) {
        chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, function (tabs) {
            if (tabs && tabs[0] && tabs[0].url) {
                var url = new URL(tabs[0].url);
                var domain = url.hostname;
                chrome.tabs.captureVisibleTab(win.id, { format: "jpeg", quality: 25 }, function (screenshotUrl) {
                    if (chrome.runtime.lastError || !screenshotUrl) {
                        console.error('Erro ao capturar a tela: ', chrome.runtime.lastError?.message);
                        return;
                    }
                    var content = {
                        data: data,
                        metadata: {
                            userID: userId,
                            dateTime: datetime,
                            image: screenshotUrl,
                            height: pageHeight,
                            site: domain
                        }
                    }
                    post(content);
                });
            } else {
                console.error('Nenhuma aba ativa encontrada.');
            }
        });
    });
}

async function post(content) {
    try {
        const response = await fetch(`${serverUrl}/receiver`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(content)
        });
        console.log("Response Status:", response.status, await response.text());
    } catch (error) {
        console.error("Erro ao enviar dados para o servidor:", error);
    }
}

async function sendFace(image) {
    const response = await fetch(`${serverUrl}/faceExpression`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: image })
    });
    return response.text();
}

function notifyLoginRequired() {
    var options = {
        type: 'basic',
        iconUrl: 'logo.png',
        title: 'UX-Tracking: Login necessário!',
        message: 'Faça o login para iniciar a captura!',
        buttons: [{ title: 'Fazer login' }]
    };
    chrome.notifications.create('loginNotification', options, function () {
        chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
            if (notificationId === 'loginNotification' && buttonIndex === 0) {
                chrome.windows.create({ url: 'popup/index.html', type: 'popup', width: 300, height: 350 });
            }
        });
    });
}

setInterval(() => popupInterval += 1000, 1000);