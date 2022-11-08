var voice = {
  Id:"",
  Class:"",
  X: 0,
  Y: 0,
  Time:0,
  type: "voice",
  typed: ""
};

var TICK_INTERVAL = 200;
var pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight);
var webtracer_time = 0;
//var data;

// new instance of speech recognition
var recognition = new webkitSpeechRecognition();
// set params
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'pt-BR';
recognition.start();
recognition.onresult = function (event) {

  // delve into words detected results & get the latest
  // total results detected
  var resultsLength = event.results.length - 1;
  // get length of latest results
  var ArrayLength = event.results[resultsLength].length - 1;
  // get last word detected
  var saidWord = event.results[resultsLength][ArrayLength].transcript;
  if (voice.typed != saidWord) {
    voice.typed = saidWord;
    console.log(saidWord);
    save_speech();
  }
}

// speech error handling
recognition.onerror = function (event) {
  console.log('error?');
  console.log(event);
}

/*(function startTimer() {
  setInterval(() => {
      webtracer_time += 0.2;
  }, TICK_INTERVAL);
})();
*/

function save_speech(){
  var data = voice;
  sendMessage(data.type, data);
}
