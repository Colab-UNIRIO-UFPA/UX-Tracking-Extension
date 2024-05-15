async function startAudioCapture() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();

            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'pt-BR';
            recognition.start();

            recognition.onresult = event => {
                const lastResult = event.results[event.results.length - 1];
                const transcript = lastResult[0].transcript;
                const confidence = lastResult[0].confidence;

                const results = [{
                    transcript: transcript,
                    confidence: confidence
                }];
                window.parent.postMessage({ action: 'audioResult', data: results }, '*');
            };

            recognition.onerror = event => {
                console.error(`Erro no reconhecimento de voz: ${event.error}`);
                window.parent.postMessage({ action: 'error', data: event.error });
            };

        }).catch(error => {
            console.log(`Erro ao carregar o getUserMedia: ${error.message}`);
            window.parent.postMessage({ action: 'error', data: error.message });
        });
}

async function captureUserImage() {
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
            window.parent.postMessage({ action: 'userImageResult', data: imageDataUrl }, '*');
        });
}


window.addEventListener('message', (event) => {
    if (event.data.action === 'startAudioCapture') {
        startAudioCapture();
    }
    else if (event.data.action === 'captureUserImage') {
        captureUserImage();
    }
});