// load library
const sqlite = require('better-sqlite3')

// open a database
var db = sqlite('./database.sqlite')


// export the database so we can use it elsewhere
module.exports = db
