var express = require("express");
var bcrypt = require("bcryptjs");

var User = require("./models/User");
var Follower = require("./models/Follower");
var Jog = require("./models/Jog");

var routes = new express.Router();

var saltRounds = 10;

function formatDateForHTML(date) {
  const formattedDate = new Date(date);
  console.log(formattedDate.toLocaleString());
  return formattedDate.toLocaleString("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// main page
routes.get("/", function(req, res) {
  if (req.cookies.userId) {
    // if we've got a user id, assume we're logged in and redirect to the app:
    res.redirect("/times");
  } else {
    // otherwise, redirect to login
    res.redirect("/sign-in");
  }
});

// show the create account page
routes.get("/create-account", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (loggedInUser) {
    res.redirect("/times");
    return;
  }

  res.render("create-account.html");
});

// handle create account forms:
routes.post("/create-account", function(req, res) {
  var form = req.body;

  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (re.test(String(form.email).toLowerCase()) != true) {
    throw new Error("Invalid Email!");
  }

  if (form.password != form.passwordConfirm) {
    throw new Error("Passwords do not match!");
  }

  // hash the password - we dont want to store it directly
  var passwordHash = bcrypt.hashSync(form.password, saltRounds);

  // create the user
  var userId = User.insert(form.name, form.email, passwordHash);

  // set the userId as a cookie
  res.cookie("userId", userId);

  // redirect to the logged in page
  res.redirect("/times");
});

// show the sign-in page
routes.get("/sign-in", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (loggedInUser) {
    res.redirect("/times");
    return;
  }
  res.render("sign-in.html");
});

routes.post("/sign-in", function(req, res) {
  var form = req.body;

  // find the user that's trying to log in
  var user = User.findByEmail(form.email);

  // if the user exists...
  if (user) {
    console.log({ form, user });
    if (bcrypt.compareSync(form.password, user.passwordHash)) {
      // the hashes match! set the log in cookie
      res.cookie("userId", user.id);
      // redirect to main app:
      res.redirect("/times");
    } else {
      // if the username and password don't match, say so
      res.render("sign-in.html", {
        errorMessage: "Email address and password do not match"
      });
    }
  } else {
    // if the user doesnt exist, say so
    res.render("sign-in.html", {
      errorMessage: "No user with that email exists"
    });
  }
});

// handle signing out
routes.get("/sign-out", function(req, res) {
  // clear the user id cookie
  res.clearCookie("userId");

  // redirect to the login screen
  res.redirect("/sign-in");
});

// list all job times
routes.get("/times", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }

  reducer = (a, b) => a + b;
  var totalDistance = Jog.findByUser(req.cookies.userId)
    .map(item => item.distance)
    .reduce(reducer, 0);
  var totalTime = Jog.findByUser(req.cookies.userId)
    .map(item => item.duration)
    .reduce(reducer, 0);
  var avgSpeed = totalDistance / totalTime;

  res.render("list-times.html", {
    user: loggedInUser,
    stats: {
      totalDistance: totalDistance.toFixed(2),
      totalTime: totalTime.toFixed(2),
      avgSpeed: avgSpeed.toFixed(2)
    },

    times: Jog.findByUser(req.cookies.userId).map(jog => ({
      ...jog,
      startTime: formatDateForHTML(jog.startTime),
      duration: jog.duration.toFixed(2),
      distance: jog.distance.toFixed(2)
    }))
  });
});

// show the create time form
routes.get("/times/new", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }

  res.render("create-time.html", {
    user: loggedInUser
  });
});

// handle the create time form
routes.post("/times/new", function(req, res) {
  var form = req.body;

  Jog.insert(req.cookies.userId, form.startTime, form.distance, form.duration);
  res.redirect("/times");
});

// show the edit time form for a specific time
routes.get("/times/:id", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }
  var timeId = req.params.id;
  console.log("get time", timeId);

  var jogTime = Jog.findById(timeId);

  if (jogTime.user_id != req.cookies.userId) {
    res.redirect("/times");
    return;
  }
  res.render("edit-time.html", {
    user: loggedInUser,
    time: {
      id: jogTime.id,
      startTime: jogTime.startTime,
      duration: jogTime.duration.toFixed(2),
      distance: jogTime.distance.toFixed(2)
    }
  });
});

// handle the edit time form
routes.post("/times/:id", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }
  var timeId = req.params.id;
  var form = req.body;

  console.log("edit time", {
    timeId: timeId,
    form: form
  });

  Jog.updateById(form.startTime, form.distance, form.duration, timeId);
  res.redirect("/times");
});

// handle deleteing the time
routes.get("/times/:id/delete", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }

  var timeId = req.params.id;
  var jogTime = Jog.findById(timeId);
  if (jogTime.user_id != req.cookies.userId) {
    res.redirect("/times");
    return;
  }
  console.log("delete time", timeId);

  Jog.deleteById(timeId);
  res.redirect("/times");
});

routes.get("/account", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }
  var users = User.findAllButYou(req.cookies.userId).filter(
    user => !Follower.findFollower(req.cookies.userId, user.id)
  );
  var followers = Follower.findFollowers(req.cookies.userId);
  var following = Follower.findFollowing(req.cookies.userId);

  res.render("account-details.html", {
    user: loggedInUser,
    users: users,
    followers: followers,
    following: following
  });
});

routes.post("/account", function(req, res) {
  var form = req.body;

  if (form.id) {
    Follower.insert(req.cookies.userId, form.id);
    res.redirect("/account");
  }

  if (form.delete) {
    User.deleteById(req.cookies.userId);
    res.clearCookie("userId");

    // redirect to the login screen
    res.redirect("/sign-in");
  }
});

routes.get("/timeline", function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);

  if (!loggedInUser) {
    res.redirect("/sign-in");
    return;
  }
  var userAndFriendsJogs = Follower.findAllByFollowed(req.cookies.userId).map(
    jog => ({
      ...jog,
      start_time: formatDateForHTML(jog.start_time),
      avgSpeed: (jog.distance / jog.duration).toFixed(2),
      duration: jog.duration.toFixed(2),
      distance: jog.distance.toFixed(2)
    })
  );
  var speedRanking = userAndFriendsJogs.sort((a, b) => b.avgSpeed - a.avgSpeed);
  var distanceRanking = userAndFriendsJogs.sort(
    (a, b) => b.distance - a.distance
  );
  var durationRanking = userAndFriendsJogs.sort(
    (a, b) => b.duration - a.duration
  );

  res.render("timeline.html", {
    user: loggedInUser,
    jogs: userAndFriendsJogs,
    speeds: speedRanking,
    distance: distanceRanking,
    duration: durationRanking
  });
});

module.exports = routes;
