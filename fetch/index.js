const express = require("express")
const app = new express()
const fetch = require("node-fetch")
const { homePage, postPage } = require("./utils")

const port = 8080

app.get("/", (req, res) => {
  fetch("https://jsonplaceholder.typicode.com/posts")
    .then(response => response.json())
    .then(data => res.send(homePage(data)))
    .catch(err => console.log(err))
})

app.get("/post/:id", (req, res) => {
  const id = req.params.id
  fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)
    .then(response => response.json())
    .then(async data => {
      try {
        res.send(await postPage(data))
      } catch (err) {
        console.log(err)
      }
    })
    .catch(err => console.log(err))
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})