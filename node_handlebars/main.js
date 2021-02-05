"use strict"

const express = require("express")
const handlebars = require("express-handlebars")

const app = express()

app.set("view engine", "hbs")

app.engine("hbs", handlebars({
  layoutsDir : __dirname + "/views/layouts",
  extname : "hbs",
  defaultLayout : "index",
  partialsDir : __dirname + "/views/partials"
}))

app.use(express.static("public"))

app.get("/", ({ headers }, res) => {
  res.render("main", { home : true })
  console.log(headers["user-agent"])
})

app.get("/:path", (req, res) => {
  const path = req.params.path
  res.render("main", { [path] : true })
})

app.listen("8080", () => {
  console.log("listening on port 8080")
})