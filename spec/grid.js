var board = require("../board.js");
var _ = require("../underscore-min.js");

describe("Hex grid", function() {
  var size = 15
  var grid = new board.Grid(size);

  it("properly initializes", function() {
    expect(typeof grid).toBe("object");
  });


  it("adds Cells", function() {
    expect(grid.Cells).no.toBeUndefined();
  });

  it("adds enough Cells", function() {
    expect(grid.Cells.length).toEqual(size*size);
  });

  it("sets up proper inner coordinates", function() {
    var lastCell = _.last(grid.Cells);
    expect(lastCell.cX).toEqual(21);
    expect(lastCell.cY).toEqual(14);
  });
}
