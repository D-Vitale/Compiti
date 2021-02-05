const fetch = require("node-fetch")

module.exports.homePage = (data) => {
  const str = data.reduce((acc, e) => acc + `<h1>${e.id}. ${e.title}</h1><p>${e.body}</p><form method="get" action="/post/${e.id}"><button>Post</button></form>`, "")
  return str
}

module.exports.postPage = async(post) => {
  let str = `<h1>${post.title}</h1><h3>${post.body}</h3><h4>Comments:</h4>`
  await fetch("https://jsonplaceholder.typicode.com/comments")
    .then(response => response.json())
    .then(data => {
      const comments = data.filter(e => e.postId === post.id)
      str = comments.reduce((acc, e) => acc + `<h5>User: ${e.email}</h5><p><strong>${e.name}</strong></p><p>${e.body}</p>`, str)
    })
    .catch(err => console.log(err))
  return str
}