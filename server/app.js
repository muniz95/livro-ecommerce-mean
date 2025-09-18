/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');

// TODO: check how to connect to MongoDB in testing environment
// Connect to MongoDB - Commented out for testing without MongoDB
// mongoose.connect(config.mongo.uri, config.mongo.options);
// mongoose.connection.on('error', function(err) {
//   console.error('MongoDB connection error: ' + err);
//   console.log('Continuing without database for testing purposes...');
//   // process.exit(-1); // Commented out for testing without MongoDB
// });

// Populate databases with sample data
// if (config.seedDB) { require('./config/seed'); } // Commented out for testing without MongoDB

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: config.env !== 'production',
  path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
function startServer() {
  server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

setImmediate(startServer);

// Expose app
exports = module.exports = app;
