const db = require('sqlite')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const Session = require('../models/sessions')


function timeConverter(UNIX_timestamp){
	return moment(UNIX_timestamp).format("DD-MM-YYYY h:mm:ss")
}


module.exports = {

// fonctions principales
	insert: (params) => {
		let password = bcrypt.hashSync(params.pwd);
		var date = timeConverter(Date.now());
		return db.run('INSERT INTO users (pseudo, pwd, email, firstname, lastname, createdAt, updatedAt, team, teamId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
			params.pseudo,
			password,
			params.email,
			params.firstname,
			params.lastname,
			date,
			date,
			false,
			null)
	},

	update: (body, params, samePwd) => {
		if (samePwd) var pwd = body.pwd
		else var pwd = bcrypt.hashSync(body.pwd)
		return db.all('UPDATE users SET pseudo = ?, pwd = ?, email = ?, firstname = ?, lastname = ?, updatedAt = ? WHERE rowid = ?',
			body.pseudo,
			pwd,
			body.email,
			body.firstname,
			body.lastname,
			timeConverter(Date.now()),
			params.userId)
	},

	delete: (userId) => {
		return db.all('DELETE FROM users WHERE rowid = ?',
			userId)
	},

// getters
	getId: (accessToken) => {
		return Session.exists(accessToken).then((result) => {
			return result.userId
		})
	},

	getById: (id) => {
		return db.all('SELECT rowid, * FROM users WHERE rowid = ?',
			id)
	},

	getByPseudo: (pseudo) => {
		return db.all('SELECT rowid, * FROM users WHERE pseudo = ?',
			pseudo)
	},

	count: () => {
		return db.all('SELECT COUNT(*) as nbrUsers FROM users')
	},

	listWithPagination: (limitToShow, params) => {
		return db.all('SELECT *, rowid FROM users LIMIT ? OFFSET ?',
			params.limit || limitToShow,
			params.offset || 0)
	},

	addToTeam: (userId, teamName, teamId) => {
		return db.all('UPDATE users SET team = ?, teamId = ? WHERE rowid = ?',
			teamName,
			teamId,
			userId)
	},

	teamDeleted: (teamId) => {
		return db.all('UPDATE users SET team = NULL, teamId = NULL WHERE teamId = ?',
			teamId)
	}


}
