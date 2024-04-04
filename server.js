var express = require('express')
var path = require('path')
const session = require('express-session')
var sqlite3 = require('sqlite3').verbose(); //verbose provides more detailed stack trace
var db = new sqlite3.Database('data/projectDB');

var app = express()

const PORT = process.env.PORT || 3000

//client id and access token required to use the IGDB API
//https://api-docs.igdb.com/?javascript#authentication
//remember to change this if making the project public
const CLIENT_ID = "pkr8ol36ywojvfk0q6pj9rbgcijmfp"
const AUTH = "nnnm818tc77yk6arme7l8z2hi76r0p"

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs') //use hbs handlebars wrapper
app.locals.pretty = true; //to generate pretty view-source code in browser

//read routes modules
var routes = require('./routes/index');
const { nextTick } = require('process');


//middleware

app.use(express.json())//used to parse html post form
app.use(express.urlencoded({extended: true}))//used to parse html post form

app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true,
}))

//routes
app.post('/login', (request, response) =>{
	const {username, password} = request.body;

	let authorized = false;

	db.all("SELECT userid, password FROM users", function(err, rows){
		for(var i=0; i<rows.length; i++){
		    if(rows[i].userid == username && rows[i].password == password){
				authorized = true;
			} 
		}
		if(authorized){
			console.log("establishing a session")
			request.session.userId = username;
			request.session.save()
			response.redirect('/games')
		}
		else{
			response.redirect('/index.html/?status=fail')
		}
	})
})

const checkAuth = (request, response, next) => {
    if (request.session.userId) {
        next(); //user has a session established, continue with next middleware
    } else {
        response.redirect('/index.html/?status=fail');//redirect user to the login page
    }
}

app.get('/index.html', routes.index)
app.get('/games', checkAuth, routes.games)
app.get('/game/*', checkAuth, routes.gameDetails)

app.get('/searchGame', (request, response) => {//route for searching games
	let game = (request.query.title)//.split(' ').join('+')
	console.log(game)
	if(!game) {
	  response.json({message: 'Please enter a name of a game'})
	  return
	}

	//url of the api
	const apiPath = "https://api.igdb.com/v4/games"

	//set the header for the request, required by the api
	let headers = new Headers()
	headers.append("Client-ID", CLIENT_ID)
	headers.append("Authorization", `Bearer ${AUTH}`);
	
	//https://api-docs.igdb.com/?javascript#game
	//body for the api request
	let body = `fields name, cover.*; search "${game}"; limit 20;`

	const options = {
		"method": "POST",
		"headers":headers,
		"body":body
	}

	fetch(apiPath, options)
	.then((response) => response.json())//recieve a response from the api
	.then((data) => {//recieve the json data from the api
		console.log(data)

    	response.contentType('application/json').json((data))//respond to client with the json data
		response.end()//end the request
	})
	.catch((error) => {
		console.error(error)
	})
})

app.get('/logout', (request, response) =>{
	console.log("delete session")
	request.session.destroy();
	response.redirect('/index.html/?status=logout')
})

//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
		console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
		console.log(`To Test:`)
		console.log('user: admin password: password')
		console.log('http://localhost:3000/index.html')
	}
})
