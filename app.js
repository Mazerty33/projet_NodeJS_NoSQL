// Constantes
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const sass = require('node-sass-middleware')
const db = require('sqlite')
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const redis = new Redis()
const PORT = process.PORT || 8080
const app = express()

// BDD
db.open('db.db').catch((err) => {
	console.log(err)
})

// Ouverture bdd MonDB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/todos', function(err) {
	if (err) { throw err }
})

// Mise en place des vues
app.set('views', './views')
app.set('view engine', 'pug')

// Préprocesseur sur les fichiers scss -> css
app.use(sass({
  src: path.join(__dirname, 'styles'),
  dest: path.join(__dirname, 'assets', 'css'),
  prefix: '/css',
  outputStyle: 'expanded'
}))

// Écoute en permanence sur le port défini dans les variables globales
app.listen(PORT, () => {
  console.log('Serveur sur port : ', PORT)
})

// Method override
app.use(methodOverride("_method", {
	methods: [ 'POST', 'GET' ]
}))

//------------------------------------------------------//
//-----------------------Middlewares--------------------//
//------------------------------------------------------//

// Middleware pour parler le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}))

// Permet de lier le css aux vues PUG
app.use(express.static(path.join(__dirname, 'assets')))

// Middleware pour parser les cookies
app.use(cookieParser())

// Midleware de connexion
app.use((req, res, next) => {
	if ((req.url == '/sessions') && (req.method == 'GET' || req.method == 'POST' || req.method == 'DELETE')) {
		next()
	}
	else if (req.url == '/users') {
		next()
	}
	else if (req.url == '/users/add') {
		next()
	}
	else {
		if (req.cookies.accessToken || req.headers['x-accesstoken']) {
			var accessToken = req.cookies.accessToken
			if (!accessToken) accessToken = req.headers['x-accesstoken']
			redis.hgetall('token:'+accessToken).then((result) => {
				if (result != "") {
					if (result['expiresAt'] > Date.now()) {
						next()
					} else {
						res.redirect('/sessions')
					}
				} else {
					res.redirect('/sessions')
				}
			})
		} else {
			res.redirect('/sessions')
		}
	}
})

// La liste des différents routeurs (dans l'ordre)
app.use('/sessions', require('./routes/sessions'))
app.use('/users', require('./routes/users'))
app.use('/todos', require('./routes/todos'))
app.use('/teams', require('./routes/teams'))
app.use('/', require('./routes/index'))

// Gère toutes les requêtes non gérés par les autres middlewares et renvoie un statut 501
app.all('*', (req, res) => {
	res.status(501)
	res.end("URL not valid")
})
