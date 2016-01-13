var db = require('../models/dbconnect.js');
var User = require('../models/users.js');
var Trips = require('../models/trips.js');
var TripItems = require('../models/tripItem.js');
var request = require('request');
var bluebird = require('bluebird');

module.exports = {

  authCheck : function(req, res, next) {
    if (req.isAuthenticated()) {
      //return next();
      res.send(req.user);
    } else {
      res.redirect('/login');
    }
  },

  signup : function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    console.log("req body",req.body)
    User.find({username: username}, function(err, success){
      if(err){
        console.log("hit err", err);
      } else{
        return success;
      }
    })
    .then(function(success){
      if(success.length !== 0){
        console.log("sending back found user ", success)
        res.send(success)
      } else{
        User.create({username: username, password: password}, function(err, results){
          if (err) {
            console.log("Error creating user", err);
          } else {
            console.log("Created user", results)
            return results;
          }
        })
        .then(function(result){
          req.session.user = username;
          console.log("User created by SignUp");
          res.send(result);
        })
      }
    })
  },

  storeUser: function(igProfile, token) {
    var userObj = {};

    userObj.id = igProfile.id;
    userObj.image = igProfile._json.data.profile_picture;
    userObj.username = igProfile.username;
    userObj.token = token;

    //console.log('userobj', userObj);

    User.find({id: igProfile.id}, function(err, success) {
      if (err) {
        console.log('user already exists', err);
      } else {
        return success;
      }
    })
    .then(function(success) {
      if (success.length !== 0) {
        console.log('sending back found user', success);
        //res.send(success);
      } else {
        User.create(userObj, function(err, results) {
          if (err) {
            console.log('Error creating user', err);
          } else {
            console.log('Created user', results);
            return results;
          }
        });
        // .then(function(result) {
        //   req.session.user = username;
        //   console.log("User created by SignUp");
        //   res.send(result);
        // });
      }
    });
  },

  fetchIGPhotos: function(req, res, next) {
    console.log('req user', req.user.token);
    var token = req.user.token;
    var igURL = 'https://API.instagram.com/v1/locations/search?lat=48.858844&lng=2.294351&access_token='+ token;
    request(igURL, function(err, response, body) {
      res.send(body);
      console.log(body);
    });
    //res.status(200).send();
  },

  login : function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    console.log("Logging in user", req.body)
    User.findOne({username:username},function(err, result){
      if (err || !result) {
        console.log("Error finding username verifyUser", err)
        res.send(result);
      } else {
        console.log("Result of user find in login", result)
        result.comparePassword(password, function(err, found) {
          if(err) console.log("Error comparing password", err)
          console.log("Compare Password", found)
          if (found) {
            req.session.regenerate(function(){
            req.session.user = username;
            res.send(found);
            });
          } else {
            res.send(found);
          }
        });

      }
    });
  },
  // findUser: function(req, res, next) {
  //   var username = req.url.split('/')[3]
  //   User.findOne({username:username},function(err, result){
  //     if (err) {
  //       console.log("Error finding username:", err);
  //     } else {
  //       console.log("Found:", result)
  //       res.send(result);
  //     }
  //   });
  // },

  findAllUserTrips: function(req, res, next) {
    console.log("userID", req);
    var userId = req.url.split('/')[4];
    var myTrips = [];
    User.findById({ _id: userId }, function(err, user) {
      if (err) {
        console.log("findById error", err)
        return err;
      } else {
        console.log("findbyID Results", trip);
        return user;
      }
    })
    .then(function(user){
      var tripLength = user.trips.length;
      user.trips.forEach(function(tripId){
        Trips.findById({ _id: tripId }, function(err, trip) {
          if (err) {
            console.log("Error finding Trips by tripId", err)
          } else {
            console.log("Found trip", trip)
            myTrips.push(trip);
            if(tripLength === myTrips.length){
              console.log("myTrip:", myTrips)
              res.send(myTrips);
            }
          }
        });
      });
    });
  },

  // findOneUserTrip): function(req, res, next) {
  // },

  // addTrips : function(req, res, next) {
  //   var userId = req.url.split('/')[3];
  //   User.findById({ _id: userId },function(err, result){
  //     if (err) {
  //       console.log("Error finding username:", err);
  //     } else {
  //       var newTrips = req.body.trips;
  //       var currentTrips = result.trips;
  //       newTrips.forEach(function(trip){
  //         currentTrips.push(trip);
  //       })
  //       result.trips = currentTrips;
  //       result.save(function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //         res.send(result);
  //       });
  //     }
  //   });
  // },

  addTrip: function(user, id) {
    return User.findOne({username: user}, function(err, foundUser) {
      if (err) {
        return err;
      }
      foundUser.trips.push(id);
      foundUser.save();
    });
  },


  logout : function(req, res, next) {
    req.logout();
  }
};

