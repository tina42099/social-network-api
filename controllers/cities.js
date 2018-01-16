const City = require('../models/schemas/city');
const config = require('../models/config');
const jwt = require('jwt-simple')

/*
* C.R.U.D. routes
*/
exports.createCity = (req, res, next) => {

    const cityData = {};
    
    if (req.body.name)
        cityData.name = req.body.name;
    if (req.body.location_coordinates)
        cityData.location_coordinates = req.body.location_coordinates;
    if (req.body.past_visitors)
        cityData.past_visitors = req.body.past_visitors;
    if (req.body.description)
        cityData.description = req.body.description;
    if (req.body.image)
        cityData.image = req.body.image;

    // create new city
    const newCity = new City(cityData);
    newCity.save()
    .then(city => {
        if (!city) return res.status(500).send('City failed to create')
    }).catch(err => {
        if (err) {
            if (err.code === 11000)
                return res.status(400).send('City already registered');
            return res.status(400).send(err.message);
        }
    });
};

exports.getAllCities = (req, res, next) => {
    City.find({}).then(citys => res.json(citys)).catch(next);
}

exports.getCityById = (req, res, next) => {
    City.findById(req.body.id).then(city => {
        if (!city) return res.status(404).send('Could not find city: invalid id');
        return res.json(city)
    }).catch(next);
};

exports.updateCity = (req, res, next) => {
    City.findOneAndUpdate(req.body.id, req.body).then(city => {
        if (!city) return res.status(404).send('No city with that ID');
        return res.sendStatus(200);
    }).catch(next);
};

exports.deleteCity = (req, res, next) => {
    City.findByIdAndRemove(req.body.id)
    .then(city => res.sendStatus(200))
    .catch(next);
}
