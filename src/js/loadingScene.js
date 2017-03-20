var gameVars = require('./gameVars')

var loadingScene = {
  name: 'loadingScene',
  create: function (sceneParams) {

    // fetch assets
    PIXI.loader

    // buttons
    // .add('image_asset001', 'assets/images/image_asset001.png')
    
    .load(function () {
      this.changeScene(localStorage.scene || 'splash', sceneParams)
    }.bind(this))
  },
  destroy: function () {

  },
  update: function () {

  },
  draw: function () {

  },
}

module.exports = loadingScene
