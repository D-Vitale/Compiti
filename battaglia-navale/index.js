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
  bulletsFired INT NOT NULL,
  lastlog VARCHAr(255) NOT NULL
)`)

app.get("/", ({ query: { format } }, res) => {
  const gameStatus = ships.some(e => e.alive)
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
          ${field.map(row => `<tr>${row.map(cell => `<td>${cell.hit ? cell.ship ? cell.ship.id : "acqua" : "X"}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
      ${gameStatus ? "" : "<p>TUTTE LE NAVI SONO STATE AFFONDATE</p>"}
    </body>
    </html>
		`)
  }
})

app.post("/login", ({ body: { team, password } }, res) => {
  db.get("SELECT * FROM teams WHERE name = ? AND password = ?", [team, password], (err, row) => {
    if (err) {
      throw err
    } else if (row) {
      res.status(409).json({
        message: "Account già esistente",
        username: row.name,
        password: row.password,
        score: row.score
      })
    } else {
      db.run("INSERT INTO teams (name, password, score, bulletsFired, lastlog) VALUES (?, ?, ?, ?, ?)", [team, password, 0, 0, 0], (err) => {
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
    }
  })
})

app.post("/score", ({ body: { team, password } }, res) => {
  db.get("SELECT name, score, bulletsFired FROM teams WHERE name = ? AND password = ?", [team, password], (err, row) => {
    if (err) {
      throw err
    } if (row) {
      res.json({
        team: row.name,
        score: row.score,
        bulletsFired: row.bulletsFired
      })
    } else {
      res.status(401).json({
        message: "Username o password errati"
      })
    }
  })
})

app.post("/fire", ({ body: { x, y, team, password } }, res) => {
  const gameStatus = ships.some(e => e.alive)

  if (!gameStatus) {
    res.status(400).json({ message: "Tutte le navi sono state affondate" })
  }

  const cell = y < h && y >= 0 ? field[y][x] : null
  const time = new Date().getTime()
  let points = 0
  let message = "acqua"

  db.get("SELECT * FROM teams WHERE name = ? AND password = ?", [team, password], (err, row) => {
    if (err) {
      throw err
    } if (!row) {
      res.status(401).json({
        message: "Username o password errati"
      })
    } else if ((time - row.lastlog) < 1000) {
      points = -1
      message = "too fast"
      db.run("UPDATE teams SET score = ?, bulletsFired = ? WHERE name = ? AND password = ?", [row.score + points, row.bulletsFired + 1, team, password], (err) => {
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
            ships[cell.ship.id].alive = false
            points = 3
            cell.ship.killer = row.name
          } else {
            message = "nave colpita"
            points = 1
          }
        }
      } else if (cell.hit) {
        message = "casella già colpita"
        points = -1
      }
      db.run("UPDATE teams SET score = ?, bulletsFired = ? WHERE name = ? AND password = ?", [row.score + points, row.bulletsFired + 1, team, password], (err) => {
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

app.get("/standing", (req, res) => {
  db.all("SELECT name, score, bulletsFired FROM teams ORDER BY score DESC, bulletsFired", (err, rows) => {
    if (err) {
      throw err
    } else if (rows) {
      const standing = rows.map((e, i) => ({ position: i + 1, team: e.name, score: e.score, bulletsFired: e.bulletsFired }))
      res.json(standing)
    }
  })
})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(port, () => console.log("Listening on port", port))