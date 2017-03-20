var gameVars = require('./gameVars')

var loadingScene = {
  name: 'loadingScene',
  create: function (sceneParams) {

    // fetch assets
    PIXI.loader

    .add('marker', 'assets/images/marker.png')

    .add('forest_1', 'assets/images/forest_1.png')
    .add('residences_1', 'assets/images/residences_1.png')
    .add('commerce_1', 'assets/images/commerce_1.png')
    .add('industry_1', 'assets/images/industry_1.png')

    .add('road_W', 'assets/images/road_W.png')
    .add('road_WE', 'assets/images/road_WE.png')
    .add('road_WS', 'assets/images/road_WS.png')
    .add('road_WSE', 'assets/images/road_WSE.png')
    .add('road_WSEN', 'assets/images/road_WSEN.png')
    
    .load(function () {
      this.changeScene(localStorage.scene || 'gameScene', sceneParams)
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
