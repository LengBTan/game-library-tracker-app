const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
const db = new sqlite3.Database('data/projectDB')
const url = require('url')
const crypto = require('crypto')

db.serialize(() =>{
    let sql = "CREATE TABLE IF NOT EXISTS games (gameid INTEGER PRIMARY KEY, title TEXT, coverart TEXT);"
    db.run(sql)
    sql = "CREATE TABLE IF NOT EXISTS users (userid TEXT PRIMARY KEY, password TEXT, admin BOOLEAN, salt TEXT);"
    db.run(sql)
    sql = "CREATE TABLE IF NOT EXISTS user_game_list (userid TEXT, gameid INTEGER);"
    db.run(sql)
})

exports.login = function(request, response){
	const {username, password} = request.body
	let authorized = false
    let userRole//store the user's role in the session

	db.all("SELECT * FROM users where userid = ?", [username], function(err, rows){
		for(let i=0; i<rows.length; i++){
            let salt = String(rows[i].salt)//retrieve the salt from the db
            let hash = crypto.scryptSync(password, salt, 64).toString('hex')//compute the hash
		    if(rows[i].userid == username && rows[i].password == hash){//check if the username and hash of the password+salt matches data in db
				authorized = true
                userRole = rows[i].admin//boolean if user is admin
			} 
		}
		if(authorized){//create this session
			console.log("establishing a session")
			request.session.userId = username
            request.session.userRole = userRole
			request.session.save()
			response.redirect('/dashboard')
		}
		else{
			response.redirect('/index.html/?status=credfail')
		}
	})
}

exports.register = function(request,response){
    console.log("Registering user")
    const {username, password} = request.body

    let salt = crypto.randomBytes(16).toString('hex')//generate a random salt
    
    let hash = crypto.scryptSync(password, salt, 64).toString('hex')//create a hash with the password and salt


    let sql = `SELECT 1 FROM users where userid = ?;`

    db.all(sql,[username], function(err,rows){
        if(rows.length){//userid already exists
            response.redirect('/index.html/?status=taken')
        }
        else{
            sql = `INSERT INTO users VALUES (?, ?, 0, ?);`
            db.run(sql,[username, hash, salt])//store the username, hash and salt
            request.session.userId = username
            request.session.userRole = 0
			request.session.save()
			response.redirect('/dashboard')
        }
    })
}

exports.index = function (request, response){
	// index.html
    let message = ''
    if(request.query.status === 'fail'){
        message = 'Authentication failed'
    }
    else if(request.query.status === 'credfail'){
        message = 'Incorrect username or password'
    }
    else if(request.query.status === 'logout'){
        message = 'Logged out'
    }
    else if(request.query.status === 'taken'){
        message = 'Username is taken'
    }

	response.render('index', {alert: message})
}

function parseURL(request, response) {
    const PARSE_QUERY = true //parseQueryStringIfTrue
    const SLASH_HOST = true //slashDenoteHostIfTrue
    let urlObj = url.parse(request.url, PARSE_QUERY, SLASH_HOST)
    return urlObj
}

exports.dashboard = function(request, response){
    let userPageLink = ''
    if(request.session.userRole){
        userPageLink = '<a href="/users">👤 Users in the DB</a>'
    }
    let sql = `select user_game_list.userid, user_game_list.gameid, games.title,
            games.coverart from user_game_list join 
            games on user_game_list.gameid = games.gameid where userid like ?;`
    db.all(sql,[request.session.userId], function(err, rows){
        response.render('dashboard', {gameEntry:rows, users:userPageLink})
    })
}


//client id and access token required to use the IGDB API
//https://api-docs.igdb.com/?javascript#authentication
const CLIENT_ID = "pkr8ol36ywojvfk0q6pj9rbgcijmfp"
const AUTH = "nnnm818tc77yk6arme7l8z2hi76r0p"
//url of the api
const apiPath = "https://api.igdb.com/v4/games"
//set the header for the request, required by the api
let headers = new Headers()
headers.append("Client-ID", CLIENT_ID)
headers.append("Authorization", `Bearer ${AUTH}`)

exports.gameDetails = function(request, response){
    //extract the gameid from the url
    let urlObj = parseURL(request, response)
    // console.log(urlObj)
    let gameId = urlObj.path
    gameId = gameId.substring(gameId.lastIndexOf("/") + 1, gameId.length)
    
    let addGameTag = ''
    //check if the game is in the list
    let sql = "SELECT 1 FROM user_game_list WHERE userid = ? and gameid = ?"
    db.all(sql, [request.session.userId, gameId], function(err, rows){
        if(!rows.length){//game does not exists in the user's library
            addGameTag = `<a href="/addGame/?id=${gameId}" class="addButton">Add Game to collection</a>`
        }
    })

    //https://api-docs.igdb.com/?javascript#game
	//body for the api request
	let body = `fields name, cover.url, genres.name, involved_companies.company.name, first_release_date, similar_games.name, similar_games.cover.url; where id = ${gameId}; limit 20;`

	const options = {
		"method": "POST",
		"headers":headers,
		"body":body
	}

    //send a post request to the api
	fetch(apiPath, options)
	.then((response) => response.json())//recieve a response from the api
	.then((data) => {//recieve the json data from the api
        data.forEach((game)=>{
            //change url to use larger image from the api
            if(game.hasOwnProperty('cover')){
                let imgurl = game.cover.url.replace("t_thumb","t_720p")
                game.cover.url=imgurl
            }
            else{
                console.log(`Game ${game.id} has no cover art!`)
            }
            //change genres to be a single string
            let genres = ''
            game.genres.forEach((genre)=>{
                genres+= genre.name + ", "
            })
            genres = genres.slice(0,-2)
            game.genres = genres

            if(game.hasOwnProperty('first_release_date')){
                let date = new Date(game.first_release_date*1000)//convert unix time
                game.first_release_date = date.toISOString().split('T')[0]
            }
            else{
                game.first_release_date = 'n/a'
            }
            
            if(game.hasOwnProperty('similar_games')){
                game.similar_games.forEach((game)=>{
                    if(game.hasOwnProperty('cover')){
                        let imgurl = game.cover.url.replace("t_thumb","t_720p")
                        game.cover.url=imgurl
                    }
                    else{
                        console.log(`Game ${game.id} has no cover art!`)
                    }
                })


            }
            

        })
        response.render('gameDetails', {game: data[0], addGame:addGameTag})
	})
	.catch((error) => {
		console.error(error)
	})

    
}

exports.searchGame = function(request, response){
    let game = (request.query.title)
	if(!game) {//dont search an empty string
	  response.render('searchGame')
	  return
	}

	//https://api-docs.igdb.com/?javascript#game
	//body for the api request
	let body = `fields name, cover.*; search "${game}"; limit 20;`

	const options = {
		"method": "POST",
		"headers":headers,
		"body":body
	}

    //send a post request to the api
	fetch(apiPath, options)
	.then((response) => response.json())//recieve a response from the api
	.then((data) => {//recieve the json data from the api
		// console.log(data)
        data.forEach((game)=>{
            //change url to use larger image from the api
            //console.log(game)
            if(game.hasOwnProperty('cover')){
                let imgurl = game.cover.url.replace("t_thumb","t_720p")
                game.cover.url=imgurl
            }
            else{
                console.log(`Game ${game.id} has no cover art!`)
            }
        })
        response.render('searchGame', {searchResult:data})
	})
	.catch((error) => {
		console.error(error)
	})
}

exports.addGame = function(request, response){
    let gameId = (request.query.id)
	
	//https://api-docs.igdb.com/?javascript#game
	//body for the api request
	let body = `fields name, cover.*; where id = ${gameId};`

	const options = {
		"method": "POST",
		"headers":headers,
		"body":body
	}

    //send a post request to the api
	fetch(apiPath, options)
	.then((response) => response.json())//recieve a response from the api
	.then((data) => {//recieve the json data from the api
        let imgurl = ''
        if(data[0].hasOwnProperty('cover')){
            imgurl = data[0].cover.url.replace("t_thumb","t_720p")
        }
        else{
            console.log(`Game ${data[0].id} has no cover art!`)
        }
        
        let sql = `INSERT OR REPLACE INTO games VALUES (?, ?, ?);`
        db.run(sql,[data[0].id, data[0].name, imgurl])

        sql = `INSERT OR REPLACE INTO user_game_list VALUES (?,?);`
        db.run(sql, [request.session.userId, data[0].id])
        response.redirect('/dashboard')
	})
	.catch((error) => {
		console.error(error)
	})
}

exports.deleteGame = function(request, response){
    let gameId = (request.query.id)
    console.log("deleting game with id: " + gameId)

    sql = `DELETE FROM user_game_list WHERE userid = ? AND gameid = ?;`
    db.run(sql, [request.session.userId, gameId])

    //delete the game from the games table if it is not being referenced by any other users in user_game_list
    sql = `DELETE FROM games WHERE NOT EXISTS (SELECT 1 FROM user_game_list WHERE user_game_list.gameid = games.gameid);`
    db.run(sql)
    response.redirect('/dashboard')
}

exports.users = function(request, response){
    let sql = `SELECT userid, admin FROM users;`
    db.all(sql, function(err, rows){
        response.render('users', {users:rows})
    })
}