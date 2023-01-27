const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const http = require("http").Server(app)
const ws = require('./queries')
const settings = require('./settings')

let router = express.Router();


//for cors
const cors = require('cors');


app.use(express.json({
	limit: "50mb"
}))
app.use(express.urlencoded({
	limit: "50mb",
	extended: false
}))

app.use(cors());

app.use('/', router)

//for corss
app.get('/getHistories', ws.getHistories);
app.post('/requestSearch', ws.requestSearch);
app.get('/getDetailHistory', ws.getDetailHistory);
app.get('/getExperts', ws.getExperts);
app.get('/getExpertRelation', ws.getExpertRelation);
app.get('/getExpertPapers', ws.getExpertPapers);
app.get('/sendCrawlRequest', ws.sendCrawlRequest);
app.get('/getSiteStatus', ws.getSiteStatus);
app.get('/removeHistory', ws.removeHistory);
app.get('/editHistory', ws.editHistory);
app.post('/getIntegrationData', ws.getIntegrationData);
app.post('/uploadIFFile', ws.uploadIFFile);
app.post('/getIntegrationResult', ws.getIntegrationResult);
app.post('/getReloadPage', ws.getReloadPage);
app.get('/deleteIntegration', ws.deleteIntegration);
app.get('/getInstRank', ws.getInstRank);
app.get('/getNtisAPI', ws.getNtisAPI);




var server = http.listen(settings.port, settings.host, function() {
	console.log("Server running at http://%s:%s", settings.host, settings.port)

})

module.exports = {
	router
}
