var Gomockery = Gomockery || {};

Gomockery.DEBUG = false;

Gomockery.Point = function(x, y) {
  this.x = x;
  this.y = y;
};

Gomockery.Cell = function(id, x, y) {

  this.Points = [];
  var x1 = null;
  var y1 = null;

  x1 = (Gomockery.CellWidth - Gomockery.CellSide)/2;
  y1 = (Gomockery.CellHeight / 2);
  this.Points.push(new Gomockery.Point(x1 + x, y));
  this.Points.push(new Gomockery.Point(x1 + Gomockery.CellSide + x, y));
  this.Points.push(new Gomockery.Point(Gomockery.CellWidth + x, y1 + y));
  this.Points.push(new Gomockery.Point(x1 + Gomockery.CellSide + x, Gomockery.CellHeight + y));
  this.Points.push(new Gomockery.Point(x1 + x, Gomockery.CellHeight + y));
  this.Points.push(new Gomockery.Point(x, y1 + y));



  this.Id = id;

  this.x = x;
  this.y = y;
  this.x1 = x1;
  this.y1 = y1;

  this.TopLeftPoint = new Gomockery.Point(this.x, this.y);
  this.BottomRightPoint = new Gomockery.Point(this.x + Gomockery.CellWidth, this.y + Gomockery.CellHeight);
  this.MidPoint = new Gomockery.Point(this.x + (Gomockery.CellWidth / 2), this.y + (Gomockery.CellHeight / 2));

  this.P1 = new Gomockery.Point(x + x1, y + y1);

  this.selected = false;
};


Gomockery.Cell.prototype.draw = function(ctx) {

  ctx.strokeStyle = "black";
  ctx.fillStyle = "#dcb35c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(this.Points[0].x, this.Points[0].y);
  for(var i = 1; i < this.Points.length; i++)
  {
    var p = this.Points[i];
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if(Gomockery.DEBUG)
  {
    ctx.fillStyle = "black"
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
    ctx.fillText(this.Id, this.MidPoint.x, this.MidPoint.y);

    ctx.fillStyle = "black"
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
    ctx.fillText("("+this.cX+","+this.cY+")", this.MidPoint.x, this.MidPoint.y + 10);
  }

};

Gomockery.Cell.prototype.drawStone = function (ctx, color) {
  if (this.drawn)
    return false;

  ctx.beginPath();
  ctx.arc(this.MidPoint.x, this.MidPoint.y, Gomockery.CellWidth / 4, 0, Math.PI * 2, false);
  ctx.closePath();
  ctx.strokeStyle = "#000";
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
  this.drawn = true;
}

/**
 * Returns true if the x,y coordinates are inside this hexagon
 * @this {Gomockery.Cell}
 * @return {boolean}
 */
Gomockery.Cell.prototype.isInBounds = function(x, y) {
  return this.Contains(new Gomockery.Point(x, y));
};


/**
 * Returns true if the point is inside this hexagon, it is a quick contains
 * @this {Gomockery.Cell}
 * @param {Gomockery.Point} p the test point
 * @return {boolean}
 */
Gomockery.Cell.prototype.isInCellBounds = function(/*Point*/ p) {
  if(this.TopLeftPoint.x < p.x && this.TopLeftPoint.y < p.y &&
     p.x < this.BottomRightPoint.x && p.y < this.BottomRightPoint.y)
    return true;
  return false;
};

//grabbed from:
//http://www.developingfor.net/c-20/testing-to-see-if-a-point-is-within-a-polygon.html
//and
//http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#The%20C%20Code
/**
 * Returns true if the point is inside this hexagon, it first uses the quick isInCellBounds contains, then check the boundaries
 * @this {Gomockery.Cell}
 * @param {Gomockery.Point} p the test point
 * @return {boolean}
 */
Gomockery.Cell.prototype.Contains = function(/*Point*/ p) {
  var isIn = false;
  if (this.isInCellBounds(p))
  {
    //turn our absolute point into a relative point for comparing with the polygon's points
    //var pRel = new Gomockery.Point(p.x - this.x, p.y - this.y);
    var i, j = 0;
    for (i = 0, j = this.Points.length - 1; i < this.Points.length; j = i++)
    {
      var iP = this.Points[i];
      var jP = this.Points[j];
      if (
	(
	  ((iP.y <= p.y) && (p.y < jP.y)) ||
	    ((jP.y <= p.y) && (p.y < iP.y))
	  //((iP.y > p.y) != (jP.y > p.y))
	) &&
	  (p.x < (jP.x - iP.x ) * (p.y - iP.y) / (jP.y - iP.y) + iP.x)
      )
      {
	isIn = !isIn;
      }
    }
  }
  return isIn;
};


/**
 * A Grid is the model of the playfield containing hexes
 * @constructor
 */
Gomockery.Grid = function(size) {
  var z = 40;
  var r = 1.1547005383792515290182975610039;

  //solve quadratic
  var r2 = Math.pow(r, 2);
  var a = (1 + r2)/r2;
  var b = z/r2;
  var c = ((1-4.0*r2)/(4.0*r2)) * (Math.pow(z, 2));

  var x = (-b + Math.sqrt(Math.pow(b,2)-(4.0*a*c)))/(2.0*a);

  var y = ((2.0 * x) + z)/(2.0 * r);

  var width = ((2.0*x)+z);
  var height = (2.0*y);

  Gomockery.CellWidth = width;
  Gomockery.CellHeight = height;
  Gomockery.CellSide = z;

  this.width = (Gomockery.CellWidth / 2 ) * size * 1.5 + (Gomockery.CellWidth / 4) ;
  this.height = Gomockery.CellHeight / 2 + Gomockery.CellHeight * size + size*2;

  this.Cells = [];
  //setup a dictionary for use later for assigning the X or Y CoOrd
  var CellsByXOrYCoOrd = {}; //Dictionary<int, List<Cell>>

  var row = 0;
  var y = 0.0;
  while (y + Gomockery.CellHeight <= this.height)
  {

    var col = 0;

    var offset = 0.0;
    // if even
    if (row % 2 == 0)
    {
      offset = (Gomockery.CellWidth - Gomockery.CellSide)/2 + Gomockery.CellSide;
      col = 1;
    }

    var x = offset;
    while (x + Gomockery.CellWidth <= this.width)
    {
      var cellId = this.GetCellId(row, col);
      var h = new Gomockery.Cell(cellId, x, y);

      var pathCoOrd = col;
      h.cX = col;//the column is the x coordinate of the hex, for the y coordinate we need to get more fancy

      this.Cells.push(h);

      if (!CellsByXOrYCoOrd[pathCoOrd])
	CellsByXOrYCoOrd[pathCoOrd] = [];
      CellsByXOrYCoOrd[pathCoOrd].push(h);

      col+=2;
      x += Gomockery.CellWidth + Gomockery.CellSide;
    }
    row++;
    y += Gomockery.CellHeight / 2;
  }

  //finally go through our list of hexagons by their x co-ordinate to assign the y co-ordinate
  for (var coOrd1 in CellsByXOrYCoOrd)
  {
    var hexagonsByXOrY = CellsByXOrYCoOrd[coOrd1];
    var coOrd2 = Math.floor(coOrd1 / 2) + (coOrd1 % 2);
    for (var i in hexagonsByXOrY)
    {
      var h = hexagonsByXOrY[i];//Cell
      h.cY = coOrd2++;
    }
  }
};

Gomockery.Grid.Static = {Letters:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'};

Gomockery.Grid.prototype.GetCellId = function(row, col) {
  var letterIndex = row;
  var letters = "";
  while(letterIndex > 25)
  {
    letters = Gomockery.Grid.Static.Letters[letterIndex%26] + letters;
    letterIndex -= 26;
  }

  return Gomockery.Grid.Static.Letters[letterIndex] + letters + (col + 1);
};

/**
 * Returns a hex at a given point
 * @this {Gomockery.Grid}
 * @return {Gomockery.Cell}
 */
Gomockery.Grid.prototype.GetCellAt = function(/*Point*/ p) {
  //find the hex that contains this point
  for (var h in this.Cells)
  {
    if (this.Cells[h].Contains(p))
    {
      return this.Cells[h];
    }
  }

  return null;
};

/**
 * Returns a distance between two hexes
 * @this {Gomockery.Grid}
 * @return {number}
 */
Gomockery.Grid.prototype.GetCellDistance = function(/*Cell*/ h1, /*Cell*/ h2) {
  //a good explanation of this calc can be found here:
  //http://playtechs.blogspot.com/2007/04/hex-grids.html
  var deltaX = h1.cX - h2.cX;
  var deltaY = h1.cY - h2.cY;
  return ((Math.abs(deltaX) + Math.abs(deltaY) + Math.abs(deltaX - deltaY)) / 2);
};

/**
 * Returns a distance between two hexes
 * @this {Gomockery.Grid}
 * @return {Gomockery.Cell}
 */
Gomockery.Grid.prototype.GetCellById = function(id) {
  for(var i in this.Cells)
  {
    if(this.Cells[i].Id == id)
    {
      return this.Cells[i];
    }
  }
  return null;
};

/**
 * Returns a distance between two hexes
 * @this {Gomockery.Grid}
 * @return {Gomockery.Cell}
 */
Gomockery.Grid.prototype.GetCellByCoOrd = function(X,Y) {
  for(var i in this.Cells)
  {
    if(this.Cells[i].cX == X && this.Cells[i].cY == Y)
    {
      return this.Cells[i];
    }
  }
  return null;
};

if (typeof module !== "undefined") {
  module.exports = Gomockery;
}
