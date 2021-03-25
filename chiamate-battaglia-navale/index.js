const express = require("express")
const app = new express()
const fetch = require("node-fetch")

const port = 8000

const team = "username"
const password = "password"

const login = () => {
  fetch("http://localhost:8080/login", {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({ team, password })
  })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err))
}

const hit = async(cell = null) => {
  const { gameStatus, completeField, field } = await getField()

  if (!gameStatus) {
    return { msg: "Tutte le caselle sono state colpite" }
  }

  if (!cell) {
    cell = getCasualCell(field, completeField)
  }

  const reqParams = {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      team, password,
      x: cell.x,
      y: cell.y
    })
  }

  try {
    const res = await fetch("http://localhost:8080/fire", reqParams)
    const data = await res.json()
    console.log(data)
    setTimeout(hit, 1001)
  } catch (err) {
    console.error(err)
  }
}

const getCasualCell = (field, completeField) => {
  let cellShip = completeField.map(row => row.filter(e => e.ship)).filter(e => e.length > 0).flat()
  cellShip = cellShip.filter(cell => cell.ship.alive)
  let cell
  cellShip.forEach(e => {
    if (e) {
      const upCondition = e.y > 0 && !completeField[e.y - 1][e.x].hit
      const bottomCondition = e.y < completeField.length - 1 && !completeField[e.y + 1][e.x].hit
      const leftCondition = e.x > 0 && !completeField[e.y][e.x - 1].hit
      const rigthCondition = e.x < completeField[e.y].length - 1 && !completeField[e.y][e.x + 1].hit

      let count = 0
      while (true) {
        const directionList = ["up", "down", "left", "rigth"]
        const direction = directionList[Math.floor(Math.random() * directionList.length)]

        if (upCondition && direction === "up") {
          cell = completeField[e.y - 1][e.x]
          break
        } else if (bottomCondition && direction === "down") {
          cell = completeField[e.y + 1][e.x]
          break
        } else if (leftCondition && direction === "left") {
          cell = completeField[e.y][e.x - 1]
          break
        } else if (rigthCondition && direction === "rigth") {
          cell = completeField[e.y][e.x + 1]
          break
        } else if (count > 20) {
          break
        }
        count ++
      }
      return cell
    }
  })
  if (!cell) {
    const yrandom = Math.floor(Math.random() * field.length)
    const xrandom = Math.floor(Math.random() * field[yrandom].length)
    cell = field[yrandom][xrandom]
    return cell
  }
  return cell
}

const getField = async() => {
  let completeField

  try {
    let res = await fetch("http://localhost:8080/?format=json")
    res = await res.json()
    completeField = res.visibleField
  } catch (err) {
    console.error(err)
  }

  const tempField = completeField.map(row => row.filter(cell => !cell.hit))
  const field = tempField.filter(row => row.length > 0)
  const gameStatus = !tempField.every(row => row.every(cell => !cell))

  if (gameStatus) {
    return { gameStatus, completeField, field }
  } else {
    return { gameStatus }
  }
}

login()
hit()

app.get("/score", (req, res) => {
  fetch("http://localhost:8080/score", {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({ team, password })
  })
    .then(json => json.json())
    .then(data => res.json({ data }))
})

app.listen(port, () => console.log("Listening on port", port))
