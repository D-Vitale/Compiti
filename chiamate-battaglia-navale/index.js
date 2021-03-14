const express = require("express")
const app = new express()
const fetch = require("node-fetch")

const port = 8000

const team = "ciao"
const password = "bolide"

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

const hit = (cell) => {
  fetch("http://localhost:8080/fire", {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      team, password,
      x: cell.x,
      y: cell.y
    })
  })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err))
}

const getField = () => {
  fetch("http://localhost:8080/?format=json")
    .then(res => res.json())
    .then(data => {
      const tempField = data.visibleField.map(row => row.filter(cell => !cell.hit))
      const endGame = !tempField.every(row => row.every(cell => !cell))
      if (endGame) {
        const field = tempField.filter(row => row.length > 0)
        const yrandom = Math.floor(Math.random() * field.length)
        const xrandom = Math.floor(Math.random() * field[yrandom].length)
        const cell = field[yrandom][xrandom]
        hit(cell)
      } else {
        console.log("Tutte le caselle sono state colpite")
      }
    })
    .catch(err => console.error(err))
}

login()
setInterval(getField, 1001)

app.listen(port, () => console.log("Listening on port", port))