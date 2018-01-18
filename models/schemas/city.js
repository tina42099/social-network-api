const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const validator = require('email-validator');

var citySchema = new Schema({
    name: String,
    state: String,
    country: String,
    zipcode: {type: String, unique: true},
    past_visitors: [String],
    // description: String,
    image: String
  },
  {
    usePushEach: true,
    toObject: { getters: true },
    timestamps: {
      createdAt: 'createdDate',
      updatedAt: 'updatedDate'
    },
  }
);

citySchema.pre('save', function(callback) {
    if (!this.name)
        return callback(new Error('Missing name'));
    if (!this.location_coordinates)
        return callback(new Error('Missing location coordinates'));
    callback();
});

var City = mongoose.model('City', citySchema);

module.exports = City;
