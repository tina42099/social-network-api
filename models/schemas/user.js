const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const validator = require('email-validator');

var userSchema = new Schema({
    name: String,
    email: {type: String, unique: true, sparse: true, trim: true},
    hash: String,
    token: String,
    age: Number,
    gender: String,
    address: String,
    check_ins: [{
        location: [{
            place: String,
            status: String,
            check_in_time: Date,
            check_out_time: Date
        }],
        friends: [String],
        interests: [String],
    }],
  },
  {
    toObject: { getters: true },
    timestamps: {
      createdAt: 'createdDate',
      updatedAt: 'updatedDate'
    },
  }
);

userSchema.pre('save', function(callback) {
    if (!this.email)
        return callback(new Error('Missing email'));
    if (!this.hash)
        return callback(new Error('Missing password'));
    if (this.isModified('hash'))
        this.hash = bcrypt.hashSync(this.hash);

    if (this.email && !validator.validate(this.email))
        return callback(new Error('Invalid email'));

    callback();
});


// methods for validating password
userSchema.methods.comparePassword = function(pw, callback) {
    bcrypt.compare(pw, this.hash, (err, isMatch) => {
        if (err) return callback(err);
        callback(null, isMatch);
    });
};
userSchema.methods.comparePasswordSync = function(pw) {
    return bcrypt.compareSync(pw, this.hash);
};

var User = mongoose.model('User', userSchema);

module.exports = User;
