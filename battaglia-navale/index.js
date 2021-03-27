const express = require("express")
const app = new express
const sqlite = require("sqlite3").verbose()
const db = new sqlite.Database(":memory:")
const { fillField, renderField, getVisibleField } = require("./field")
const { renderStanding } = require("./standing")

const port = 8080

app.use(express.json())
app.use(express.static("public"))

const field = []
const ships = []

const w = process.argv[2] || 10
const h = process.argv[3] || 10
const s = process.argv[4] || 10

fillField(w, h, s, field, ships)

db.run(`CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  score INT NOT NULL,
  bulletsFired INT NOT NULL,
  lastlog VARCHAr(255) NOT NULL
)`)

app.get("/", ({ query: { format } }, res) => {
  const visibleField = getVisibleField(field)
  if (format === "json") {
    res.json({ visibleField })
  } else {
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>battaglia navale</title>
        <style>
          #field table{
            margin: 30px auto;
          }

          td {
            border: 1px solid white;
            width: 70px;
            height: 70px;
            display: inline-block;
            background-size: 150px;
            background-image: url(./water.gif);
          }
          
          td.hit {
            filter: blur(5px)
          }

          td.hit.ship {
            filter: hue-rotate(165deg);
          }

          td.hit.ship.killed {
            background-image: url(./killed.gif);
            background-size: 100px;
            filter: hue-rotate(0deg);
          }

          td.hit.ship {
            background-image: url(./fire.gif);
            background-size: 50px;
            background-position: center;
            background-repeat: no-repeat;
            filter: hue-rotate(0deg);
          }
          
          table {  
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
        <div id="field">
          ${renderField(visibleField)}
        </div>
        <script src="./script.js"></script>
      </body>
    </html>
		`)
  }
})

app.get("/getHtmlField", (req, res) => {
  res.send(renderField(getVisibleField(field)))
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
  db.get("SELECT id, name, score, bulletsFired FROM teams WHERE name = ? AND password = ?", [team, password], (err, row) => {
    if (err) {
      throw err
    } if (row) {
      const shipsKilled = ships.filter(e => e.killerId === row.id).map(e => ({ shipId: e.id, length: e.maxHp }))
      res.json({
        team: row.name,
        score: row.score,
        shipsKilled: shipsKilled.length ? shipsKilled : null,
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
    return res.status(400).json({ message: "Tutte le navi sono state affondate" })
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
            cell.ship.killerId = row.id
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

app.get("/standing", ({ query: { format } }, res) => {
  db.all("SELECT id, name, score, bulletsFired FROM teams ORDER BY score DESC, bulletsFired", (err, rows) => {
    if (err) {
      throw err
    } else if (rows) {
      const standing = rows.map((team, i) => {
        const shipsKilled = ships.filter(e => e.killerId === team.id).length
        return (
          {
            position: i + 1,
            team: team.name,
            score: team.score,
            shipsKilled,
            bulletsFired: team.bulletsFired
          }
        )
      })

      if (format === "json") {
        return res.json({ standing })
      }

      res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>battaglia navale</title>
          <style>
            .ptable table{
              margin: 30px auto;
            }
            
            .ptable{
              margin: 0px 0% 30px 0%;
            }
            
            th, td {
              padding: 10px;
              border-bottom: 1px solid black;
            }
            
            .headin{
              text-align: center;
              text-decoration: none;
              margin: 30px;
              display: block;
            }
            
            .wpos{
              text-align: center;
            }
            
            .wpos td{
              color: #00cc44;
            }
            
            .pos{
              text-align: center;
            }
            
            .pos td{
              color: #00001a;
            }
            
            table .col{
              border-bottom: 1px solid black;
            }
            
            .wpos:hover{
              background-color: #77ff21;
            }
            
            .wpos:hover td{
              color: #000000;
            }
            
            .pos:hover{
              background-color: #ff7b21;
            }
            
            .pos:hover td{
              color: #000000;
            }
          </style>
        </head>
        <body>
          <div id="standing" class="ptable">
            ${renderStanding(standing)}
          </div>
          <script src="./script.js"></script>
        </body>
      </html>
      `)
    }
  })
})

app.get("/getHtmlStanding", (req, res) => {
  db.all("SELECT id, name, score, bulletsFired FROM teams ORDER BY score DESC, bulletsFired", (err, rows) => {
    if (err) {
      throw err
    } else if (rows) {
      const standing = rows.map((team, i) => {
        const shipsKilled = ships.filter(e => e.killerId === team.id).length
        return (
          {
            position: i + 1,
            team: team.name,
            score: team.score,
            shipsKilled,
            bulletsFired: team.bulletsFired
          }
        )
      })

      res.send(renderStanding(standing))
    }
  })
})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(port, () => console.log("Listening on port", port))