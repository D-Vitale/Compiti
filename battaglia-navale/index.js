const express = require("express")
const app = new express
const sqlite = require("sqlite3").verbose()
const db = new sqlite.Database(":memory:")
const { fillField } = require("./field")

const port = 8080

app.use(express.json())

const field = []
const ships = []

const w = process.argv[2] || 10
const h = process.argv[3] || 10
const s = process.argv[4] || 10

fillField(w, h, s, field, ships)

db.run(`CREATE TABLE IF NOT EXISTS teams (
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  score INT NOT NULL,
  lastlog VARCHAr(255) NOT NULL
)`)

app.get("/", ({ query: { format } }, res) => {
  const visibleField = field.map(row => row.map(cell => (
    {
      team: cell.team,
      x: cell.x,
      y: cell.y,
      hit: cell.hit,
      ship: cell.hit ? cell.ship ? { id: cell.shipId, alive: cell.ship.alive, killer: cell.ship.killer } : null : null
    }
  )))
  if (format === "json") {
    res.json({ visibleField })
  } else {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>battaglia navale</title>
      <style>
        table, td, th {
          border: 1px solid black;
        }
        
        table {
          width: 50%;
          border-collapse: collapse;
        }
      </style>
    </head>
    <body>
      <table>
        <tbody>
          ${field.map(row => `<tr>${row.map(cell => `<td>${cell.ship ? cell.ship.id : "acqua"}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </body>
    </html>
		`)
  }
})

app.post("/login", ({ body: { team, password } }, res) => {
  const time = new Date().getTime()
  db.run("INSERT INTO teams (name, password, score, lastlog) VALUES (?, ?, ?, ?)", [team, password, 0, time], (err) => {
    if (err) {
      throw err
    } else {
      res.json({
        message: "Registrazione avvenuta con successo",
        username: team,
        password,
        score: 0
      })
    }
  })
})

app.post("/score", ({ body: { team } }, res) => {
  db.get("SELECT * FROM teams WHERE name = ?", team, (err, row) => {
    if (err) {
      throw err
    } if (row) {
      res.json({
        team: row.name,
        score: row.score
      })
    } else {
      res.sendStatus(404)
    }
  })
})

app.post("/fire", ({ body: { x, y, team, password } }, res) => {
  const cell = y < h ? field[y][x] : null
  const time = new Date().getTime()
  let points = 0
  let message = "acqua"
  db.get("SELECT * FROM teams WHERE name = ? AND password = ?", [team, password], (err, row) => {
    if (err) {
      throw err
    } if (!row) {
      res.sendStatus(401)
    } else if ((time - row.lastlog) < 1000) {
      points = -1
      message = "too fast"
      db.run("UPDATE teams SET score = ? WHERE name = ? AND password = ?", [row.score + points, team, password], (err) => {
        if (err) {
          throw err
        }
      })
      res.json({ message, points })
    } else if ((time - row.lastlog) >= 1000) {
      db.run("UPDATE teams SET lastlog = ? WHERE name = ? AND password = ?", [time, team, password], (err) => {
        if (err) {
          throw err
        }
      })
      if (!cell) {
        message = "fuori campo"
        points = -3
      } else if (!cell.hit) {
        cell.hit = true
        cell.team = team
        if (cell.ship) {
          cell.ship.curHp -= 1
          if (cell.ship.curHp === 0) {
            message = "nave affondata"
            cell.ship.alive = false
            points = 3
            cell.ship.killer = row.name
          } else {
            message = "nave colpita"
            points = 1
          }
          cell.name = team
        }
      } else if (cell.hit) {
        message = "casella già colpita"
        points = -1
      }
      db.run("UPDATE teams SET score = ? WHERE name = ? AND password = ?", [row.score + points, team, password], (err) => {
        if (err) {
          throw err
        }
      })
      res.json({
        x, y, team,
        hit: cell ? cell.ship ? true : false : false,
        message, points
      })
    }
  })
})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(port, () => console.log("Listening on port", port))