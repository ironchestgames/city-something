var gameVars = require('./gameVars')

var loadingScene = {
  name: 'loadingScene',
  create: function (sceneParams) {

    // fetch assets
    PIXI.loader

    .add('marker', 'assets/images/marker.png')

    .add('hen001', 'assets/images/hen001.png')

    .add('forest_1', 'assets/images/forest_1.png')
    .add('residences_1', 'assets/images/residences_1.png')
    .add('commerce_1', 'assets/images/commerce_1.png')
    .add('industry_1', 'assets/images/industry_1.png')

    .add('road_W', 'assets/images/road_W.png')
    .add('road_E', 'assets/images/road_E.png')
    .add('road_S', 'assets/images/road_S.png')
    .add('road_N', 'assets/images/road_N.png')
    .add('road_R', 'assets/images/road_R.png')
    
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
