const serverUrl = 'https://uxtracking.andrepereira.eng.br'
var timeInternal = 0
var userId = ''
var domain = ''
var lastTime = 0
var fixtime = 0

browser.runtime.onMessage.addListener(function (request, sender) {
  if (request.type == 'solicita') {
    prepareSample()
  } else {
    capture(request.type, request.data)
  }
  //sendResponse({ farewell: "goodbye" });
})
var shot = 5
function capture(type, data) {
  browser.windows.getCurrent(function (win) {
    browser.tabs.getSelected(null, function (tab) {
      var url = new URL(tab.url)
      domain = url.hostname
      //if(lastTime == (Math.ceil(data.Time) + timeInternal)&& ((type=="move" || type=="freeze") && //Math.ceil(data.Time) % 3 == 1)){
      //    data.imageData = "";
      //}
      if (type == 'eye') {
        data.imageData = 'NO'
        //data.Time-=0.2;
        Post(type, data)
      } else if (type == 'voice') {
        data.imageData = 'NO'
        //data.Time-=0.2;
        Post(type, data)
      } else {
        if ((type == 'move' || type == 'freeze') && shot < 7) {
          data.imageData = 'NO'
          Post(type, data)
          shot++
        } else {
          shot = 0
          lastTime = data.Time + timeInternal
          browser.tabs.captureVisibleTab(
            win.id,
            { format: 'jpeg', quality: 25 },
            function (screenshotUrl) {
              data.imageData = screenshotUrl
              Post(type, data)
            }
          )
        }
      }
    })
  })
}

function Post(type, data) {
  data.imageName = lastTime + '.jpg'
  if (fixtime < data.Time + timeInternal) {
    fixtime = data.Time + timeInternal
  }

  console.log('here')

  $.post(serverUrl + '/receiver.php', {
    metadata: JSON.stringify({
      sample: domain,
      userId: userId,
      type: type,
      time: fixtime,
      scroll: data.pageScroll,
      height: data.pageHeight,
      url: data.url,
    }),
    data: JSON.stringify(data),
  })
    .fail(function (data) {
      console.log(type + ' ' + data)
    })
    .done(function (data) {
      console.log(type + ' ' + data)
    })
}

function getRandomToken() {
  // E.g. 8 * 32 = 256 bits token
  var randomPool = new Uint8Array(32)
  window.crypto.getRandomValues(randomPool)
  var hex = ''
  for (var i = 0; i < randomPool.length; ++i) {
    hex += randomPool[i].toString(16)
  }
  // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
  return hex
  //return 'db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a';
}

function prepareSample() {
  browser.storage.sync.get(['userid'], function (items) {
    var loadedId = items.userid
    function useToken(userid) {
      userId = userid
      browser.tabs.getSelected(null, function (tab) {
        var url = new URL(tab.url)
        domain = url.hostname
        $.post(serverUrl + '/samplechecker.php', {
          userId: userid,
          domain: domain,
        })
          .fail(function (data) {
            console.log(data)
          })
          .done(function (data) {
            timeInternal = parseInt(data)
          })
      })
    }
    if (
      loadedId !== null &&
      loadedId !== '' &&
      typeof loadedId !== 'undefined'
    ) {
      useToken(loadedId)
    } else {
      loadedId = getRandomToken()
      browser.storage.sync.set({ userid: loadedId }, function () {
        // Notify that we saved.
        useToken(loadedId)
      })
    }
  })
}

var id = 0
function init() {
  //alert("Mouse pos "+posX+" "+posY);
}

browser.browserAction.onClicked.addListener(function (tab) {
  browser.storage.sync.remove(['userid'], function (Items) {
    loadedId == null
  })
  alert('Data Cleaned.')
})

browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  //alert("reloaded");
  //browser.tabs.executeScript(tabId, { file: "content.js" });
})
