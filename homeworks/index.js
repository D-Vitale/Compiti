"use strict"

const handlebars = require("express-handlebars")
const express = require("express")
const app = new express()

const port = 8000

app.set("view engine", "hbs")

app.engine("hbs", handlebars({
  layoutsDir : __dirname + "/views/layouts",
  extname : "hbs",
  defaultLayout : "index",
  partialsDir : __dirname + "/views/partials"
}))

app.use(express.static("public"))

app.get("/", (req, res) =>  {
  const query = req.query
  const name = query.name
  const age = query.age
  const school = query.school
  res.render("main", { name, age, school, homepath : true })
})

app.get("/os", ({headers}, res) => {
  // regex per trovare la stringa tra parentesi 
  const regExp = /\(([^)]+)\)/
  // restituisce un array con la stringa tra (), la stringa senza (), l'index, la stringa totale
  const matches = regExp.exec(headers["user-agent"])
  const os = matches[1].split(";")
  res.render("main", { os, ospath : true })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
