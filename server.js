var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');
//var redis = require("redis")
//var db = redis.createClient();
var _ = require('./underscore-min.js');
var utils = require('./utils.js')

// Reusing gameboard logic on the server
var board = require("./board.js");

//db.on("error", function (err) {
//  console.log("DB Error " + err);
//});

var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var connections = {}
var users = {};
var games = {};
var boards = {};

var stones = ["black", "white"];

var otherThan = function(list, item) {
  return _.without(list, item)[0];
}


var sockjs_game = sockjs.createServer(sockjs_opts);
sockjs_game.on('connection', function(conn) {

  conn.sendjson = function (command, data) {
    return this.write(JSON.stringify(_.extend({},{command: command}, data)));
  };

  var id = utils.UUID(true);
  connections[id] = conn;

  conn.on('data', function(message) {
    var data = JSON.parse(message);
    var command = data.command;
    var userName = data.userName;
    console.log("DATA", data, command, userName);
    delete data.userName;
    delete data.command;
    switch (command) {
    case "user:new":
      if(users[userName])
        conn.sendjson("user:new", {error: "Username is taken"});
      users[userName] = {userName: userName, games: {}, won: 0, lost: 0};
      delete connections[id];
      id = userName;
      connections[id] = conn;
      break;
    case "user:login":
      delete connections[id];
      id = userName;
      connections[id] = conn;
      break;
    case "user:list":
      conn.sendjson("user:list", users)
      break;
    case "game:new":
      data.participants = [userName];
      data.stones = {};
      games[data.gameId] = data;
      boards[data.gameId] = new board.Grid(data.boardSize);
      users[userName]['games'][data.gameId] = {userColor: data.userColor};
      console.log("CONN", connections)
      _.each(connections, function(v, k){
        return v.sendjson("game:added", games[data.gameId]);
      });
      break;
    case "game:list":
      conn.sendjson("game:list", games);
      break;
    case "game:join":
      game = games[data.gameId];
      if (game.status !== "open") {
        conn.sendjson("error", "The game is not available for joining");
        break;
      }
      var takenColor = users[game.participants[0]]['games'][game.gameId].userColor;
      var newColor = otherThan(stones, takenColor);
      game.participants.push(id);
      game.status = "playing";
      users[id]['games'][data.gameId]  = {userColor: newColor};
      conn.sendjson("game:joined", game);
      break;
    case "game:turn":
      var game = games[data.gameId];
      if (game.status !== "playing") {
        conn.sendjson('game:turn', {gameId: data.gameId, error: "Game not ready to play"});
        break;
      };
      var playerGame = users[userName]['games'][data.gameId];
      if (!playerGame) {
        conn.sendjson('game:turn', {gameId: data.gameId, error: "Not your game"});
        break;
      }

      if (game.turnOrder !== playerGame.userColor ) {
        conn.sendjson('game:turn', {gameId: data.gameId, error: "Not your turn"});
        break;
      }
      var cell = boards[data.gameId].GetCellByCoOrd(data.cell.cX, data.cell.cY);
      cell.stone = game.turnOrder;
      game.stones[cell.Id] = cell.stone;
      game.turnOrder = otherThan(stones, game.turnOrder);

      _.each(game.participants, function(v) {

        var c = connections[v];
        c.sendjson('game:turned', {game: game, cell: {Id: cell.Id, stone: cell.stone}});
      });

      var hasWon = utils.isWinningTurn(game, boards[game.gameId] cell);
      if (hasWon) {
        console.log("WON", hasWon);
        game.status = "finished"
        game.winner = userName;
        users[userName].won += 1;
        users[otherThan(game.participants, userName)].lost += 1;
        _.each(game.participants, function(v) {

          var c = connections[v];
          c.sendjson('game:finished', game);
        });
      }

      console.log("STONE", data.gameId, cell.stone, game.turnOrder);

      break;
    }
  });

  conn.on('close', function() {
    delete connections[id];
    console.log('Lost connection');
  });

});

var static_directory = new node_static.Server(__dirname);

var server = http.createServer();
server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});
server.addListener('upgrade', function(req,res){
    res.end();
});

sockjs_game.installHandlers(server, {prefix:'/game'});

console.log(' [*] Listening on 0.0.0.0:9999' );
server.listen(9999, '0.0.0.0');
