const router = require('express').Router()

const Type = require('type-of-is')

const Session = require('../models/sessions')
const User = require('../models/users')
const Team = require('../models/teams')


router.get('/add', (req, res) => {
	res.format({
		html: () => {
			res.render('teams/edit', {
				title: 'Add team',
				action: '/teams'
			})
		},
		json: () => {
			res.status(400)
			res.end()
		}
	})
})

// return all teams
router.get('/', (req, res, next) => {
	var token = Session.getToken(req)
	Team.findAll().then((teams) => {
		User.getId(token).then((userId) => {
			User.getById(userId).then((user) => {
				var hisTeam = user[0]['teamId']
				res.format({
					html: () => {
						res.render('teams/showAll', {
							title: 'All teams',
							team: teams,
							hisTeam: hisTeam
						})
					},
					json: () => {
						res.send(teams)
					}
				})
			})
		})
	})
})

// Add team
router.post('/', (req, res, next) => {
	if (req.body.teamName != null) {
		if (req.body.teamName == "" || req.body.teamName.match("  *") != null) {
			redirectAdd(res)
		} else {
			Team.insert(req.body.teamName).then((result) => {
				res.redirect('/teams')
			}).catch((err) => {
				console.log(err)
			})
		}
	} else {
		redirectAdd(res)
	}
})

// Add user dans une team avec son token
router.put('/:teamId', (req, res, next) => {
	var token = Session.getToken(req)
	var teamId = req.params.teamId
	User.getId(token).then((userId) => {
		Team.findById(teamId).then((team) => {
			var teamName = team[0]['teamName']
			User.addToTeam(userId, teamName, teamId).then((result) => {
				User.getById(userId).then((user) => {
					var pseudo = user[0]['pseudo']
					Team.addUser(teamId, pseudo).then((result) => {
						res.redirect('/teams')
					})
				})
			}).catch((err) => {
				console.log(err)
			})
		})
	})
})

// Delete team
router.delete('/:teamId', (req, res, next) => {
	var teamId = req.params.teamId
	Team.findById(teamId).then((team) => {
		if (team.length > 0) {
			Team.delete(teamId).then((result) => {
				User.teamDeleted(teamId).then((result) => {
					res.redirect('/teams')
				})
			})
		} else {
			console.log("Error !")
		}
	})
})

router.all('*', (req, res) => {
	res.status(501)
	res.end("Error !")
})

// Error redirect
function redirectAdd(res) {
	res.format({
		html: () => {
			res.render('teams/edit', {
				title: 'Add team',
				action: '/teams',
				warning: true
			})
		},
		json: () => {
			res.send({message: 'Error !'})
		}
	})
}

module.exports = router
