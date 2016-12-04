const router = require('express').Router()
const Session = require('../models/sessions')
const User = require('../models/users')
const bcrypt = require('bcryptjs')
const math = require('math')
const db = require('sqlite')
const Team = require('../models/teams')


db.open('bdd.db').then(() => {
	console.log('> BDD opened')
	return db.run('CREATE TABLE IF NOT EXISTS users (pseudo, pwd, email, firstname, lastname, createdAt, updatedAt, team, teamId)')
	})


/* Users : liste */
router.get('/', (req, res, next) => {
		var nbrUsersTotal = 0
		var limitToShow = 10
		User.count().then((nbrUsers) => {
			nbrUsersTotal = nbrUsers[0]['nbrUsers']
		}).catch((err) => {
			console.log(err)
		})
		User.listWithPagination(limitToShow, req.query).then((users) => {
			nbrPages = math.ceil((nbrUsersTotal/limitToShow), -1)
			if (!req.query.offset || req.query.offset == 0) {
				pageActuelle = 1
			} else {
				pageActuelle = (req.query.offset/limitToShow)+1
			}
			var isDisableNe = false
			var isDisableRe = false
			var prec = "/users?offset="+((pageActuelle*limitToShow)-(2*limitToShow))
			var suiv = "/users?offset="+(pageActuelle*limitToShow)
			if (pageActuelle == 1) {
				var isDisableRe = true
				var prec = ""
			}
			if (pageActuelle == nbrPages) {
				var isDisableNe = true
				var suiv = ""
			}
			res.format({
				html: () => {
					res.render('users/showAll', {
						title: 'All Users',
						users: users,
						avancement: pageActuelle+"/"+nbrPages,
						precedent: prec,
						suivant: suiv,
						isDisabledReturn: isDisableRe,
						isDisabledNext: isDisableNe
					})
				},
				json: () => {
					res.send(users)
				}
			})
		})
	})

router.get('/add', (req, res) => {
	res.format({
		html: () => {
			res.render('users/edit', {
				title: 'Add user',
				action: '/users'
			})
		},
		json: () => {
			res.status(400)
			res.end()
		}
	})
})

router.get('/me', (req, res) => {
	var token = Session.getToken(req)
	User.getId(token).then((userId) => {
		res.redirect('/users/'+userId)
	})
})

router.get('/:userId', (req, res) => {
	var token = Session.getToken(req)
	User.getId(token).then((thisUserId) => {
		User.getById(req.params.userId).then((user) => {
			if (user == '') return next()
			var notThisOne = true
			if (thisUserId == req.params.userId) notThisOne = false
			res.format({
				html: () => {
					res.render('users/show', {
						title: 'Utilisateur '+req.params.userId,
						user: user,
						suppr: '/users/'+req.params.userId+'?_method=DELETE',
						modif: '/users/'+req.params.userId+'/edit',
						notThisOne: notThisOne
					})
				},
				json: () => {
					res.send(user)
				}
			})
		}).catch((err) => {
			console.log(err)
		})
	})
})

router.post('/', (req, res) => {
	if (req.body.pseudo == "" || req.body.pwd == "" || req.body.email == "" || req.body.firstname == "" || req.body.lastname == "") {
		res.format({
			html: () => {
				res.render('users/edit', {
					title: 'All Users',
					warning: true
				})
			},
			json: () => {
				res.send({message: 'Error !'})
			}
		})
	} else {
		User.getByPseudo(req.body.pseudo).then((user) => {
			if (user != "") {
				res.format({
					html: () => {
						res.render('users/edit', {
							title: 'All Users',
							taken: true
						})
					},
					json: () => {
					res.send({message: 'Pseudo taken'})
			}
		})
			} else {
				User.insert(req.body).then((result) => {
					res.format({
						html: () => {
							res.redirect('/users')
						},
						json: () => {
							res.send({message: 'Success'})
						}
					})
				}).catch((err) => {
					console.log(err)
					res.end('ça marche pas')
				})
			}
		}).catch((err) => {
			console.log(err)
		})
	}
})

router.get('/:userId/edit', (req, res) => {
	User.getById(req.params.userId).then((user) => {
		if (user =='') return next()
		res.format({
			html: () => {
				res.render('users/edit', {
					title: 'Update user '+ req.params.userId,
					user: user,
					action: '/users/' + req.params.userId + '?_method=PUT'
				})
			},
			json: () => {
				res.status(400)
				res.end()
			}
		})
	}).catch((err) => {
		res.status(404)
		res.end('User not found')
	})
})

router.put('/:userId', (req, res) => {
	User.getById(req.params.userId).then((user) => {
		var samePwd = false
		if (req.body.pwd == '') {
			req.body.pwd = user[0].pwd
			samePwd = true
		}
		User.update(req.body, req.params, samePwd).then((result) => {
			res.format({
				html: () => {
					res.redirect('/users')
				},
				json: () => {
					res.send({message: 'Success'})
				}
			})
		}).catch((err) => {
			res.end("error")
		})
	})
})

router.delete('/:userId', (req, res) => {
	var userId = req.params.userId
	User.getById(userId).then((user) => {
		if (user != '') {
			Team.deleteUser(user[0]['teamId'], user[0]['pseudo']).then((result) => {
				User.delete(userId).then((result) => {
					res.format({
						html: () => {
							res.redirect('/users')
						},
						json: () => {
							res.send({message: 'Success'})
						}
					})
				}).catch((err) => {
					res.status(404)
					res.end('ERR4 > '+err)
				})
			})
		} else {
			res.end('User doesn\'t exist')
		}
	})
})

router.all('*', (req, res) => {
	res.status(501)
	res.end("URL not valid")
})

module.exports = router
