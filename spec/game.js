var board = require("../board.js");
var utils = require("../utils.js");
var _ = require("../underscore-min.js");

describe("Game", function() {
  var color = "white";
  var size = 15;
  var grid;
  var game = {gameId: "328ebb12", winSize: 5};

  beforeEach(function() {
    grid = new board.Grid(size);
  });

  it("allows to find cells", function() {
    expect(grid.GetCellByCoOrd).no.toBeUndefined();
    expect(grid.GetCellByCoOrd(5,8).cY).toEqual(8);
  });

  it("determines win by going vertically up", function() {
    var mainCell = grid.GetCellByCoOrd(7,8);
    mainCell.stone = color;
    for (var i = 8; i == 4; i-- ) {
      grid.GetCellByCoOrd(7,i).stone = color;
    }
    expect(utils.isWinningTurn(game, grid, mainCell)).toEqual("up");
  });

}
