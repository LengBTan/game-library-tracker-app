var sqlite3 = require('sqlite3').verbose(); //verbose provides more detailed stack trace
var db = new sqlite3.Database('data/projectDB');

exports.index = function (request, response){
	// index.html
    let message = ''
    if(request.query.status === 'fail'){
        message = 'authentication failed'
    }
    else if(request.query.status === 'logout'){
        message = 'logged out'
    }

	response.render('index', {alert: message});
}

exports.games = function(request, response){
    console.log("listing games in the collection")

    let sql = `select user_game_list.userid, user_game_list.gameid, games.title 
            from user_game_list join games on user_game_list.gameid = 
            games.gameid where userid like '${request.session.userId}'`
    console.log(sql)
    db.all(sql , function(err, rows){
        response.render('games', {gameEntry:rows})
    })
    
}

exports.gameDetails = function(request, response){
    let gameId = url.parse(request.url)
    
}