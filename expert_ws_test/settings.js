const mode = 1 // 1 = debug, 0 = run
// const host = process.env.SERVER_DOMAIN
const host = "203.255.92.141"
const port = mode == 1 ? 8081 : 80
const mongoURL = 'mongodb://203.255.92.141:27017'

module.exports = {
	mode: mode,
	host: host,
	port: port,
	mongoURL: mongoURL,
}
