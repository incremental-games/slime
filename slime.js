/**
 * SLIME.JS
 * SLIME M
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10
  , crypto = require('crypto')
  , assert = require('assert');
 
var MongoStore  = require('connect-mongo')(express);
var mongoose = require('mongoose');
var db = mongoose.connection;

var session_conf = {
  db: {
    db: 'admin', 
    host: 'localhost', 
    port: 14769,  // optional, default: 27017
    username: 'admin', // optional
    password: '[redacted]', // optional
    collection: 'mySessions' // optional, default: sessions
  },
  secret: '[redacted]'
};
mongoose.connect('mongodb://localhost:14769/admin', { auto_reconnect: true, user: session_conf.db.username, pass: session_conf.db.password });

/*
* SCHEMA - BEGIN
*/


var keySchema = new mongoose.Schema({
	email: { type: String, required: true, index: { unique: true } },
	code: { type: String },
});
var Key = mongoose.model('Key', keySchema);

var userSchema = new mongoose.Schema({
	name: { type: String, required: true, index: { unique: true } },
	email: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	updated_at: { type: Date },
	created_at: { type: Date },
});
var User = mongoose.model('User', userSchema);
userSchema.pre('save', function(next) {
    var user = this;
	user.updated_at = new Date;
	if ( !user.created_at ) {
		user.created_at = new Date;
	}
	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) return next();

	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) return next(err);

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
var app = express();
// all environments
app.set('port', 23319);
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(express.logger('dev'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session({ 
	secret: session_conf.secret, 
	cookie: { maxAge: 360000000000 },
	store: new MongoStore(session_conf.db)
}));
app.use(app.router);


/*
* BEGIN ROUTES
*/
app.get('/', function(req, res){
	var c = req.param('key', null);  // second parameter is default
	var e = req.param('email', null);  // second parameter is default
	
	Key.findOne({email:e,code:c}, function (err, key) {
		if (err || !key) return res.render('alpha', {key : false});
		res.render('alpha', {key : true});
	});
});
app.get('/keys', function (req, res) {
	Key.find({}, function (err, keys) {
		res.json(keys);
	});
});
app.post('/signup', function (req, res) {
	var email = req.body.email;
	var b64 = new Buffer('a' + email).toString('base64');
	var newkey = new Key({
		email: email.toLowerCase(),
		code:  'alpha' + b64
	});
	newkey.save(function(err, u) {
		if (err) return res.send(err);
		res.send('Thank you');
	});
});
/*
* END ROUTES
*/
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});