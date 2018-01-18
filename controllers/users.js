const User = require('../models/schemas/user');
const config = require('../models/config');
const jwt = require('jwt-simple')

/*
* C.R.U.D. routes
*/
exports.createUser = (req, res, next) => {

    const userData = {};
    // validate email
    // http://emailregex.com
    if (req.body.name)
        userData.name = req.body.name
    if (req.body.email) {
        if (!(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email)))
            return res.status(400).send('Invalid email');
        else
            userData.email = req.body.email;
    }

    // check if password was provided
    if (req.body.password)
        userData.hash = req.body.password;
    if (req.body.hash)
        userData.hash = req.body.hash;
    if (req.body.age)
        userData.age = req.body.age
    if (req.body.gender)
        userData.gender = req.body.gender
    if (req.body.address)
        userData.address = req.body.address

    // create new user
    const newUser = new User(userData);
    newUser.save()
    .then(user => {
        if (!user) return res.status(500).send('User failed to create')

        let payload = {
            id: user._id,
            email: user.email
        }
        let token = jwt.encode(payload, config.token_secret);
        user.token = token;
        user.save()
        .then(user => {
            if (!user) return res.status(500).send('User failed to create')
            return res.json({
                userId: user._id,
                token: user.token
            })
        })
    }).catch(err => {
        if (err) {
            if (err.code === 11000)
                return res.status(400).send('Email already registered');
            return res.status(400).send(err.message);
        }
    });
};

exports.updateCheckIn = (req, res, next) => {
    let latitude = req.body.lat
    let longitude = req.body.lng
    console.log(latitude)
    let cityName
    let config = {
        'latitude': latitude,
        'longitude': longitude
    }

    let zipcode
    
    // for (let i = 0; i < results[0].address_components.length; i++) {
            //     if (results[0].address_components[i].types[0] == 'postal_code') {
            //          zipcode = results[0].address_components[i].long_name
            //     }
            // }

    //geocoding.location(config, function(err, data) {
    geocoding.reverseGeocode(req.body.lat, req.body.lng, function(err, data) {
        if (err) return res.status(500).send('could not find location based on coordinates')
        else {
            let results = data.results[0].address_components
            for (let i = 0; i < results.length; i++) {
                if (results[i].types[0] == 'postal_code') {
                    zipcode = results[i].long_name
                    console.log(zipcode)
                }
            }
            Promise.all([
                City.findOne({ zipcode: zipcode }),
                User.findById(req.body.id)
            ]).then(newData => {
                const city = newData[0]
                const user = newData[1]
                if (city) {
                    city.past_visitors.push(req.body.userId)
                    city.markModified('past_visitors')
                    city.save()
                    .then(() => {
                        const newCheckIn = {
                            place_name: city.name,
                            coordinates: {lat: req.body.lat, lng: req.body.lng},
                            //status: req.body.status,
                            check_in_time: new Date()
                        }
                        console.log(newCheckIn)
                        user.check_ins.push(newCheckIn)
                        user.markModified('check_ins')
                        user.save()
                        .then(() => {
                            return res.sendStatus(200)
                        }).catch(next)
                    }).catch(next)
                }
                else {
                    const cityData = {}
                    cityData.zipcode = zipcode
                    cityData.past_visitors = []
                    cityData.past_visitors.push(req.body.id)
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].types[0] === "locality") {
                            cityData.name = results[i].long_name
                            cityName = cityData.name
                            console.log(cityName)
                        }
                        if (results[i].types[0] === "administrative_area_level_1") {
                            cityData.state = results[i].long_name
                        }
                        if (results[i].types[0] === "country") {
                            cityData.country = results[i].long_name
                        }
                    }
                    // cityData.name = results.administrativeAreaLevel1
                    // cityData.state = results.administrativeAreaLevel1
                    // cityData.country = results.country
                    const newCity = new City(cityData)
                    newCity.save()
                    .then(() => {
                        const newCheckIn = {
                            place_name: cityName,
                            coordinates: {lng: req.body.lng, lat: req.body.lat},
                            //status: req.body.status,
                            check_in_time: new Date()
                        }
                        console.log(newCheckIn)
                        user.check_ins.push(newCheckIn)
                        user.markModified('check_ins')
                        user.save()
                        .then(() => {
                            return res.sendStatus(200)
                        }).catch(next)
                    }).catch(next)
                }
                // }.then(city => {
                //     if(!city) return res.status(500).send('City failed to create')
                // })
                
            }).catch(next)
        }
    }, { sensor: true })
}

exports.getAllUsers = (req, res, next) => {
    User.find({}).then(users => res.json(users)).catch(next);
}

exports.updateCheckOut = (req, res, next) => {
    User.findById(req.body.id).then(user => {
        if (!user) return res.status(404).send('Could not find user: invalid id');
        else {
            last_check_in = user.check_ins.pop()
            last_check_in.check_out_time = new Date()
        }
    }).catch(next);
}

exports.getUserById = (req, res, next) => {
    User.findById(req.params.userId).then(user => {
        if (!user) return res.status(404).send('Could not find user: invalid id');
        return res.json(user)
    }).catch(next);
};

exports.updateUser = (req, res, next) => {
    User.findOneAndUpdate(req.body.id, req.body).then(user => {
        if (!user) return res.status(404).send('No user with that ID');
        return res.sendStatus(200);
    }).catch(next);
};

exports.deleteUser = (req, res, next) => {
    User.findByIdAndRemove(req.body.id)
    .then(user => res.sendStatus(200))
    .catch(next);
}

exports.getUserByEmail = (req, res, next) => {
  User.findOne({ email: req.params.email }, (err, user) => {
    if (err) return next(err)
    if (!user) return res.status(404).send('No user with email: ' + req.params.email)
    return res.json(user)    
  })
}

exports.addFriend = (req, res, next) => {
    User.findById(req.body.userId).then(user => {
        console.log(req.body.userId)
        console.log(req.params.friendId)
        if(!user) res.status(404).send('No user with id: ' + req.body.userId)
        if(user.friends.includes(req.params.friendId)) {
            return res.status(400).send('User is already friends with this user')
        }
        if(req.body.userId === req.params.friendId) {
            return res.status(400).send('User cannot add him/herself as a friend')
        }
        user.friends.push(req.params.friendId)
        console.log(user.friends)
        user.markModified('friends')
        user.save()
        return res.json(user)
    }).catch(next)
}

exports.addInterests = (req, res, next) => {    
    User.findById(req.body.userId)
    .then((user) => {
        for (var i in req.body.interests) {
            if(!user.interests.includes(req.body.interests[i])) {
                user.interests.push(req.body.interests[i])
            }
        }
        user.markModified('interests')
        user.save()
        return res.json(user)
    }).catch(next)
}

exports.search = (req, res, next) => {
    User.find({"name": { $regex : req.params.value, '$options' : 'i'} })
    .then((user) => {
        console.log(JSON.stringify(user))
        return res.json(user)
    })
}
