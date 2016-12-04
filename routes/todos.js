const router = require('express').Router()

const Type = require('type-of-is')

const Session = require('../models/sessions')
const User = require('../models/users')
const Todos = require('../models/todos')
const Team = require('../models/teams')


function renderTodos(res, todos, TodosLink, teamName, hisTodos) {
	var link = null
	var title = 'My To-Do'
	if (TodosLink == "team") {
		TodosLink = "My To-Do"
		link = '?team=none'
		title = 'To-Do from team '+ teamName

	} else if (TodosLink == "mine"){
		TodosLink = "To-Do from team "+ teamName
		link = '?team=mine'
	}
	var hasTodos = true
	if (todos.length == 0) hasTodos = false
	var completed = []
	var uncompleted = []
	for (var i = todos.length - 1; i >= 0; i--) {
		if (todos[i].completed === true) {
			completed.push(todos[i])
		} else {
			uncompleted.push(todos[i])
		}
	}
	res.format({
		html: () => {
			res.render('todos/showAll', {
				title: title,
				completed: completed,
				uncompleted: uncompleted,
				hasTodos: hasTodos,
				TodosLink: TodosLink,
				link: link,
				hisTodos: hisTodos
			})
		},
		json: () => {
			res.send({completed: completed,
				uncompleted: uncompleted })
		}
	})
}

// Show todos
router.get('/', (req, res, next) => {
	var token = Session.getToken(req)
	User.getId(token).then((userId) => {
		User.getById(userId).then((user) => {
			var teamId = user[0]['teamId']
			var teamName = user[0]['team']
			if (!teamId) {
				Todos.findByUserId(userId).then((todos) => {
					renderTodos(res, todos, TodosLink = false, teamName = null, true)
				})
			} else {
				if (req.query.team == "mine") {
						Todos.findByTeamId(teamId).then((todos) => {
							renderTodos(res, todos, "team", teamName = teamName, false)
						})
				} else {
					Todos.findByUserIdWithoutTeam(userId).then((todos) => {
						renderTodos(res, todos, "mine", teamName = teamName, true)
					})
				}
			}
		})
	})
})

// Add todo
router.get('/add', (req, res, next) => {
	var token = Session.getToken(req)
	var warning = false
	if(req.query.warning) warning = true
	User.getId(token).then((userId) => {
		User.getById(userId).then((user) => {
			var teamId = user[0]['teamId']
			if (!teamId) {
				res.format({
					html: () => {
						res.render('todos/edit', {
							title: 'Add Todos',
							action: '/todos/add',
							warning: warning,
							hasTeam: false
						})
					},
					json: () => {
						res.status(400)
						res.end()
					}
				})
			} else {
				Team.getUsersInTeam(teamId).then((users) => {
					var listUsers = users[0]['users']
					var indexOfThisUser = listUsers.indexOf(user[0]['pseudo'])
					if (indexOfThisUser > -1) {
						listUsers.splice(indexOfThisUser, 1);
					}
					if (listUsers.length < 1) listUsers = null
					res.format({
						html: () => {
							res.render('todos/edit', {
								title: 'Add Todos',
								listUsers: listUsers,
								action: '/todos/add',
								warning: warning,
								hasTeam: true
							})
						},
						json: () => {
							res.status(400)
							res.end()
						}
					})
				})
			}
		})
	})
})

// Add todo
router.post('/add', (req, res, next) => {
	var token = Session.getToken(req)
	var message = req.body.message
	var toUser = req.body.toUser
	if (!message) {
		res.redirect('/todos/add?warning=true')
	} else {
		if (!toUser) toUser = null
		User.getId(token).then((userId) => {
			User.getById(userId).then((user) => {
				if (user[0]['teamId']) teamId = user[0]['teamId']
				if (!req.body.forTeam) {
					toUser = null
					teamId = null
				}
				Todos.insert(userId, user[0]['pseudo'], message, teamId, toUser).then((result) => {
					res.redirect('/todos')
				})
			})
		})
	}
})

// todo accomplis ou non
router.post('/', (req, res, next) => {
	var link = '/todos?team=mine'
	if (req.query.team) {
		link = '/todos'
	}
	var todosIds = req.body.checked
	if (typeof(todosIds) === 'undefined') {
		res.redirect('/')
	}
	if (typeof(todosIds) === 'string') {
		Todos.completed(todosIds).then((result) => {
			res.redirect(link)
		})
	}
	if (typeof(todosIds) === 'object') {
		var promises = []
		for (var i = todosIds.length - 1; i >= 0; i--) {
			promises.push(Todos.completed(todosIds[i]))
		}
		Promise.all(promises).then((result) => {
			res.redirect(link)
		})
	}
})

router.all('*', (req, res) => {
	res.status(501)
	res.end("Error !")
})

module.exports = router
