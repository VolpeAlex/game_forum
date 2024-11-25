const express = require('express');
const session= require("express-session")
const router = require('./router');
const app = express();
app.use(session({
    secret:'EmmaFaul',
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false
    }
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
const port = 3000; // Puoi cambiare la porta se necessario
app.set('view engine', 'pug');
app.set('views', './views'); // Directory per i file Pug
app.use(express.static('./public'))
app.use('/',router)
// Avvia il server
app.listen(port)