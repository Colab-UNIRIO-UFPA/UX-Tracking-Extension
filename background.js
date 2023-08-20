const serverUrl = "https://uxtracking.andrepereira.eng.br";

// Cria um objeto Date com a data e hora atuais
var dataHoraAtual = new Date();

// Extrai as partes da data e hora que queremos incluir no index
var ano = dataHoraAtual.getFullYear();
var mes = ("0" + (dataHoraAtual.getMonth() + 1)).slice(-2);
var dia = ("0" + dataHoraAtual.getDate()).slice(-2);
var hora = ("0" + dataHoraAtual.getHours()).slice(-2);
var minuto = ("0" + dataHoraAtual.getMinutes()).slice(-2);
var segundo = ("0" + dataHoraAtual.getSeconds()).slice(-2);

// Cria a string de index no formato YYYYMMDD-HHMMSS
var dateTime = ano + mes + dia + "-" + hora + minuto + segundo;
var timeInternal = 0;
var userId = '';
var domain = "";
var lastTime = 0;
var timeInitial = Math.round(Date.now() / 1000);

var isPopupPending = false; // Flag para verificar se uma popup está pendente
var popupTimeout; // Referência para o timeout

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Verifica se uma popup já está pendente, se sim, ignora esta chamada
    if (isPopupPending) {
      return;
    }
    
    chrome.storage.session.get('authToken', function(data) {
      if (data.authToken) {
        userId = data.authToken;
        if (request.type == "solicita") {
          prepareSample();
        } else {
          capture(request.type, request.data);
        }
      } else {
        notification();
        console.log('User ID is not set.');
      }
      
      // Define um timeout para evitar chamadas consecutivas de pop-up
      isPopupPending = true;
      popupTimeout = setTimeout(function() {
        isPopupPending = false;
      }, 60000); // Define o tempo de espera em milissegundos
    });
  });

let lastCaptureTime = 0;
const captureInterval = 1000; // Intervalo em milissegundos entre capturas

function capture(type, data) {
    const currentTime = Date.now();
    chrome.windows.getCurrent(function (win) {
        chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, function (tabs) {
            if (tabs && tabs[0] && tabs[0].url) {
                var url = new URL(tabs[0].url);
                domain = url.hostname;

                /*
                if(type=="eye"){
                    lastTime = data.Time + timeInternal;
                    chrome.tabs.captureVisibleTab(win.id, { format: "jpeg", quality: 25 }, function (screenshotUrl)
                    {
                        data.imageData = screenshotUrl;
                        Post(type, data);
                    });
                }else
                */

                if (type != "eye" && type != "freeze") {
                    // Verifica se o intervalo mínimo entre capturas foi atingido
                    if (currentTime - lastCaptureTime <= captureInterval) {
                        lastCaptureTime = currentTime; // Atualiza o último tempo de captura
                        data.imageData = 'NO';
                        Post(type, data);
                    } else {
                        lastTime = data.Time + timeInternal;
                        chrome.tabs.captureVisibleTab(win.id, { format: "jpeg", quality: 25 }, function (screenshotUrl) {
                            data.imageData = screenshotUrl;
                            Post(type, data);
                        });
                    }
                }
            } else {
                console.error('Nenhuma aba ativa encontrada.');
            }
        });
    });
}

async function Post(type, data) {
    data.imageName = lastTime + ".jpg";
    const time = new Date().getTime();

    try {
        const response = await fetch(`${serverUrl}/receiver`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                metadata: JSON.stringify({
                    dateTime: dateTime,
                    sample: domain,
                    userId: userId,
                    type: type,
                    time: Math.round(Date.now() / 1000) - timeInitial,
                    scroll: data.pageScroll,
                    height: data.pageHeight,
                    url: data.url
                }),
                data: JSON.stringify(data)
            })
        });

        if (response.ok) {
            const responseData = await response.text();
            console.log(type + " " + responseData);
        } else {
            console.error(type + " Request failed with status:", response.status);
        }
    } catch (error) {
        console.error(type + " An error occurred:", error);
    }
}

function prepareSample() {
    chrome.storage.sync.get(["userid"], function (items) {
        var loadedId = items.userid;
        function useToken(userid) {
            userId = userid;
            chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            }, async function (tabs) {
                var url = new URL(tabs[0].url);
                domain = url.hostname;

                try {
                    const response = await fetch(`${serverUrl}/sample_checker`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId: userid, domain: domain, dateTime: dateTime })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        timeInternal = parseInt(data);
                    } else {
                        console.error("Request failed with status:", response.status);
                    }
                } catch (error) {
                    console.error("An error occurred:", error);
                }
            });
        }
        if (loadedId !== null && loadedId !== "" && typeof loadedId !== 'undefined') {
            useToken(loadedId);
        }
        else {
            chrome.storage.sync.set({ 'userid': userId }, function () {
                // Notify that we saved.
                useToken(loadedId);
            });
        }
    });
}

function notification() {
    var options = {
      type: 'basic',
      iconUrl: 'logo.png',
      title: 'UX-Tracking: Login necessário!',
      message: 'Faça o login para iniciar a captura!\nClique no botão abaixo ou abra o menu da extensão.',
      buttons: [{ title: 'Fazer login' }]
    };
    
    chrome.notifications.create('loginNotification', options, function(notificationId) {
      // Define um ouvinte para o clique na notificação
      chrome.notifications.onButtonClicked.addListener(function(clickedNotificationId, buttonIndex) {
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
  