var db = require("../database");

// get the queries ready - note the ? placeholders
var insertJog = db.prepare(
  "INSERT INTO jog (user_id, start_time, distance, duration) VALUES (?, ?, ?, ?)"
);

var updateJogById = db.prepare('UPDATE jog SET start_time = ?, distance = ?, duration = ? WHERE id = ?')
var selectJogById = db.prepare("SELECT * FROM jog WHERE id = ?");
var selectJogsByUser = db.prepare("SELECT * FROM jog WHERE user_id = ?");
var deleteJogById = db.prepare("DELETE FROM jog WHERE id = ?");

class Jog {
  static insert(userId, startTime, distance, duration) {
    // run the insert query
    var info = insertJog.run(userId, startTime, distance, duration);

    // check what the newly inserted row id is
    var jogId = info.lastInsertRowid;

    return jogId;
  }

  static findById(id) {
    var row = selectJogById.get(id);

    if (row) {
      return new Jog(row);
    } else {
      return null;
    }
  }

    static findByUser(userId) {
      var times = selectJogsByUser.all(userId);

      if (times) {
        return times.map(time => new Jog(time));
      } else {
        return null;
      }
    }

    static updateById(startTime, distance, duration, id) {
      // var times = selectJogsByUser.all(userId);
      updateJogById.run(startTime, distance, duration, id);
    }

    static deleteById(id) {
      // var times = selectJogsByUser.all(userId);
      deleteJogById.run(id);
    }

  constructor(databaseRow) {
    this.id = databaseRow.id;
    this.startTime = databaseRow.start_time;
    this.duration = databaseRow.duration;
    // this.user_id = databaseRow.user_id;
    this.distance = databaseRow.distance;
    this.avgSpeed = (this.distance/this.duration).toFixed(2);
  }
}

module.exports = Jog;
