// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

const serverUrl = 'http://lpo.ddns.net:8080/webtracer'
let timeInternal = 0
let userId = ''
let domain = ''
let lastTime = 0
let fixtime = 0

browser.runtime.onMessage.addListener((request: any) => {
  if (request.type === 'solicita')
    prepareSample()

  else
    capture(request.type, request.data)

  // sendResponse({ farewell: "goodbye" });
})
let shot = 5
function capture(type: any, data: any) {
  browser.windows.getCurrent().then((win) => {
    browser.tabs.getCurrent().then((tab) => {
      const url = new URL(tab.url as string)
      domain = url.hostname
      // if(lastTime == (Math.ceil(data.Time) + timeInternal)&& ((type=="move" || type=="freeze") && //Math.ceil(data.Time) % 3 == 1)){
      //    data.imageData = "";
      // }
      if (type === 'eye') {
        data.imageData = 'NO'
        // data.Time-=0.2;
        Post(type, data)
      }
      else {
        if ((type === 'move' || type === 'freeze') && shot < 7) {
          data.imageData = 'NO'
          Post(type, data)
          shot++
        }
        else {
          shot = 0
          lastTime = data.Time + timeInternal
          browser.tabs.captureVisibleTab(win.id, { format: 'jpeg', quality: 25 }).then((screenshotUrl: string) => {
            data.imageData = screenshotUrl
            Post(type, data)
          })
        }
      }
    })
  })
}

function Post(type: any, data: any) {
  data.imageName = `${lastTime}.jpg`
  if (fixtime < data.Time + timeInternal)
    fixtime = data.Time + timeInternal

  $.post(`${serverUrl}/receiver.php`,
    {
      metadata: JSON.stringify({
        sample: domain,
        userId,
        type,
        time: fixtime,
        scroll: data.pageScroll,
        height: data.pageHeight,
        url: data.url,
      }),
      data: JSON.stringify(data),

    },
  ).fail(() => {
    // console.log(`${type} ${data}`)
  },

  ).done(() => {
    // console.log(`${type} ${data}`)
  },
  )
}

function getRandomToken() {
  // E.g. 8 * 32 = 256 bits token
  const randomPool = new Uint8Array(32)
  window.crypto.getRandomValues(randomPool)
  let hex = ''
  for (let i = 0; i < randomPool.length; ++i)
    hex += randomPool[i].toString(16)

  // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
  return hex
  // return 'db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a';
}

let loadedId: any

function prepareSample() {
  browser.storage.sync.get(['userid']).then((items) => {
    loadedId = items.userid
    function useToken(userid: any) {
      userId = userid
      browser.tabs.getCurrent().then((tab) => {
        const url = new URL(tab.url as string)
        domain = url.hostname
        $.post(`${serverUrl}/samplechecker.php`, { userId: userid, domain }).done((data: any) => {
          timeInternal = parseInt(data)
        })
      })
    }
    if (loadedId !== null && loadedId !== '' && typeof loadedId !== 'undefined') {
      useToken(loadedId)
    }
    else {
      loadedId = getRandomToken()
      browser.storage.sync.set({ userid: loadedId }).then(() => {
        useToken(loadedId)
      })
    }
  })
}

/*
browser.browserAction.onClicked.addListener(function (tab: any) {
    browser.storage.sync.remove(["userid"]).then(() => {
        loadedId == null;
    });
    alert('Data Cleaned.');
});

browser.tabs.onUpdated.addListener(function (tabId: any, changeInfo: any, tab: any) {
    //alert("reloaded");
    //browser.tabs.executeScript(tabId, { file: "content.js" });
});
*/
