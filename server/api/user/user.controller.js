'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -password') // Remove Async
    .then(function(users) {
      res.status(200).json(users);
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};

/**
 * Creates a new user
 */
exports.create = function(req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save() // Remove Async
    .then(function(user) {
      var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresIn: '5h' });
      res.json({ token: token });
    })
    .catch(validationError.bind(null, res));
};

/**
 * Get a single user
 */
exports.show = function(req, res, next) {
  var userId = req.params.id;

  User.findById(userId) // Remove Async
    .then(function(user) {
      if (!user) {
        return res.status(404).end();
      }
      res.json(user.profile);
    })
    .catch(function(err) {
      return next(err);
    });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndDelete(req.params.id) // Updated method
    .then(function(user) {
      if (!user) {
        return res.status(404).end();
      }
      res.status(204).end();
    })
    .catch(function(err) {
      return handleError(res, err);
    });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId) // Remove Async
    .then(function(user) {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return user.save() // Remove Async
          .then(function() {
            res.status(204).end();
          });
      } else {
        return res.status(403).end();
      }
    })
    .catch(validationError.bind(null, res));
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;

  User.findOne({ _id: userId }, '-salt -password') // Remove Async
    .then(function(user) {
      if (!user) {
        return res.status(401).end();
      }
      res.json(user);
    })
    .catch(function(err) {
      return next(err);
    });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

function handleError(res, err) {
  return res.status(500).send(err);
}
