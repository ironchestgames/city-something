
var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {
    this.container = new PIXI.Container()
    global.baseStage.addChild(this.container)
  },
  destroy: function () {
    this.container.destroy()
  },
  update: function () {

  },
  draw: function () {
    global.renderer.render(this.container)
  },
}

module.exports = gameScene
