var KeyButton = require('./KeyButton')
var Easystarjs = require('easystarjs')
var gameVars = require('./gameVars')
var Citizen = require('./Citizen')

var easystar = new Easystarjs.js()
var easystarGrid = []

global.easystarGrid = easystarGrid

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
  tile.terrain = gameVars.TERRAIN_URBAN
  easystarGrid[tile.y][tile.x] = gameVars.TERRAIN_URBAN
}

var findPathToTarget = function (hen) {
  easystar.findPath(hen.tileX, hen.tileY, hen.target.x, hen.target.y, function(path) {
    if (path !== null) {
      var tilePath = []
      for (var i = 0; i < path.length; i++) {
        var pathTile = getTile(path[i].x, path[i].y)
        tilePath.push(pathTile)
      }
      hen.tilePath = tilePath
      hen.state = Citizen.STATE_WALKING
      hen.sprite.x = hen.tileX * 64
      hen.sprite.y = hen.tileY * 64
      hen.sprite.visible = true
    }
  })
}

var findClosestTileOfType = function (hen, type) {
  var tilesOfType = getTilesByType(type)

  if (tilesOfType.length > 0) {
    var closestTile = tilesOfType.pop()
    var dx = closestTile.x - hen.tileX
    var dy = closestTile.y - hen.tileY
    var closestDistance = Math.sqrt(dx * dx + dy * dy)

    while (tilesOfType.length) {
      var tile = tilesOfType.pop()
      dx = tile.x - hen.tileX
      dy = tile.y - hen.tileY
      var distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < closestDistance) {
        closestTile = tile
      }
    }

    return closestTile
  }

  return null
}

var updateMarkedTileInfoText = function () {
  var terrainMap = {}
  terrainMap[gameVars.TERRAIN_URBAN] = 'TERRAIN_URBAN'
  terrainMap[gameVars.TERRAIN_FOREST] = 'TERRAIN_FOREST'

  markedTileInfoText.text = markedTile.type + '\n' +
      terrainMap[markedTile.terrain]
}

var zoneCountText
var markedTileInfoText

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

      updateMarkedTileInfoText()

    }.bind(this)

    var tileIdCount = 0

    for (var r = 0; r < rowCount; r++) {
      easystarGrid.push([])
      for (var c = 0; c < columnCount; c++) {

        easystarGrid[r].push(gameVars.TERRAIN_FOREST)

        var tile = {
          id: tileIdCount,
          x: c,
          y: r,
          type: gameVars.FOREST,
          terrain: gameVars.TERRAIN_FOREST,
          container: new PIXI.Container(),
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
    easystar.setAcceptableTiles([gameVars.TERRAIN_URBAN])
    easystar.setTileCost(gameVars.TERRAIN_URBAN, 1)
    easystar.setIterationsPerCalculation(global.loop.getFps())

    this.markerSprite = new PIXI.Sprite(PIXI.loader.resources['marker'].texture)
    this.markerSprite.visible = false

    zoneCountText = new PIXI.Text('This is a pixi text', {
      fill: 0xffffff,
    })

    markedTileInfoText = new PIXI.Text('Mark tile to get info', {
      fill: 0xffffff,
    })

    markedTileInfoText.y = 64 * rowCount + 30

    this.guiContainer.addChild(zoneCountText)
    this.guiContainer.addChild(markedTileInfoText)

    this.container.addChild(this.tileContainer)
    this.container.addChild(this.tileContainer)
    this.container.addChild(this.henContainer)
    this.container.addChild(this.markerSprite)
    this.container.addChild(this.guiContainer)
    global.baseStage.addChild(this.container)

    var onBuildResidence = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.sprites.RESIDENCE.visible = true
      markedTile.type = gameVars.RESIDENCE
      buildRoadInTile(markedTile)

      var hen = new Citizen(markedTile, findPathToTarget, findClosestTileOfType, getTile)
      this.henContainer.addChild(hen.sprite)
      hens.push(hen)

      updateMarkedTileInfoText()

    }.bind(this)

    var onBuildCommerce = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.sprites.COMMERCE.visible = true
      markedTile.type = gameVars.COMMERCE
      buildRoadInTile(markedTile)
      updateMarkedTileInfoText()
    }

    var onBuildIndustry = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.sprites.INDUSTRY.visible = true
      markedTile.type = gameVars.INDUSTRY
      buildRoadInTile(markedTile)
      updateMarkedTileInfoText()
    }

    var onBuildRoad = function () {
      buildRoadInTile(markedTile)
      updateMarkedTileInfoText()
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
      if (tile.type === gameVars.RESIDENCE) {
        residenceCount++
      } else if (tile.type === gameVars.COMMERCE) {
        commerceCount++
      } else if (tile.type === gameVars.INDUSTRY) {
        industryCount++
      }
    }

    zoneCountText.text = 'R: ' + residenceCount + '\n' +
        'C: ' + commerceCount + '\n' +
        'I: ' + industryCount

    easystar.calculate()

    for (var i = 0; i < hens.length; i++) {
      var hen = hens[i]

      hen.update()
    }
  },
  draw: function () {
    global.renderer.render(this.container)
  },
}

module.exports = gameScene
