var express = require('express')
var bcrypt = require('bcryptjs')

var User = require('./models/User')
var Follower = require('./models/Follower')
var Jog = require('./models/Jog')

var routes = new express.Router()

var saltRounds = 10

// function formatDateForHTML(date) {
//   return new Date(date).toISOString().slice(0, -8)
// }

function formatDateForHTML(date) {
	const formattedDate = new Date(date)
	console.log(formattedDate.toLocaleString())
  return formattedDate.toLocaleString('en-GB', {
		day: 'numeric', month: 'numeric', year: '2-digit', hour: '2-digit', minute:'2-digit'
	})
}

// main page
routes.get('/', function(req, res) {
  if (req.cookies.userId) {
    // if we've got a user id, assume we're logged in and redirect to the app:
    res.redirect('/times')
  } else {
    // otherwise, redirect to login
    res.redirect('/sign-in')
  }
})

// show the create account page
routes.get('/create-account', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId)

  if(loggedInUser){
    res.redirect('/times')
    return
  }

  res.render('create-account.html')
})

// handle create account forms:
routes.post('/create-account', function(req, res) {
  var form = req.body

  // TODO: add some validation in here to check

  // hash the password - we dont want to store it directly
  var passwordHash = bcrypt.hashSync(form.password, saltRounds)

  // create the user
  var userId = User.insert(form.name, form.email, passwordHash)

  // set the userId as a cookie
  res.cookie('userId', userId)

  // redirect to the logged in page
  res.redirect('/times')
})

// show the sign-in page
routes.get('/sign-in', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId)

  if(loggedInUser){
    res.redirect('/times')
    return
  }
  res.render('sign-in.html')
})

routes.post('/sign-in', function(req, res) {
  var form = req.body

  // find the user that's trying to log in
  var user = User.findByEmail(form.email)

  // if the user exists...
  if (user) {
    console.log({ form, user })
    if (bcrypt.compareSync(form.password, user.passwordHash)) {
      // the hashes match! set the log in cookie
      res.cookie('userId', user.id)
      // redirect to main app:
      res.redirect('/times')
    } else {
      // if the username and password don't match, say so
      res.render('sign-in.html', {
        errorMessage: 'Email address and password do not match'
      })
    }
  } else {
    // if the user doesnt exist, say so
    res.render('sign-in.html', {
      errorMessage: 'No user with that email exists'
    })
  }
})

// handle signing out
routes.get('/sign-out', function(req, res) {
  // clear the user id cookie
  res.clearCookie('userId')

  // redirect to the login screen
  res.redirect('/sign-in')
})

// list all job times
routes.get('/times', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId)

  if(!loggedInUser){
    res.redirect('/sign-in')
    return
  }

  // fake stats - TODO: get real stats from the database
  reducer = (a, b) => a + b;
  var totalDistance = Jog.findByUser(req.cookies.userId).map(item => item.distance).reduce(reducer, 0);
  var totalTime = Jog.findByUser(req.cookies.userId).map(item => item.duration).reduce(reducer, 0);
  var avgSpeed = totalDistance/totalTime;

  res.render('list-times.html', {
    user: loggedInUser,
    stats: {
      totalDistance: totalDistance.toFixed(2),
      totalTime: totalTime.toFixed(2),
      avgSpeed: avgSpeed.toFixed(2)
    },

    // fake times: TODO: get the real jog times from the db
    times: Jog.findByUser(req.cookies.userId).map(jog => ({...jog, startTime: formatDateForHTML(jog.startTime), duration: jog.duration.toFixed(2), distance: jog.distance.toFixed(2)}))
  })
})

// show the create time form
routes.get('/times/new', function(req, res) {
  // this is hugely insecure. why?
  var loggedInUser = User.findById(req.cookies.userId)
  console.log(Jog.findByUser(req.cookies.userId))
  console.log(req.cookies.userId)

  if(!loggedInUser){
    res.redirect('/sign-in')
    return
  }

  res.render('create-time.html', {
    user: loggedInUser
  })
})

// handle the create time form
routes.post('/times/new', function(req, res) {
  var form = req.body

  console.log('create time', form)

  // TODO: save the new time
  Jog.insert(req.cookies.userId, form.startTime, form.distance, form.duration)
  res.redirect('/times')
})

// show the edit time form for a specific time
routes.get('/times/:id', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId)
  var timeId = req.params.id
  console.log('get time', timeId)

  // TODO: get the real time for this id from the db
  var jogTime = Jog.findById(timeId)

  res.render('edit-time.html', {
      user: loggedInUser,
      time: {
        id: jogTime.id,
        startTime: jogTime.startTime,
        duration: jogTime.duration.toFixed(2),
        distance: jogTime.distance.toFixed(2)
      }
  })
})

// handle the edit time form
routes.post('/times/:id', function(req, res) {
  var timeId = req.params.id
  var form = req.body

  console.log('edit time', {
    timeId: timeId,
    form: form
  })

  // TODO: edit the time in the db
  Jog.updateById(form.startTime, form.distance, form.duration, timeId)
  res.redirect('/times')
})

// handle deleteing the time
routes.get('/times/:id/delete', function(req, res) {
  var timeId = req.params.id
  console.log('delete time', timeId)

  // TODO: delete the time
  Jog.deleteById(timeId)
  res.redirect('/times')
})

routes.get('/account', function (req, res) {
  var loggedInUser = User.findById(req.cookies.userId)
  var users = User.findAllButYou(req.cookies.userId).filter(user => !Follower.findFollower(req.cookies.userId, user.id))
  var followers = Follower.findFollowers(req.cookies.userId)
  var following = Follower.findFollowing(req.cookies.userId)
  console.log(following)
  res.render('account-details.html', {
    user: loggedInUser,
    users: users,
    followers: followers,
    following: following
  })
})

routes.post('/account', function(req, res) {
  var form = req.body;

  if(form.id){
    Follower.insert(req.cookies.userId, form.id)
    res.redirect('/account')
  }

})

module.exports = routes
