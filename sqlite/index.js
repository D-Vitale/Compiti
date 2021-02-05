const express = require("express")
const app = new express()
const sqlite3 = require("sqlite3").verbose()
const db = new sqlite3.Database("./data.db3")

const port = 8080

app.use(require("body-parser").json())

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username VARCHAR(255), password VARCHAR(255))")
  const stm = db.prepare("INSERT INTO users VALUES (?, ?)")
  for (let i = 0; i < 10; i++) {
    stm.run(`User${i}`, `User${i}`)
  }
  stm.finalize()
})

app.post("/login", (req, res) => {
  const body = req.body
  const user = body.username
  const pwd = body.password
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [user, pwd], (err, row) => {
    if (row) {
      res.status(200).json({ ok: true })
    } else {
      res.status(401).json({ ok: false })
    }
  })
})

app.listen(port, () => console.log(`Listening on port ${port}`))
