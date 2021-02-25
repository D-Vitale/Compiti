const express = require("express")
const app = new express()
const sql = require("sqlite3").verbose()
const db = new sql.Database("./data.db3")

const port = process.argv.slice(2)[0] === "--port" ? process.argv.slice(2)[1] : 8080

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    ip TEXT,
    date INT
    )`)
})

app.get("/logs-count", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null)
  db.run("INSERT INTO logs (ip, date) VALUES (?, ?)", [ip, new Date().toISOString()], (err) => {
    if (err) {
      console.log(err)
    }
  })

  db.all("SELECT * FROM logs WHERE ip = ?", [ip], (err, row) => {
    if (err) {
      console.error(err)
    } else {
      res.status(200).send({ data: row })
    }
  })
})

app.listen(port, () => console.log(`Listening on port ${port}`))