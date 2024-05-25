const express = require('express')
const path = require('path')
const app = express()

// Serve static content
app.use('/images', express.static(path.join(__dirname, '../images')));

app.get('/home', function (req, res) {
    res.sendFile(path.join(__dirname, '../client/pages/home/home.html'));
})

app.listen(666)
console.log("Server now listening on http://localhost:666/home")