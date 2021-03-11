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
  score INT NOT NULL,
  lastlog VARCHAr(255) NOT NULL
)`)

app.get("/", ({ query: { format } }, res) => {
  if (format === "json") {
    res.json({ field })
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

app.post("/fire", ({ body: { x, y, team } }, res) => {
  let hit = false
  const cell = field[y][x]
  const time = new Date().getTime()
  db.get("SELECT * FROM teams WHERE name = ?", team, (err, row) => {
    if (err) {
      throw err
    } else if (!row) {
      db.run("INSERT INTO teams (name, score, lastlog) VALUES (?, ?, ?)", [team, 0, time], (err) => {
        if (err) {
          throw err
        }
        if (cell.ship) {
          let score = 1
          hit = true
          cell.ship.curHp -= 1
          if (cell.ship.curHp === 0) {
            cell.ship.alive = false
            score += 2
            cell.ship.killer = row.name
          }
          cell.ship = null
          db.run("UPDATE teams SET score = ? WHERE name = ?", [score, team], (err) => {
            if (err) {
              throw err
            }
          })
        }
        res.json({
          x, y, team, hit
        })
      })
    } else if ((time - row.lastlog) < 1000) {
      const score = row.score
      db.run("UPDATE teams SET score = ? WHERE name = ?", [score - 1, team], (err) => {
        if (err) {
          throw err
        }
      })
      res.json({ message: "too fast" })
    } else if ((time - row.lastlog) >= 1000) {
      db.run("UPDATE teams SET lastlog = ? WHERE name = ?", [time, team], (err) => {
        if (err) {
          throw err
        }
      })
      if (cell.ship) {
        let score = row.score
        hit = true
        cell.ship.curHp -= 1
        if (cell.ship.curHp === 0) {
          cell.ship.alive = false
          score += 3
          cell.ship.killer = row.name
        } else {
          score += 1
        }
        cell.ship = null
        db.run("UPDATE teams SET score = ? WHERE name = ?", [score, team], (err) => {
          if (err) {
            throw err
          }
        })
      }
      res.json({
        x, y, team, hit
      })
    }
  })
})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(port, () => console.log("Listening on port", port))