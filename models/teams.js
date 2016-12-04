const mongoose = require('mongoose')

// Schema
var shemateam = new mongoose.Schema({
  teamId : String,
  teamName : String,
  users : [String],
  createdAt: Date
})

// Model
var teamModel = mongoose.model('team', shemateam);

module.exports = {

// Fonctions principales
	insert: (teamName) => {
		var newTeam = new teamModel({
			teamId: require('uuid').v4(),
			teamName: teamName,
			users: [],
			createdAt: Date.now()
		})
		return newTeam.save()
	},

  addUser: (teamId, pseudo) => {
		return teamModel.update({teamId: teamId}, {$push: {users: pseudo}},{upsert:true})
	},

	delete: (teamId) => {
		return teamModel.remove({ teamId : teamId })
	},

	deleteUser: (teamId, pseudo) => {
		return teamModel.update({teamId: teamId}, {$pull: {users: pseudo}},{upsert:true})
	},

// Getters
	findAll: () => {
		return teamModel.find(null)
	},

	findById: (teamId) => {
		var findTeam = teamModel.find(null)
		findTeam.where('teamId', teamId)
		return findTeam.exec()
	},

	getUsersInTeam: (teamId) => {
		var findTeam = teamModel.find(null)
		findTeam.where('teamId', teamId)
		findTeam.select('users')
		return findTeam.exec()
	}
}
