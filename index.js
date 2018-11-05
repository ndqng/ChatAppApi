const express = require('express');
express.static('views');
const bodyparser = require('body-parser');
const http = require('http');
const app = express();
require('dotenv').config();

//config cors for file upload
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

//Parser
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extended: false
}));
//view engine
app.set('view engine', 'ejs');

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

//Set port
const port = process.env.PORT || 8000;
app.set('port', port);


// API routers
app.use('/service/messenger', require('./service/messenger'));
app.use('/service/room', require('./service/room'));
app.use('/service/team', require('./service/team'));
app.use('/service/register', require('./service/user/register'));

//init and start server
const server = http.createServer(app);
server.listen(port, () => console.log("Server is running on port "+port));