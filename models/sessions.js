// Constantes
const Redis = require('ioredis')
const redis = new Redis()

// Logger
let logger = (key) => {
  return (val) => {
    return val
  }
}

module.exports = {

	add: (userId, token) => {
		var createdAt = Date.now()
  		var expiresAt = (Date.now() + 90000000)
  		return redis.hmset('token:'+token, 'userId', userId, 'createdAt', createdAt, 'expiresAt', expiresAt)
	},

	exists: (accessToken) => {
		return redis.hgetall('token:'+accessToken)
	},

	getToken: (req) => {
		var accessToken = req.cookies.accessToken
		if (!accessToken) {
      accessToken = req.headers['x-accesstoken']
    }
		return accessToken
	}

}
