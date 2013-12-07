/**
 * SLIME.JS
 * If you're setting this up for the first time, please update config.js
 * INSTALL INSTRUCTIONS:
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10
  , crypto = require('crypto')
  , assert = require('assert');
 
var MongoStore  = require('connect-mongo')(express);
var mongoose = require('mongoose');
var db = mongoose.connection;

var session_conf = require('config.js');
mongoose.connect('mongodb://localhost:' + session_conf.db.port + '/' + session_conf.db.db, { auto_reconnect: true, user: session_conf.db.username, pass: session_conf.db.password });

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
userSchema.methods.getPublicFields = function () {
    var returnObject = {
        name: this.name,
    };
    return returnObject;
};
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
var User = mongoose.model('User', userSchema);
var app = express();
// all environments
app.set('port', 23319);
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(express.logger('dev'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('this_is_random_please_mash_your_keyboard_3rwe9syd8'));
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
	if (req.session.user_id) {
		User.findOne({_id:req.session.user_id}, function (err, user) {
			if (err || !user) return res.render('alpha', {msg: 'Can\'t find you'});
			res.render('game');
		});
	} else {
		var param_key = req.param('key', null);  //the key to get into alpha
		var param_email = req.param('email', null);  //the user's email
		if (!param_key) return res.render('alpha', {key : false});
		Key.findOne({email:param_email,code:param_key}, function (err, key) {
			if (err || !key) return res.render('alpha', {key : false, msg : 'Invalid key'});
			res.render('alpha', {key : true, email: param_email});
		});
	}
});
app.get('/login', function (req, res) {
	res.render('login');
});
app.get('/keys', function (req, res) {
	Key.find({}, function (err, keys) {
		res.json(keys);
	});
});
app.get('/users', function (req, res) {
	User.find({}, function (err, u) {
		res.json(u);
	});
});
app.post('/key_signup', function (req, res) {
	var email = req.body.email;
	var b64 = new Buffer('a' + email).toString('base64');
	var newkey = new Key({
		email: email.toLowerCase(),
		code:  'alpha' + b64
	});
	newkey.save(function(err, u) {
		if (err) return res.render('alpha', {key: false, msg : 'That email is already in the system'});
		res.send('Thank you');
	});
});
app.post('/login', function (req, res) {
	if (!req.body.password) return res.render('login', {msg: 'no password'});
	User.findOne({ name: req.body.username.toLowerCase() }).exec(function(err, user) {
		if (err) return res.render('login', {msg: 'Error'});
		if (!user) return res.render('login', {msg: 'user not found'});
		user.comparePassword(req.body.password, function(err, isMatch) {
			if (err) return res.render('login', {msg: err});
			if (isMatch) {
				req.session.user_id = user._id;
				return res.redirect('/');
			} else {
				return res.render('login', {msg: 'Invalid password'});
			}
		});
	});
});
app.post('/signup', function (req, res) {
	if (!req.body.username) return res.render('alpha', {key: false, msg : 'Username is blank'});
	if (!req.body.password) return res.render('alpha', {key: false, msg : 'Password is blank'});
	var newuser = new User({
		name: req.body.username.toLowerCase(),
		email: req.body.email,
		password: req.body.password
	});
	newuser.save(function(err, u) {
		console.log(err);
		if (err) return res.render('alpha', {key: false, msg : 'Username is taken'});
		res.redirect('/');
	});
});
app.get('/logout', function(req, res){
	  delete req.session.user_id;
	  res.redirect('/'); 
});
app.get('*', function (req, res) {
	res.render('notfound');
});
/*
* END ROUTES
*/
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});