'use strict';

var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var { expressjwt: expressJwt } = require('express-jwt'); // Updated import syntax
var compose = require('composable-middleware');
var User = require('../api/user/user.model');

// Updated express-jwt configuration for newer versions
var validateJwt = expressJwt({
  secret: config.secrets.session,
  algorithms: ['HS256'], // Required in newer versions
  getToken: function(req) {
    // Custom token extraction
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.access_token) {
      return req.query.access_token;
    }
    return null;
  }
});

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(function(req, res, next) {
      // Token extraction is now handled by getToken above
      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function(req, res, next) {
      // Updated: findByIdAsync doesn't exist in newer Mongoose
      User.findById(req.user._id)
        .then(function(user) {
          if (!user) {
            return res.status(401).end();
          }
          req.user = user;
          next();
        })
        .catch(function(err) {
          return next(err);
        });
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >=
          config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.status(403).send('Forbidden');
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id, role) {
  return jwt.sign({ _id: id, role: role }, config.secrets.session, {
    expiresIn: '5h' // Updated: expiresInMinutes is deprecated, use expiresIn
  });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) {
    return res.status(404).send('Something went wrong, please try again.');
  }
  var token = signToken(req.user._id, req.user.role);
  res.cookie('token', token);
  res.redirect('/');
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
