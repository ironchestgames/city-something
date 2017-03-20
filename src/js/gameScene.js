var KeyButton = require('./KeyButton')
var Easystarjs = require('easystarjs')

var easystar = new Easystarjs.js()
var easystarGrid = []

global.easystarGrid = easystarGrid

var TERRAIN_URBAN = 0
var TERRAIN_FOREST = 1
var TERRAIN_IMPENETRABLE = 2

var FOREST = 'FOREST'
var RESIDENCE = 'RESIDENCE'
var COMMERCE = 'COMMERCE'
var INDUSTRY = 'INDUSTRY'

var HEN_RESTING = 'HEN_RESTING'
var HEN_WALKING = 'HEN_WALKING'
var HEN_WORKING = 'HEN_WORKING'

var columnCount = 9
var rowCount = 9

var tiles = []
var markedTile = null
var hens = []
var henIdCounter = 0

var dayInFrames = null // NOTE: set in create

var getTile = function (x, y) {
  return tiles[y * rowCount + x]
}

var getTilesByType = function (type) {
  return tiles.filter(function (tile) {
    return tile.type === type
  })
}

var hideAllSpritesInTile = function (tile) {
  for (var spriteKey in tile.sprites) {
    if (tile.sprites.hasOwnProperty(spriteKey)) {
      tile.sprites[spriteKey].visible = false
    }
  }
}

var buildRoadInTile = function (tile) {
  tile.roadSprite.visible = true
  tile.terrain = TERRAIN_URBAN
  easystarGrid[tile.y][tile.x] = TERRAIN_URBAN
}

var henMoveIn = function (tile, henContainer) {
  var hen = {
    id: henIdCounter++,
    x: tile.x,
    y: tile.y,
    speed: 2.689,
    path: [],
    workPlace: null,
    target: null,
    home: tile,
    workDay: dayInFrames / 3,
    workDayCount: 0,
    energy: 1000,
    state: HEN_RESTING,
    sprite: new PIXI.Sprite(PIXI.loader.resources['hen001'].texture),
  }

  hen.sprite.anchor.x = 0.5
  hen.sprite.anchor.y = 0.5
  hen.sprite.visible = false

  henContainer.addChild(hen.sprite)

  hens.push(hen)
}

var henFindPathToTarget = function (hen) {
  easystar.findPath(hen.x, hen.y, hen.target.x, hen.target.y, function(path) {
    if (path !== null) {
      hen.path = path
      hen.state = HEN_WALKING
      hen.sprite.x = hen.x * 64
      hen.sprite.y = hen.y * 64
      hen.sprite.visible = true
    }
  })
}

var findWorkPlace = function (hen) {
  var industryTiles = getTilesByType(INDUSTRY)

  if (industryTiles.length > 0) {
    var closestIndustry = industryTiles.pop()
    var dx = closestIndustry.x - hen.x
    var dy = closestIndustry.y - hen.y
    var closestDistance = Math.sqrt(dx * dx + dy * dy)

    while (industryTiles.length) {
      var industry = industryTiles.pop()
      dx = industry.x - hen.x
      dy = industry.y - hen.y
      var distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < closestDistance) {
        closestIndustry = industry
      }
    }

    hen.workPlace = closestIndustry
  }
}

var zoneCountText

var keyR
var keyC
var keyI
var keyW

var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {

    var dayInSeconds = 12
    dayInFrames = global.loop.timestep * dayInSeconds

    this.container = new PIXI.Container()

    this.henContainer = new PIXI.Container()
    this.henContainer.x = 100
    this.henContainer.y = 64

    this.tileContainer = new PIXI.Container()
    this.tileContainer.x = 100
    this.tileContainer.y = 64

    this.guiContainer = new PIXI.Container()

    var clickHandler = function (event) {
      // console.log(event.target)
      this.markerSprite.visible = true
      this.markerSprite.x = event.target.parent.worldTransform.tx
      this.markerSprite.y = event.target.parent.worldTransform.ty
      markedTile = tiles.find(function (tile) {
        return tile.id === event.target.tileId
      })
    }.bind(this)

    var tileIdCount = 0

    for (var r = 0; r < rowCount; r++) {
      easystarGrid.push([])
      for (var c = 0; c < columnCount; c++) {

        easystarGrid[r].push(TERRAIN_FOREST)

        var tile = {
          id: tileIdCount,
          x: c,
          y: r,
          type: FOREST,
          terrain: TERRAIN_FOREST,
          container: new PIXI.Container(),
          hens: [],
          sprites: {
            FOREST: new PIXI.Sprite(PIXI.loader.resources['forest_1'].texture),
            RESIDENCE: new PIXI.Sprite(PIXI.loader.resources['residences_1'].texture),
            COMMERCE: new PIXI.Sprite(PIXI.loader.resources['commerce_1'].texture),
            INDUSTRY: new PIXI.Sprite(PIXI.loader.resources['industry_1'].texture),
          },
          roadSprite: new PIXI.Sprite(PIXI.loader.resources['road_WSEN'].texture),
        }

        for (var spriteKey in tile.sprites) {
          if (tile.sprites.hasOwnProperty(spriteKey)) {
            tile.container.addChild(tile.sprites[spriteKey])
          }
        }

        hideAllSpritesInTile(tile)
        tile.container.addChild(tile.roadSprite)
        tile.roadSprite.visible = false

        var inputArea = new PIXI.Sprite(PIXI.Texture.EMPTY)
        inputArea.width = 64
        inputArea.height = 64
        inputArea.interactive = true
        inputArea.tileId = tileIdCount
        inputArea.on('pointerdown', clickHandler)

        tile.container.addChild(inputArea)

        tile.sprites.FOREST.visible = true

        tile.container.x = c * 64
        tile.container.y = r * 64

        tile.container.pivot.x = 32
        tile.container.pivot.y = 32

        this.tileContainer.addChild(tile.container)
        
        tiles.push(tile)

        tileIdCount++
      }
    }

    easystar.setGrid(easystarGrid)
    easystar.setAcceptableTiles([TERRAIN_URBAN, TERRAIN_FOREST])
    easystar.setTileCost(TERRAIN_URBAN, 1)
    easystar.setTileCost(TERRAIN_FOREST, 7)
    easystar.setIterationsPerCalculation(global.loop.getFps())

    this.markerSprite = new PIXI.Sprite(PIXI.loader.resources['marker'].texture)
    this.markerSprite.visible = false

    zoneCountText = new PIXI.Text('This is a pixi text', {
      fill: 0xeeeeee,
    })

    this.guiContainer.addChild(zoneCountText)

    this.container.addChild(this.tileContainer)
    this.container.addChild(this.tileContainer)
    this.container.addChild(this.henContainer)
    this.container.addChild(this.markerSprite)
    this.container.addChild(this.guiContainer)
    global.baseStage.addChild(this.container)

    var onBuildResidence = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.sprites.RESIDENCE.visible = true
      markedTile.type = RESIDENCE
      buildRoadInTile(markedTile)
      henMoveIn(markedTile, this.henContainer)
    }.bind(this)

    var onBuildCommerce = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.sprites.COMMERCE.visible = true
      markedTile.type = COMMERCE
      buildRoadInTile(markedTile)
    }

    var onBuildIndustry = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.sprites.INDUSTRY.visible = true
      markedTile.type = INDUSTRY
      buildRoadInTile(markedTile)
    }

    var onBuildRoad = function () {
      buildRoadInTile(markedTile)
    }

    keyR = new KeyButton({
      key: 'r',
      onKeyDown: onBuildResidence,
    })

    keyC = new KeyButton({
      key: 'c',
      onKeyDown: onBuildCommerce,
    })

    keyI = new KeyButton({
      key: 'i',
      onKeyDown: onBuildIndustry
    })

    keyW = new KeyButton({
      key: 'w',
      onKeyDown: onBuildRoad
    })

  },
  destroy: function () {
    this.container.destroy()
    keyR.destroy()
    keyC.destroy()
    keyI.destroy()
  },
  update: function () {
    var residenceCount = 0
    var commerceCount = 0
    var industryCount = 0

    for (var i = 0; i < tiles.length; i++) {
      var tile = tiles[i]
      if (tile.type === RESIDENCE) {
        residenceCount++
      } else if (tile.type === COMMERCE) {
        commerceCount++
      } else if (tile.type === INDUSTRY) {
        industryCount++
      }
    }

    zoneCountText.text = 'R: ' + residenceCount + '\n' +
        'C: ' + commerceCount + '\n' +
        'I: ' + industryCount

    easystar.calculate()

    for (var i = 0; i < hens.length; i++) {
      var hen = hens[i]

      // console.log(hen)

      if (hen.state === HEN_RESTING) {

        hen.energy += 1.5

        if (hen.energy > 1000) {
          hen.energy = 1000
        }

        if (hen.workPlace) {

          if (hen.energy > 500) {
            hen.target = hen.workPlace
            henFindPathToTarget(hen)
          }

        } else {
          findWorkPlace(hen)
        }

      } else if (hen.state === HEN_WALKING && hen.path && hen.path.length) {

        hen.energy -= 0.2
        
        var nextPathPoint = hen.path[0]

        var dx = nextPathPoint.x * 64 - hen.sprite.x
        var dy = nextPathPoint.y * 64 - hen.sprite.y

        var angle = Math.atan2(dy, dx)

        var speed = hen.speed
        var currentTerrain = getTile(Math.round(hen.sprite.x / 64),
            Math.round(hen.sprite.y / 64)).terrain

        if (currentTerrain === TERRAIN_FOREST) {
          speed = hen.speed / 3
        }

        hen.sprite.x += Math.cos(angle) * speed
        hen.sprite.y += Math.sin(angle) * speed

        var distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < hen.speed + 0.1) {
          // console.log(nextPathPoint.x, nextPathPoint.y)
          var reachedPoint = hen.path.shift()
          hen.x = reachedPoint.x
          hen.y = reachedPoint.y
        }

        if (hen.path.length === 0) {
          if (hen.target === hen.home) {
            hen.state = HEN_RESTING
          } else if (hen.target === hen.workPlace) {
            hen.state = HEN_WORKING
            hen.workDayCount = 0
          }

          hen.sprite.visible = false
          // console.log('stopped walking', hen)
        }

      } else if (hen.state === HEN_WORKING) {

        hen.workDayCount += 1
        hen.energy -= 1

        if (hen.workDayCount > hen.workDay) {

          hen.workDayCount = 0
          hen.target = hen.home
          henFindPathToTarget(hen)

        }

      }
    }
  },
  draw: function () {
    global.renderer.render(this.container)
  },
}

module.exports = gameScene
