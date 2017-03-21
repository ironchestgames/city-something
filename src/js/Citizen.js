var gameVars = require('./gameVars')

var idCounter = 0

var Citizen = function (startTile, findPathToTarget, findClosestTileOfType, getTile) {

  // set interface
  this.findPathToTarget = findPathToTarget
  this.findClosestTileOfType = findClosestTileOfType
  this.getTile = getTile

  // values
  this.id = idCounter++
  this.tileX = startTile.x
  this.tileY = startTile.y
  this.speed = 2.689
  this.tilePath = []
  this.workPlace = null
  this.target = null
  this.home = startTile
  this.workDay = 33 * 12 / 3
  this.workDayCount = 0
  this.energy = 1000
  this.happiness = 1000
  this.state = Citizen.STATE_RESTING

  // sprites
  this.sprite = new PIXI.Sprite(PIXI.loader.resources['hen001'].texture)
  this.sprite.anchor.x = 0.5
  this.sprite.anchor.y = 0.5
  this.sprite.visible = false
}

Citizen.prototype.stateRestingUpdate = function () {

  this.energy += 1.5
  this.happiness += 0.1

  if (this.energy > 1000) {
    this.energy = 1000
  }

  if (this.happiness < 200 && this.energy > 400) {

    var closestCommerce = this.findClosestTileOfType(this, gameVars.COMMERCE)

    if (closestCommerce) {
      this.target = closestCommerce
      this.findPathToTarget(this)
    }

  } else if (this.workPlace) {

    if (this.energy > 500) {
      this.target = this.workPlace
      this.findPathToTarget(this)
    }

  } else {

    this.workPlace = this.findClosestTileOfType(this, gameVars.INDUSTRY)

  }
}

Citizen.prototype.stateWalkingUpdate = function () {

  this.energy -= 0.2
    
  var nextTileInPath = this.tilePath[0]

  var dx = nextTileInPath.x * 64 - this.sprite.x
  var dy = nextTileInPath.y * 64 - this.sprite.y

  var angle = Math.atan2(dy, dx)

  var speed = this.speed

  this.sprite.x += Math.cos(angle) * speed
  this.sprite.y += Math.sin(angle) * speed

  var distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < this.speed + 0.1) {
    // console.log(nextTileInPath.x, nextTileInPath.y)
    var reachedPoint = this.tilePath.shift()
    this.tileX = reachedPoint.x
    this.tileY = reachedPoint.y
  }

  if (this.tilePath.length === 0) {
    if (this.target === this.home) {
      this.state = Citizen.STATE_RESTING
    } else if (this.target === this.workPlace) {
      this.state = Citizen.STATE_WORKING
      this.workDayCount = 0
    } else if (this.target.type === gameVars.COMMERCE) {
      this.state = Citizen.STATE_ENJOYING
    }

    this.sprite.visible = false
    // console.log('stopped walking', hen)
  }

}

Citizen.prototype.stateWorkingUpdate = function () {

  this.workDayCount += 1
  this.energy -= 1
  this.happiness -= 1

  if (this.workDayCount > this.workDay) {

    this.workDayCount = 0
    this.target = this.home
    this.findPathToTarget(this)

  }
}

Citizen.prototype.stateEnjoyingUpdate = function () {

  this.happiness += 1

  if (this.happiness > 500) {
    this.target = this.home
    this.findPathToTarget(this)
  }
}

Citizen.prototype.update = function () {

  if (this.state === Citizen.STATE_RESTING) {

    this.stateRestingUpdate()

  } else if (this.state === Citizen.STATE_WALKING && this.tilePath && this.tilePath.length) {

    this.stateWalkingUpdate()  

  } else if (this.state === Citizen.STATE_WORKING) {

    this.stateWorkingUpdate()

  } else if (this.state === Citizen.STATE_ENJOYING) {

    this.stateEnjoyingUpdate()

  }
}

Citizen.STATE_RESTING = 'STATE_RESTING'
Citizen.STATE_WALKING = 'STATE_WALKING'
Citizen.STATE_WORKING = 'STATE_WORKING'
Citizen.STATE_ENJOYING = 'STATE_ENJOYING'

module.exports = Citizen
