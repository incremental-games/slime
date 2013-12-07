/*
* EDIT THIS FILE TO SET UP SLIMEJS
*/
var session_conf = {
	db: {
		db: 'admin', //MAKE SURE TO CREATE A USER ON /admin
		host: 'localhost', 
		port: 14769,  // UPDATE THIS, default: 27017
		username: 'admin', 
		password: '[UPDATE THIS]', 
		collection: 'mySessions'
	},
	secret: '[UPDATE THIS]%3wesdfHUSDYDRZGFqw3r22'
};
module.exports = session_conf;