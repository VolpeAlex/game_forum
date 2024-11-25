const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { checkSession,checkAdmin } = require('./checkLogin');
// Connessione al database
mongoose.connect('mongodb://localhost:27017/game_forum')
// Modello User
const User = mongoose.model('User', {
    username: String,
    password: String
});
const Lobby = mongoose.model('Lobby', {
    game: String,
    link: String,
    max_size: Number,
    leader: String,
    message: String,
    date: String
});
const Game = mongoose.model('Game', {
    name: String
});

// Funzione per hash delle password
function hashPassword(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}
function formatDate(date) {
    const isoString = new Date(date).toISOString(); // Ottieni l'ISO stringa
    const [fullDate, fullTime] = isoString.split('T'); // Divide data e ora
    const time = fullTime.split(':'); // Dividi ore, minuti e secondi
    return `${fullDate} ${time[0]}:${time[1]}`; // Ritorna 'YYYY-MM-DD HH:MM'
}
// Rotta per il rendering della pagina di login
router.get('/', (req, res) => {
    console.log()
    res.render('login', { title: 'Login', message: 'Login' });
});
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Cerca l'utente nel database
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.render('login', { title: 'Error', message: 'Login',error_username:"Utente non trovato" });
        }
        // Verifica della password
        const hashedPassword = hashPassword(password);
        if (hashedPassword !== user.password) {
            return res.render('login', { title: 'Error', message: 'Login',error_password:"Password sbagliata" });
        }
        req.session.username = username;
        // Login riuscito
        if (username === "admin") {
            res.redirect("/admin")
        } else {
            res.redirect("/home")
        }

    } catch (error) {
        console.error('Errore durante il login:', error);
        res.status(500).send('Errore interno del server.');
    }
});
router.get('/home', [checkSession], async (req, res) => {
    const selectedGame = req.query.game || 'all'; // Imposta "all" come valore predefinito
    let Lobbies;

    if (selectedGame !== 'all') {
        // Filtra le lobby per il gioco selezionato
        Lobbies = await Lobby.find({ game: selectedGame });
    } else {
        // Mostra tutte le lobby
        Lobbies = await listaLobby();
    }

    const Games = await listaGames(); // Per generare il dropdown
    res.render('home', { 
        title: "home", 
        username: req.session.username, 
        lobbyArray: Lobbies, 
        gamesArray: Games,
        selectedGame: selectedGame // Passa il gioco selezionato
    });
});


router.get('/add',[checkSession], async (req, res) => {
    let Games = await listaGames();
    res.render('add-lobby', { title: 'Aggiungi una lobby', allGames: Games });
});
// Rotta per il rendering della pagina di registrazione
router.post('/add',[checkSession], async (req, res) => {
    let Games = await listaGames();
    var now= formatDate(Date.now())
    console.log(now)
    const { game, link, max_size, message } = req.body;
    try {
        // Cerca l'utente nel database
        const lobby = await Lobby.findOne({ link: link });
        if (lobby) {
            return res.render('add-lobby', { title: 'Errore durante creazione', error_link: 'Link già usato', allGames: Games });
        }else if(max_size<2){
            return res.render('add-lobby', { title: 'Errore durante creazione', error_max_size: 'Minimo 2', allGames: Games });
        }else {
            const newLobby = new Lobby(
                {
                    game: game,
                    link: link,
                    max_size: max_size,
                    leader: req.session.username,
                    message: message,
                    date: now
                }
            )
            newLobby.save()
            res.redirect('home')
        }

    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        res.status(500).dsend('Errore interno del server.');
    } 
});
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            fgdfg
            return res.redirect('/home');
        }
        res.redirect('/');
    });
    module.exports = logout;
    res.render('login', { title: 'Login', message: 'Login' });
});
router.get('/admin',[checkSession],[checkAdmin], async (req, res) => {
    let AllUsers = listaUtenti(); // Definizione globale
    res.render('users', { title: 'Login Result', usersArray: AllUsers });
});

router.get('/sign-up', (req, res) => {
    res.render('sign-up', { title: 'sign-up', message: 'sign-up' });
});
// Rotta per il rendering della pagina di registrazione
router.post('/sign-up', async (req, res) => {
    const { username, password,conf_password } = req.body;
    try {
        // Cerca l'utente nel database
        const user = await User.findOne({ username: username });
        if (user) {
            return res.render('sign-up', { title: 'Error', message: 'sign-up',error_username:"Questo username esiste già" });
        } else {
            if(password!==conf_password){
                return res.render('sign-up', { title: 'Error', message: 'sign-up',error_password:"Le password non combaciano" });
            }
            const newUser = new User(
                {
                    username: username,
                    password: hashPassword(password)
                }
            )
            newUser.save()
        }

        res.render('login', { title: 'Login', message: 'Registrazione eseguita con successo! ora puoi effettuare il login' });
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        res.status(500).send('Errore interno del server.');
    }
});
router.post('/delete-lobby/:id', [checkSession], async (req, res) => {
    const lobbyId = req.params.id;
    const username = req.session.username;

    try {
        // Trova la lobby per verificare il leader
        const lobby = await Lobby.findById(lobbyId);

        if (!lobby) {
            return res.status(404).send("Lobby non trovata.");
        }

        if (lobby.leader !== username) {
            return res.status(403).send("Non sei autorizzato a eliminare questa lobby.");
        }

        // Elimina la lobby
        await Lobby.findByIdAndDelete(lobbyId);
        res.redirect('/home'); // Ricarica la pagina dopo la cancellazione
    } catch (error) {
        console.error("Errore durante l'eliminazione della lobby:", error);
        res.status(500).send("Errore interno del server.");
    }
});

async function listaUtenti() {
    try {
        const users = await User.find(); // Recupera tutti gli utenti dal database
        return users; // Restituisce l'elenco degli utenti
    } catch (error) {
        console.error('Errore durante il recupero degli utenti:', error);
        return [];
    }
}
async function listaLobby() {
    try {
        const lobbies = await Lobby.find();
        return lobbies;
    } catch (error) {
        console.error('Errore durante il recupero delle lobby:', error);
        return [];
    }
}
async function listaGames() {
    try {
        const games = await Game.find(); // Recupera tutti gli utenti dal database
        return games; // Restituisce l'elenco degli utenti
    } catch (error) {
        console.error('Errore durante il recupero dei game:', error);
        return [];
    }
}

  
//admin.save()
module.exports = router;
