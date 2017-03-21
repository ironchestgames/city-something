
var idCounter = 0

// states
var HEN_RESTING = 'HEN_RESTING'

var Citizen = function (startTile) {
  this.id = idCounter++
  this.x = startTile.x
  this.y = startTile.y
  this.speed = 2.689
  this.path = []
  this.workPlace = null
  this.target = null
  this.home = startTile
  this.workDay = 33 * 12 / 3
  this.workDayCount = 0
  this.energy = 1000
  this.happiness = 1000
  this.state = HEN_RESTING
  
  this.sprite = new PIXI.Sprite(PIXI.loader.resources['hen001'].texture)
  this.sprite.anchor.x = 0.5
  this.sprite.anchor.y = 0.5
  this.sprite.visible = false
}

module.exports = Citizen
