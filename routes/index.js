var sqlite3 = require('sqlite3').verbose(); //verbose provides more detailed stack trace
var db = new sqlite3.Database('data/projectDB');
const url = require('url')

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

function parseURL(request, response) {
    const PARSE_QUERY = true //parseQueryStringIfTrue
    const SLASH_HOST = true //slashDenoteHostIfTrue
    let urlObj = url.parse(request.url, PARSE_QUERY, SLASH_HOST)
    console.log('path:')
    console.log(urlObj.path)
    console.log('query:')
    console.log(urlObj.query)
    //for(x in urlObj.query) console.log(x + ': ' + urlObj.query[x])
    return urlObj
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
    //extract the gameid from the url
    let urlObj = parseURL(request, response)
    console.log(urlObj)
    let gameId = urlObj.path
    gameId = gameId.substring(gameId.lastIndexOf("/") + 1, gameId.length)
    console.log(gameId)

    //retrieve game data from the database
    let sql = `SELECT * FROM games WHERE gameid = ${gameId}`
    
    db.all(sql, function(err, rows){
        // response.render('gameDetails',{
        //     cover:rows.coverart,
        //     title:rows.title,
        //     genre:rows.genre
        // })
        response.render('gameDetails', {
            cover:`<img src = '${rows[0].coverart}' alt = '${rows[0].title}cover'>`,
            title:rows[0].title,
            genre:rows[0].genre
        })
    })
}