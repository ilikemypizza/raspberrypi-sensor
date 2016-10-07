var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var Sequelize = require('sequelize');
var gpio = require('rpi-gpio');

// Connect to our local MySQL Database
var sequelize = new Sequelize('trucolor','root','raspberry', {
	host: 'localhost',
	dialect: 'mysql'
});

// Model Definition for logs table in MySQL
var log = sequelize.define('log', {
	time: {
		type: Sequelize.DATE,
		field: 'time'
	},
	status: {
		type: Sequelize.INTEGER,
		field: 'status'
	}
});

// Define SENSOR PIN (Pin#) to use for detection
SENSOR_PIN = 8;

// Define our HTTP Server with Express
app.use(express.static(__dirname + '/bower_components'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

/*
app.get('/stats/:id',function(req,res,next){

});
*/

io.on('connect', function( client ){
	// console.log("client listening");
}); 

// Define Global Variables
start = new Date();
lastRunning = null; 
lastStopped = null;
totalRunTime = 0;
totalStopTime = 0;

// GPIO Logic Handling
gpio.on('change', function(channel, value) {

	if ( lastRunning == null ){
		lastRunning = new Date();
		totalRunTime += ((new Date()).getTime() - lastRunning.getTime()) / 1000;
		lastStopped = null;

		// Log to the database
		log.create({
			time: lastRunning,
			status: 1
		});	
	} else {	// Already Running, update the run time
		totalRunTime += ((new Date()).getTime() - lastRunning.getTime()) / 1000;
		lastRunning = new Date();
	}
		
	// Send Update back to Client
	var message = {
		status: true,
		timestamp : lastRunning,
		percentage: Math.round(((totalRunTime / ( totalRunTime + totalStopTime )) * 100))
	};

	io.sockets.emit('message', message);
});

(function() {
	var timeout = setInterval(function(){
		
		if( (new Date) - lastRunning > 4000 ){
			
			if ( lastStopped == null ) {
				lastStopped = new Date();
				totalStopTime += ((new Date()).getTime() - lastStopped.getTime()) / 1000;
			} else {
				totalStopTime += ((new Date()).getTime() - lastStopped.getTime()) / 1000;
				lastStopped = new Date();
			}

			if ( lastRunning != null ) { // first pass here since last run time
				// Log to the Database
				log.create({
					time: new Date(),
					status: 0
				});
			}

			
			lastRunning = null;
			
			// Send Update back to Client
			var message = {
				status: false,
				timestamp : lastStopped,
				percentage:  Math.round(((totalRunTime / ( totalRunTime + totalStopTime )) * 100))
			};

			io.sockets.emit('message', message);
		}	
	}, 4000);
})();

gpio.setup(SENSOR_PIN, gpio.DIR_IN, gpio.EDGE_BOTH);

// Star the HTTP server
server.listen(80);
