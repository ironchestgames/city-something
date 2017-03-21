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
var residenceWalkingCost = 3

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
  for (var spriteKey in tile.typeSprites) {
    if (tile.typeSprites.hasOwnProperty(spriteKey)) {
      tile.typeSprites[spriteKey].visible = false
    }
  }
}

var updateRoads = function () {
  for (var i = 0; i < tiles.length; i++) {
    var currentTile = tiles[i]

    for (var j in currentTile.roadSprites) {
      currentTile.roadSprites[j].visible = false
    }

    var neighbors = [
      getTile(currentTile.x - 1, currentTile.y), // W
      getTile(currentTile.x, currentTile.y + 1), // S
      getTile(currentTile.x + 1, currentTile.y), // E
      getTile(currentTile.x, currentTile.y - 1), // N
    ]

    var neighborCount = 0
    for (var j = 0; j < neighbors.length; j++) {
      if (neighbors[j] && neighbors[j].terrain === gameVars.TERRAIN_URBAN) {
        neighborCount++
      }
    }

    if (currentTile.terrain === gameVars.TERRAIN_URBAN) {
      if (neighborCount === 0) {
        currentTile.roadSprites.R.visible = true
      } else {
        if (neighbors[0] && neighbors[0].terrain === gameVars.TERRAIN_URBAN) {
          currentTile.roadSprites.W.visible = true
        }
        if (neighbors[1] && neighbors[1].terrain === gameVars.TERRAIN_URBAN) {
          currentTile.roadSprites.S.visible = true
        }
        if (neighbors[2] && neighbors[2].terrain === gameVars.TERRAIN_URBAN) {
          currentTile.roadSprites.E.visible = true
        }
        if (neighbors[3] && neighbors[3].terrain === gameVars.TERRAIN_URBAN) {
          currentTile.roadSprites.N.visible = true
        }
      }
    }
  }
}

var buildRoadInTile = function (tile) {
  tile.terrain = gameVars.TERRAIN_URBAN
  easystarGrid[tile.y][tile.x] = gameVars.TERRAIN_URBAN

  updateRoads()
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
          typeSprites: {
            FOREST: new PIXI.Sprite(PIXI.loader.resources['forest_1'].texture),
            RESIDENCE: new PIXI.Sprite(PIXI.loader.resources['residences_1'].texture),
            COMMERCE: new PIXI.Sprite(PIXI.loader.resources['commerce_1'].texture),
            INDUSTRY: new PIXI.Sprite(PIXI.loader.resources['industry_1'].texture),
          },
          roadSprites: {
            W: new PIXI.Sprite(PIXI.loader.resources['road_W'].texture),
            S: new PIXI.Sprite(PIXI.loader.resources['road_S'].texture),
            E: new PIXI.Sprite(PIXI.loader.resources['road_E'].texture),
            N: new PIXI.Sprite(PIXI.loader.resources['road_N'].texture),
            R: new PIXI.Sprite(PIXI.loader.resources['road_R'].texture),
          },
        }

        for (var spriteKey in tile.typeSprites) {
          if (tile.typeSprites.hasOwnProperty(spriteKey)) {
            tile.container.addChild(tile.typeSprites[spriteKey])
          }
        }

        hideAllSpritesInTile(tile)

        for (var spriteKey in tile.roadSprites) {
          if (tile.roadSprites.hasOwnProperty(spriteKey)) {
            var roadSprite = tile.roadSprites[spriteKey]
            roadSprite.visible = false
            tile.container.addChild(roadSprite)
          }
        }

        var inputArea = new PIXI.Sprite(PIXI.Texture.EMPTY)
        inputArea.width = 64
        inputArea.height = 64
        inputArea.interactive = true
        inputArea.tileId = tileIdCount
        inputArea.on('pointerdown', clickHandler)

        tile.container.addChild(inputArea)

        tile.typeSprites.FOREST.visible = true

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
      markedTile.typeSprites.RESIDENCE.visible = true
      markedTile.type = gameVars.RESIDENCE
      easystar.setAdditionalPointCost(markedTile.x, markedTile.y, residenceWalkingCost)
      buildRoadInTile(markedTile)

      var hen = new Citizen(markedTile, findPathToTarget, findClosestTileOfType, getTile)
      this.henContainer.addChild(hen.sprite)
      hens.push(hen)

      updateMarkedTileInfoText()

    }.bind(this)

    var onBuildCommerce = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.typeSprites.COMMERCE.visible = true
      markedTile.type = gameVars.COMMERCE
      buildRoadInTile(markedTile)
      updateMarkedTileInfoText()
    }

    var onBuildIndustry = function () {
      hideAllSpritesInTile(markedTile)
      markedTile.typeSprites.INDUSTRY.visible = true
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
