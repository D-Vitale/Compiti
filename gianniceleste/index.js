const express = require("express")
const app = new express()
const sql = require("sqlite3").verbose()
const db = new sql.Database("./data.db3")

const port = process.argv.slice(2)[0] === "--port" ? process.argv.slice(2)[1] : 8080

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS chiamate (
    ip TEXT,
    c INT
    )`)
})
const ciao = new Date()
console.log(ciao.toISOString())

const pippo = (req, res) => {
  const ip = req.headers["x-forwarded-for"] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null)

  const stmt = db.run("INSERT INTO chiamate VALUES (?)", [ip,  new Date().toISOString()], (rows, err) => {
    if(err) {
      return res.send(err.stack)
    }
  })
  const a = db.all("SELECTATI LA ROBA")
}



app.get("/", pippo)

app.all("*", pippo)

app.listen(port, () => console.log(`Listening on port ${port}`))