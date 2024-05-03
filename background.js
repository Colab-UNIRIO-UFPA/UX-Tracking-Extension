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
    function updateInterval() {
        popupInterval += 1000;
    }
    chrome.storage.sync.get('authToken', function (data) {
        if (data.authToken) {
            userId = data.authToken;
            chrome.storage.sync.get(['record']).then((result) => {
                if (result && result.record) {
                    if (request.type == "inferencia") {
                        sendFace(request.data).then(responseData => {
                            responseData = JSON.parse(responseData)
                            sendResponse(responseData);
                        });
                        return true;
                    } else if (request.type === "error") {
                        console.error(`Erro recebido: ${request.message}`);
                        return true;
                    } else if (request.type === "log") {
                        console.error(`Log recebido: ${request.message}`);
                        return true;
                    } else if (request.type === "sendData") {
                        capture(request.data, request.pageHeight);
                    }
                }
            });
        } else {
            if (popupInterval >= 30000) {
                notification();
                console.log('User ID is not set.');
            }
            setInterval(updateInterval, 1000)
        }

    });
    return true;
});

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
                    console.log('Data: ', data);
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
                    Post(content);
                });
            } else {
                console.error('Nenhuma aba ativa encontrada.');
            }
        });
    });
}

async function Post(content) {
    try {
        const response = await fetch(`${serverUrl}/receiver`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(content)
        });

        if (response.ok) {
            const responseData = await response.text();
            console.log(responseData);
        } else {
            console.error("Request failed with status:", response.status);
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function sendFace(image) {
    try {
        const response = await fetch(`${serverUrl}/faceExpression`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                data: image
            })
        });

        const responseData = await response.text();
        return responseData;
    } catch (error) {
        console.error(" An error occurred:", error);
        throw error;
    }
}

function notification() {
    var options = {
        type: 'basic',
        iconUrl: 'logo.png',
        title: 'UX-Tracking: Login necessário!',
        message: 'Faça o login para iniciar a captura!\nClique no botão abaixo ou abra o menu da extensão.',
        buttons: [{ title: 'Fazer login' }]
    };

    chrome.notifications.create('loginNotification', options, function (notificationId) {
        // Define um ouvinte para o clique na notificação
        chrome.notifications.onButtonClicked.addListener(function (clickedNotificationId, buttonIndex) {
            if (clickedNotificationId === 'loginNotification' && buttonIndex === 0) {
                // Abre a popup da extensão quando o usuário clica no botão "Fazer Login"
                chrome.windows.create({
                    url: 'popup/index.html', // Substitua pelo URL da sua popup HTML
                    type: 'popup',
                    width: 300,
                    height: 350
                });
            }
        });
    });
}