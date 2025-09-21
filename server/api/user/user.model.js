'use strict';

var mongoose = require('mongoose'); // Remove Bluebird promisify
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google'];

var UserSchema = new Schema({
  name: String,
  email: {
    type: String,
    lowercase: true
  },
  role: {
    type: String,
    default: 'user'
  },
  password: String,
  provider: String,
  salt: String,
  facebook: {},
  twitter: {},
  google: {},
  github: {}
});

/**
 * Virtuals
 */

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'name': this.name,
      'role': this.role
    };
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty email
UserSchema
  .path('email')
  .validate(function(email) {
    if (authTypes.indexOf(this.provider) !== -1) {
      return true;
    }
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
UserSchema
  .path('password')
  .validate(function(password) {
    if (authTypes.indexOf(this.provider) !== -1) {
      return true;
    }
    return password.length;
  }, 'Password cannot be blank');

// Validate email is not taken
UserSchema
  .path('email')
  .validate(function(email) {
    // Return a promise instead of using callback
    return this.constructor.findOne({ email: email }).exec()
      .then(function(user) {
        if (user) {
          if (this.id === user.id) {
            return true; // Same user, valid
          }
          return false; // Different user with same email, invalid
        }
        return true; // No user found, valid
      }.bind(this));
  }, 'The specified email address is already in use.');

var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook - Updated to use promises
 */
UserSchema
  .pre('save', async function(next) {
    try {
      // Handle new/update passwords
      if (this.isModified('password')) {
        if (!validatePresenceOf(this.password) && authTypes.indexOf(this.provider) === -1) {
          throw new Error('Invalid password');
        }

        // Make salt with promises
        this.salt = this.makeSalt();
        this.password = this.encryptPassword(this.password);
      }
      next();
    } catch (err) {
      next(err);
    }
  });

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} password
   * @return {Boolean}
   * @api public
   */
  authenticate: function(password) {
    return this.password === this.encryptPassword(password);
  },

  /**
   * Make salt
   *
   * @param {Number} byteSize Optional salt byte size, default to 16
   * @return {String}
   * @api public
   */
  makeSalt: function(byteSize) {
    var defaultByteSize = 16;
    byteSize = byteSize || defaultByteSize;
    return crypto.randomBytes(byteSize).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) {
      return null;
    }

    var defaultIterations = 10000;
    var defaultKeyLength = 64;
    var defaultDigest = 'sha256'; // Added required digest parameter
    var salt = Buffer.from(this.salt, 'base64'); // Updated Buffer constructor

    return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, defaultDigest)
                 .toString('base64');
  }
};

module.exports = mongoose.model('User', UserSchema);
