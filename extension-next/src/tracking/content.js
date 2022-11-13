const pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight)
let overId = ''
let overClass = ''
const mouse = {
  Id: '',
  Class: '',
  X: 0,
  Y: 0,
  Typed: '',
  Time: 0,
}

const eye = {
  x: 512,
  y: 256,
}

const lastX = 0
const lastY = 0
const keyboard = {
  Id: '',
  Class: '',
  X: 0,
  Y: 0,
  Typed: '',
  Time: 0,
}
let freeze = 0
let WebTracer_time = 0
const lastKeyId = ''

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

function GetScreenCordinates(obj) {
  const p = {}
  if (obj == null || (typeof obj == 'undefined')) {
    p.x = 0
    p.y = 0
    return p
  }
  p.x = obj.offsetLeft
  p.y = obj.offsetTop
  while (obj.offsetParent) {
    p.x = p.x + obj.offsetParent.offsetLeft
    p.y = p.y + obj.offsetParent.offsetTop
    if (obj == document.getElementsByTagName('body')[0])
      break

    else
      obj = obj.offsetParent
  }
  return p
}

function startAgain() {
  chrome.runtime.sendMessage(
    {
      type: 'solicita',
    },
  )
}

document.addEventListener('mousemove', (e) => {
  mouse.X = e.pageX
  mouse.Y = e.pageY
  freeze = 0
  sendMessage('move')
  if (typing) {
    sendMessage('keyboard')
    keyboard.Typed = ''
    keyboard.Id = e.target.id
    keyboard.Class = e.target.className
    typing = false
  }
})

function tick() {
  /// /console.log(WebTracer_time);
  freeze += 0.5
  WebTracer_time += 0.2
  if (freeze == 1) {
    sendMessage('freeze')
    freeze = 0
    // console.log("freeze at "+overId+" // "+overClass);
  }
  EyeTime += 1
  if (EyeTime > 0) {
    sendMessage('eye')
    EyeTime = 0
  }
}

function startTimer(secs) {
  secTime = parseInt(secs)
  ticker = setInterval(tick, 200)
}

document.addEventListener('mouseover', (e) => {
  mouse.Id = e.target.id
  mouse.Class = e.target.className
})

document.addEventListener('mouseout', (e) => {
  mouse.Id = ''
  mouse.Class = ''
})

document.addEventListener('wheel', (e) => {
  mouse.Id = e.target.id
  mouse.Class = e.target.className
  // console.log("wheel " + e.pageX + " | " + e.pageY);
  mouse.X = e.pageX
  mouse.Y = e.pageY
  freeze = 0
  sendMessage('wheel')
})

$(window).on('navigate', (event, data) => {
  const direction = data.state.direction
  sendMessage(direction)
  // back, forward
})

document.addEventListener('click', (e) => {
  mouse.Id = e.target.id
  mouse.Class = e.target.className
  // console.log("click " + e.pageX + " | " + e.pageY);
  mouse.X = e.pageX
  mouse.Y = e.pageY
  freeze = 0
  if (typing) {
    sendMessage('keyboard')
    keyboard.Typed = ''
    keyboard.Id = e.target.id
    keyboard.Class = e.target.className
    typing = false
  }
  sendMessage('click')
})

document.addEventListener('keydown', KeyCheck)
function KeyCheck(event) {
  const KeyID = event.keyCode
  switch (KeyID) {
    case 8:
      // backspace
      keyboard.Typed = keyboard.Typed.slice(0, -1)
      break
    case 46:
      // delete
      keyboard.Typed += '-!-'
      break
    case 13:
      sendMessage('keyboard')
      keyboard.Typed = ''
      keyboard.Id = e.target.id
      keyboard.Class = e.target.className
      break
    default:
      break
  }
}
var typing = false
document.onkeypress = function (e) {
  typing = true
  const obj = GetScreenCordinates(document.getElementById(e.target.id))
  console.log(`Press id ${e.target.id} pos ${obj.x} | ${obj.y}`)
  const get = window.event ? event : e
  let key = get.keyCode ? get.keyCode : get.charCode
  key = String.fromCharCode(key)
  if (e.target.id != keyboard.Id) {
    sendMessage('keyboard')
    keyboard.Typed = ''
    keyboard.Id = e.target.id
    keyboard.Class = e.target.className
  }
  else {
    keyboard.X = Math.round(obj.x)
    keyboard.Y = Math.round(obj.y)
  }
  keyboard.Typed += key
  keyboard.Typed.replace(/(?:\r\n|\r|\n)/g, ' - ')
  console.log(keyboard.Typed)
}

$(document).mouseover((e) => {
  overId = e.target.id
  overClass = e.target.className
})
var EyeTime = 0

startAgain()
startTimer()

function sendEye(x, y) {
  eye.x = Math.round(x)
  eye.y = Math.round(y)
}

function sendMessage(type) {
  let data = {}
  if (type == 'keyboard') {
    data = keyboard
    if (data.X == 0 && data.Y == 0) {
      data.X = Math.round(mouse.X)
      data.Y = Math.round(mouse.Y)
    }
  }
  else {
    data = {
      Id: mouse.Id,
      Class: mouse.Class,
      X: mouse.X,
      Y: mouse.Y,
      Typed: mouse.Typed,
      Time: mouse.Time,
    }
    if (type == 'eye') {
      data.X = Math.round(eye.x)
      data.Y = Math.round(eye.y)
    }
  }
  data.Time = WebTracer_time
  data.imageName = ''
  data.pageHeight = Math.round(pageHeight)
  data.pageScroll = Math.round(document.documentElement.scrollTop)
  data.url = document.URL
  data.mouseId = overId
  data.mouseClass = overClass
  data.Typed = data.Typed.replace(/(?:\r\n|\r|\n)/g, ' - ')
  // console.log("message send "+type);
  chrome.runtime.sendMessage({
    type,
    data,
  })
}
