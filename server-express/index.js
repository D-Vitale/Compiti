"use strict"
const express = require("express")
const fs = require("fs")
const myFunction = require("./script.js")

const port = 8080

const app = new express()

app.use(express.static(__dirname + "/public"))

app.get("/", (req, res) => {
  const html = fs.readFileSync("./index.html", "utf-8")
  res.send(html)
})

app.get("/doc", (req, res) => {
  const html = fs.readFileSync("./doc.html", "utf-8")
  const name = req.query.name
  const surname = req.query.surname
  const age = req.query.age
  res.send(myFunction({ name, surname, age }, html))
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})