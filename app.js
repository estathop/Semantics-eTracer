var express = require('express');
var restapp = express();
//const fs = require('fs')
//const https = require('https')
//var http = require('http')
var basicAuth = require('express-basic-auth')
var queryController = require('./controllers/queryController')

restapp.use(basicAuth({
	users: { '*': '*' },
	challenge: true
}))
restapp.use((error, req, res, next) => {
res.status(error.status || 500);
res.json({
	error: {
		message: error.message,
},
});
});
restapp.use(queryController)
restapp.get('*', function(req, res){
res.status(404).send('Error 404: This API does not exist !');
});
restapp.listen(3001, function () {
	console.log('App listening on port 3001!');
});
/*https.createServer({
	key: fs.readFileSync('./ssl/selfsigned.key'),
	cert: fs.readFileSync('./ssl/selfsigned.crt')
}, restapp).listen(3001, function () {
	console.log('Αpp listening on port 3001!');
});*/
