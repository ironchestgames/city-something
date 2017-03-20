var KeyButton = require('./KeyButton')
var Easystarjs = require('easystarjs')

var easystar = new Easystarjs.js()
var easystarGrid = []

global.easystarGrid = easystarGrid

var WALKABLE = 0
var NON_WALKABLE = 1

var hen = null

var FOREST = 'FOREST'
var RESIDENCE = 'RESIDENCE'
var COMMERCE = 'COMMERCE'
var INDUSTRY = 'INDUSTRY'

var columnCount = 9
var rowCount = 9

var tiles = []
var markedTile = null

var hideAllSpritesInTile = function (tile) {
  for (var spriteKey in tile.sprites) {
    if (tile.sprites.hasOwnProperty(spriteKey)) {
      tile.sprites[spriteKey].visible = false
    }
  }
}

var buildRoadInTile = function (tile) {
  tile.roadSprite.visible = true
  tile.hasRoads = true

  for (var r = 0; r < rowCount; r++) {
    for (var c = 0; c < columnCount; c++) {
      easystarGrid[r][c] = tiles[(r * columnCount) + c].hasRoads === true ? WALKABLE : NON_WALKABLE
    }
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

    this.container = new PIXI.Container()

    this.henContainer = new PIXI.Container()
    this.henContainer.x = 100

    this.tileContainer = new PIXI.Container()
    this.tileContainer.x = 100

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

        easystarGrid[r].push(NON_WALKABLE)

        var tile = {
          id: tileIdCount,
          x: c,
          y: r,
          type: FOREST,
          hasRoads: false,
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

        this.tileContainer.addChild(tile.container)
        
        tiles.push(tile)

        tileIdCount++
      }
    }

    easystar.setGrid(easystarGrid)
    easystar.setAcceptableTiles([WALKABLE])

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
    }

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

    keyH = new KeyButton({
      key: 'h',
      onKeyDown: function () {
        hen = {
          x: markedTile.x,
          y: markedTile.y,
          speed: 2.689,
          path: [],
          target: tiles.find(function (tile) {
            return tile.type === INDUSTRY
          }),
          isWalking: false,
          sprite: new PIXI.Sprite(PIXI.loader.resources['hen001'].texture),
        }

        hen.sprite.visible = false

        this.henContainer.addChild(hen.sprite)

        easystar.findPath(hen.x, hen.y, hen.target.x, hen.target.y, function(path) {
          if (path !== null) {
            hen.path = path
            hen.isWalking = true
            hen.sprite.x = hen.x * 64
            hen.sprite.y = hen.y * 64
            hen.sprite.visible = true
          }
        })
      }.bind(this)
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

    if (hen && hen.isWalking) {
      
      var nextPathPoint = hen.path[0]

      var dx = nextPathPoint.x * 64 - hen.sprite.x
      var dy = nextPathPoint.y * 64 - hen.sprite.y

      var angle = Math.atan2(dy, dx)

      hen.sprite.x += Math.cos(angle) * hen.speed
      hen.sprite.y += Math.sin(angle) * hen.speed

      var distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < hen.speed + 0.1) {
        console.log(nextPathPoint.x, nextPathPoint.y)
        var reachedPoint = hen.path.shift()
        hen.x = reachedPoint.x
        hen.y = reachedPoint.y
      }

      if (hen.path.length === 0) {
        hen.isWalking = false
        console.log('stopped walking', hen)
      }
    }
  },
  draw: function () {
    global.renderer.render(this.container)
  },
}

module.exports = gameScene
