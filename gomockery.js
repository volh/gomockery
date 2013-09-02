document.addEventListener( "DOMContentLoaded", function(){

  Gomockery.Game = Backbone.Model.extend({

    'idAttribute': 'gameId',

    defaults: function () {
      return {
        'gameId': Gomockery.Utils.UUID(true),
        'status': 'open',
        'turnOrder': 'black',
        'userName': Gomockery.User
      }
    },

    initialize: function (options) {
    },

    turn: function (cell, callback) {
      Gomockery.app.send("game:turn", {
        userName: Gomockery.User, gameId: this.get("gameId"), cell: cell
      });
    }

  });

  Gomockery.GameList = Backbone.Collection.extend({

    model: Gomockery.Game,

    initialize: function() {
      this.on("add", this.send);
      Gomockery.app.on("socket:ready", this.fetch, this);
    },

    send: function (game, collection, options) {
      if (options.send)
        Gomockery.app.send("game:new", game.toJSON());
    },

    fetch: function() {
      Gomockery.app.send("game:list");
    }

  });

  Gomockery.User = Backbone.Model.extend({

    'idAttribute': 'userName',

    initialize: function (options) {
    },

  });

  Gomockery.UserList = Backbone.Collection.extend({

    // Sort by number of wins
    comparator: function (m) {
      return -m.get('won');
    },

    model: Gomockery.User,

    initialize: function() {
      Gomockery.app.on("socket:ready", this.fetch, this);
    },

    fetch: function() {
      Gomockery.app.send("user:list");
    }

  });


  Gomockery.UserListView = Backbone.View.extend({
    container: $("#main"),

    initialize: function(options) {
      this.collection = options.collection;
      this.collection.on("reset", this.render, this);
      this.collection.on("add", this.render, this);
      this.collection.on("change", this.render, this);
    },

    render: function () {
      this.container.html(_.template($("#user-table-data").html(),{items: this.collection}));
    }

  });


  // A helpful view for forms
  Gomockery.FormView = Backbone.View.extend({
    serialize: function () {
      var data = {}
      _.each(this.$el.find('input,select'), function(i){
        data[i.id] = i.value || i.placeholder ;
      });
      return data;
    }
  });

  Gomockery.GameListView = Backbone.View.extend({
    container: $("#main"),

    initialize: function(options) {
      this.collection = options.collection;
      this.collection.on("reset", this.render, this);
      this.collection.on("add", this.render, this);
      this.collection.on("change", this.render, this);
    },

    render: function () {
      this.container.html(_.template($("#table-data").html(),{items: this.collection}));
    }

  });

  Gomockery.NewUserView = Gomockery.FormView.extend({
    container: $("#main"),
    el: _.template($("#new-user-template").html())(),

    events: {
      "click #createUser": "createUser"
    },

    initialize: function(options) {

    },

    render: function () {
      this.container.html($(this.el));
    },

    createUser: function() {
      var data = this.serialize();
      if (!data.userName)
        return false;

      console.log("NEW User", data);
      var game = Gomockery.app.send("user:new", data);
      Gomockery.User = data.userName;
      Gomockery.app.trigger("loggedin");
      localStorage["GomockeryUser"] = Gomockery.User;
      if (Gomockery.app.games.where({status: 'open'}).length > 0) {
        Gomockery.app.navigate("list", true);
      } else {
        Gomockery.app.navigate("new", true);
      }
      return false;
    }
  });

  Gomockery.SetupGameView = Gomockery.FormView.extend({
    container: $("#main"),
    el: _.template($("#board-init-template").html())(),

    events: {
      "click #createGame": "addGame"
    },

    initialize: function(options) {

    },

    render: function () {
      this.container.html($(this.el));
    },

    addGame: function() {
      var data = this.serialize();
      console.log("ADD Game", data);
      var id = Gomockery.Utils.UUID(true);
      var game = Gomockery.app.games.add(_.extend(data, {gameId: id}), {send: true});
      Gomockery.app.navigate("game/" + id, true);
      return false;
    }
  });

  Gomockery.GameView = Backbone.View.extend({
    container: $("#main"),
    el: _.template($("#board-template").html())(),

    events: {
      "click": "makeTurn"
    },

    initialize: function(options) {
      this.game = Gomockery.app.games.findWhere({gameId: options.gameId});

      if (!this.game) {
        Gomockery.app.games.on("reset", function() {
          this.initialize(options);
          this.render();
        }, this);
        return false;
      }

      var size = this.game.get('boardSize') || 5;
      this.grid = new Gomockery.Grid(size);
      _.each(this.game.get('stones'), function(stone, id) {
        console.log("STONE", id, stone);
        this.grid.GetCellById(id).stone = stone;
      }, this);

      Gomockery.app.on("game:turned", this.addStone, this);
      Gomockery.app.on("game:finished", this.finish, this);
    },

    addStone: function(data) {
      if (data.game.gameId == this.game.get('gameId') && !data.error) {
        var cell = this.grid.GetCellById(data.cell.Id);
        cell.stone = data.cell.stone;
        this.drawStone(cell);
      }
    },

    finish: function (data) {
      if (data.gameId == this.game.get('gameId')) {
        alert(data.winner.replace(Gomockery.User,"you") + " won!");
      };
    },

    drawStone: function(cell) {
      cell.drawStone(this.ctx, cell.stone);
    },

    render: function() {
      if (!this.game)
        return false;

      this.container.html(this.el);
      this.el.width = this.grid.width;
      this.el.height = this.grid.height;

      this.ctx = this.el.getContext('2d');
      this.ctx.clearRect(0, 0, this.grid.width, this.grid.height);
      _.each(this.grid.Cells, function (cell) {
        cell.draw(this.ctx);
        if (cell.stone)
          this.drawStone(cell);
      }, this);

      return this;

    },

    makeTurn: function(e) {
      var cell = this.findCell(e);
      if (!cell || cell.stone)
        return false;
      this.game.turn(cell);
    },

    findCell: function (e) {
      var x;
      var y;
      if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
      }
      else {
        x = e.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop +
          document.documentElement.scrollTop;
      }

      x -= this.el.offsetLeft;
      y -= this.el.offsetTop;

      return this.grid.GetCellAt(new Gomockery.Point(x, y));
    }

  });

  Gomockery.Router = Backbone.Router.extend({
    initialize: function() {

      var that = this;
      this.indexTemplate = _.template($("#index-template").html())();
      this.sock = new SockJS('/game');
      this.sock.onopen = function() {
        that.trigger("socket:ready");
        console.log('open');
        if (Gomockery.User) {
          that.trigger('loggedin')
          that.send("user:login", {userName: Gomockery.User});
        }
      };

      this.sock.onmessage = function(e) {
        var data = JSON.parse(e.data)
        var command = data.command;
        delete data.command;
        console.log('message', data);
        that.trigger(command, data);
        that.parseMessage(command, data);
      };

      this.sock.onclose = function() {
        console.log('close');
      };

      this.on('loggedin', function () {
        $("#currentUser").html(_.template($("#current-user-template").html(), {user: Gomockery.User}));
      });

      //this.on("route:joinGame route:newGame", this.checkForUser);
      this.on("route", function(name){
        $("#navbar li").removeClass('active');
        $("#navbar #" + name).addClass('active');
      });
    },

    defaults: {
      "trigger": true,
      "replace": true
    },

    routes: {
      "new": "newGame",
      "join/:id": "joinGame",
      "game/:id": "showGame",
      "leaderboard": "leaderBoard",
      "signup": "addNewUser",
      "list": "allGames",
      "*actions": "defaultRoute" // matches http://example.com/#anything-here
    },

    parseMessage: function (command, data) {
      if (data.error)
        console.warn("ERROR", data.error);

      switch (command) {
      case "game:list":
        this.games.reset(_.toArray(data));
        break;
      case "user:list":
        this.users.reset(_.toArray(data));
        break;
      case "game:added":
        this.games.add(data);
        break;
      case "game:turned":
        var game = this.games.findWhere({gameId: data.gameId});
        //var cell = game.grid.GetCellById(data.cell.Id);
        //cell.stone = data.cell.stone;
      }
    },

    newGame: function() {
      var view = new Gomockery.SetupGameView();
      this.render(view);
    },

    joinGame: function(id) {
      this.once("game:joined", function(data) {
        if (data.error)
          console.log("ERROR", data.error);
        this.navigate("game/" + id, true);
      }, this);

      this.send("game:join", {gameId: id});
    },

    allGames: function() {
      var view = new Gomockery.GameListView({collection: this.games})
      this.render(view);
    },

    leaderBoard: function() {
      var view = new Gomockery.UserListView({collection: this.users})
      this.render(view);
    },

    checkForUser: function() {
      if (!Gomockery.User)
        this.navigate("",true);
    },

    addNewUser: function() {
      var view = new Gomockery.NewUserView();
      this.render(view);
    },

    showGame: function (id) {
      var view = new Gomockery.GameView({gameId: id});
      this.render(view);
    },

    defaultRoute: function(actions) {
      if (Gomockery.User) {
        if (Gomockery.app.games.where({status: 'open'}).length > 0) {
          Gomockery.app.navigate("list", true);
        } else {
          Gomockery.app.navigate("new", true);
        }
      }
      else{
        $("#main").html(this.indexTemplate);
      }
    },

    toggleDebug: function () {
      Gomockery.DEBUG = !Gomockery.DEBUG;
      this.currentView.render();
    },

    render: function (view) {
      if (this.currentView)
        this.currentView.remove();
      this.currentView = view;
      this.currentView.render();
    },

    send: function (command, data) {
      this.sock.send(JSON.stringify(_.extend({}, {command: command}, data)));
    }
  });

  Gomockery.app = new Gomockery.Router();
  Gomockery.app.games =  new Gomockery.GameList();
  Gomockery.app.users =  new Gomockery.UserList();
  Gomockery.User = localStorage["GomockeryUser"];
  if (Gomockery.User)
    Gomockery.app.trigger("loggedin");

  Backbone.history.start();

});
