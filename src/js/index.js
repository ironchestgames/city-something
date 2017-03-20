// var DebugConsole = require('./DebugConsole')
var version = require('./version')
console.log(version)
var PIXI = require('pixi.js')
var browserGameLoop = require('browser-game-loop')
var windowLoad = require('window-load')
var screenOrientation = require('screen-orientation')
var ob = require('obscen')
var loadingScene = require('./loadingScene')
var gameScene = require('./gameScene')

var fpsText
var LANDSCAPE = 'landscape'
var PORTRAIT = 'portrait'
var wantedScreenOrientation = LANDSCAPE
var savedDisplayValue
var isGameShowing = false
var turnDeviceElement

var setUpGameRenderer = function () {

  // init pixi renderer
  var noWebgl = !!localStorage.getItem('vars:noWebgl')
  var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {}, noWebgl)
  document.body.appendChild(renderer.view)
  renderer.backgroundColor = 0x115511

  var appContainer = new PIXI.Container()
  var baseStage = new PIXI.Container()
  var debugTexts = new PIXI.Container()

  appContainer.addChild(baseStage)
  appContainer.addChild(debugTexts)

  global.appContainer = appContainer
  global.baseStage = baseStage
  global.renderer = renderer

  // debug monitor text
  if (!global.DEBUG_MONITOR) {
    debugTexts.visible = false
  }

  fpsText = new PIXI.Text('This is a pixi text', {
    fill: 0xffffff,
  })
  debugTexts.addChild(fpsText)

}

windowLoad(function () {

  // DebugConsole.init()

  global.DEBUG_MONITOR = !!localStorage.getItem('DEBUG_MONITOR')

  // init obscen
  var sceneManager = new ob.SceneManager()

  sceneManager.setScenes([
    loadingScene,
    gameScene,
    ])

  // init browserGameLoop
  var timestep = 1000 / 30
  var loop = browserGameLoop({
    updateTimeStep: timestep,
    fpsFilterStrength: 20,
    slow: 1,
    input: function() {},
    update: function(step) {
      if (screenOrientation().direction === wantedScreenOrientation) {
        global.sceneManager.update(step)
      }
    },
    render: function(ratio) {
      if (screenOrientation().direction === wantedScreenOrientation) {

        if (isGameShowing === false) {
          isGameShowing = true
          turnDeviceElement.style.visibility = 'hidden'
          global.renderer.view.style.display = savedDisplayValue
        }

        global.sceneManager.draw(renderer, ratio)
        fpsText.text = 'fps: ' + Math.round(loop.getFps()) + '\nscreen orientation: ' + screenOrientation().direction
        global.renderer.render(global.appContainer)

      } else {

        if (isGameShowing === true) {
          isGameShowing = false
          turnDeviceElement.style.visibility = 'visible'
          global.renderer.view.style.display = 'none'
        }

      }
    },
  })
  loop.timestep = timestep

  global.sceneManager = sceneManager
  global.loop = loop

  lastOrientation = screenOrientation().direction

  turnDeviceElement = document.getElementById('turn_device')

  var intervalId = setInterval(function () {
    if (screenOrientation().direction === wantedScreenOrientation) {

      // hide turn device icon
      turnDeviceElement.style.visibility = 'hidden'

      // set up everything pixi for the game
      setUpGameRenderer()

      // start with load scene
      global.sceneManager.changeScene('loadingScene')

      // start!
      isGameShowing = true
      savedDisplayValue = global.renderer.view.style.display
      clearInterval(intervalId)
      global.loop.start()

    } else {

      turnDeviceElement.style.visibility = 'visible'
    }
  }, 100)
  
})
