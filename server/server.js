const express = require('express')
const path = require('path')
const app = express()

// Serve static content in directory 'home'
app.use(express.static(path.join(__dirname, 'pages/home')));

app.get('/home', function (req, res) {
    res.send('Hello World')
})

app.listen(666)
console.log("Server now listening on http://localhost:666/home")