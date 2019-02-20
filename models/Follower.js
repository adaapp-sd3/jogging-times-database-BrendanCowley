var db = require("../database");
// get the queries ready - note the ? placeholders
var insertFollower = db.prepare(
  "INSERT INTO follower (user_id, follower_id) VALUES (?, ?)"
);
var selectFollowerById = db.prepare("SELECT * FROM follower WHERE user_id = ? AND follower_id = ?");
var selectFollowersById = db.prepare('SELECT * FROM follower JOIN user ON follower.follower_id = user.id WHERE user_id = ?');
var selectFollowingById = db.prepare("SELECT * FROM follower JOIN user ON follower.user_id = user.id WHERE follower_id = ?");

// var selectFollowerByEmail = db.prepare(
//   "SELECT * FROM follower WHERE email = ?"
// );

class Follower {
  static insert(userId, followerId) {
    // run the insert query
    insertFollower.run(userId, followerId);

    return followerId;
  }

  static findFollower(userId, followerId){
    var follower = selectFollowerById.get(userId, followerId)

    if(follower){
      return new Follower(follower)
    }
    else {
      return null
    }
  }

  static findFollowers(userId) {
    var followers = selectFollowersById.all(userId);

    if (followers) {
      return followers
    } else {
      return null;
    }
  }

  static findFollowing(followerId) {
    var following = selectFollowingById.all(followerId);

    if (following) {
      return following
    } else {
      return null;
    }
  }

  constructor(databaseRow) {
    this.user_id = databaseRow.user_id;
    this.follower_id = databaseRow.follower_id;
  }
}

module.exports = Follower;
