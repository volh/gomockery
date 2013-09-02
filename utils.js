if (typeof require !== 'undefined')
  var _ = require("./underscore-min.js");

var Gomockery = Gomockery || {};

var S4 = function () {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

Gomockery.Utils = {

  UUID: function (short) {
    if (short) {
      return S4() + S4();
    }
    else {
      return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4();
    }
  },

  isWinningTurn: function (game, grid, cell) {

    var n = game.winSize - 1;

    // TODO cleanup when have time
    // up
    var cells = _.filter(grid.Cells, function(i) {
      return i.stone == cell.stone
        && i.cX == cell.cX
        && (cell.cY - i.cY <= n || cell.cY - i.cY > 0)
    });

    if ( cells.length == game.winSize )
      return "up";

    // down
    cells = _.filter(grid.Cells, function(i) {
      return i.stone == cell.stone
        && i.cX == cell.cX
        && (i.cY - cell.cY <= n || i.cY - cell.cY > 0)
    });

    if ( cells.length == game.winSize )
      return "down";

    // lu

    var cX = cell.cX; var cY = cell.cY;
    for (var i = 0; i <= n; i++) {
      console.log("X", cX, "Y", cY);
      if (cX % 2 != 0) {
        cY = cY - 2;
      }
      cX = cX - 1;
      c1 = grid.GetCellByCoOrd(cX,cY)
      if(!c1 || c1.stone !== cell.stone)
        break;
      if (i == n-1)
        return "lu";
    }

    // rd

    cX = cell.cX; cY = cell.cY;
    for (var i = 0; i <= n; i++) {
      console.log("X", cX, "Y", cY);
      if (cX % 2 == 0) {
        cY = cY + 2;
      }
      cX = cX + 1;
      c1 = grid.GetCellByCoOrd(cX,cY)
      if(!c1 || c1.stone !== cell.stone)
        break;
      if (i == n-1)
        return 'rd';

    }

    // ld
    cX = cell.cX; cY = cell.cY;
    for (var i = 0; i <= n; i++) {
      console.log("X", cX, "Y", cY);
      if (cX % 2 == 0) {
        cY = cY + 1;
      } else {
        cY = cY - 1
      }
      cX = cX - 1;
      c1 = grid.GetCellByCoOrd(cX,cY)
      if(!c1 || c1.stone !== cell.stone)
        break;
      if (i == n-1)
        return 'ld';

    }

    // ru

    cX = cell.cX; cY = cell.cY;
    for (var i = 0; i <= n; i++) {
      console.log("X", cX, "Y", cY);
      if (cX % 2 == 0) {
        cY = cY + 1;
      } else {
        cY = cY - 1
      }
      cX = cX + 1;
      c1 = grid.GetCellByCoOrd(cX,cY)
      if(!c1 || c1.stone !== cell.stone)
        break;
      if (i == n-1)
        return 'lu';

    }
    return false;

  }


}

if (typeof module !== "undefined")
  module.exports = Gomockery.Utils
