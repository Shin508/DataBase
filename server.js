const express = require('express');
const session = require('express-session');
const passport = require('passport');
const axios = require('axios');
const { OAuth2Strategy } = require('passport-discord');

const app = express();
const PORT = process.env.PORT || 3000;

passport.use(new OAuth2Strategy({
    clientID: '1305836982122975232',
    clientSecret: '8lGRPTNB-vIhrQ8JL1Amb1P6XE6C--vg',
    callbackURL: 'YOUR_DISCORD_CALLBACK_URL',
    scope: ['identify', 'guilds'] // Aggiungi qui altri scope se necessari
}, (accessToken, refreshToken, profile, done) => {
    // Recupera i dati del profilo Discord e aggiungili alla sessione
    profile.accessToken = accessToken;
    return done(null, profile);
}));

// Sessione
app.use(session({
    secret: 'YOUR_SECRET_KEY',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Serializzazione e deserializzazione dell'utente
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Rotta per il login
app.get('/login', (req, res) => {
    res.redirect('/auth/discord');
});

// Rotta per la callback di Discord OAuth2
app.get('/auth/discord',
    passport.authenticate('discord', { scope: ['identify', 'guilds'] }),
    (req, res) => {
        // Successo dell'autenticazione
        res.redirect('/');
    });

// Rotta per gestire il ritorno della callback di Discord
app.get('/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    });

// Funzione per il controllo dei ruoli
function checkRole(role) {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/login'); // Se non autenticato, redirigi al login
        }

        // Controlla i ruoli dell'utente
        const userRoles = req.user.guilds; // Contiene la lista di server/guilds a cui l'utente appartiene

        let hasRole = false;

        // Cicla attraverso i server a cui l'utente è iscritto e controlla se ha il ruolo
        for (const guild of userRoles) {
            if (guild.id === '1061241675424481382') { // Verifica se l'utente è nel server specificato
                // Puoi sostituire con una chiamata API Discord per ottenere i ruoli dell'utente
                axios.get(`https://discord.com/api/v9/guilds/${guild.id}/members/${req.user.id}`, {
                    headers: {
                        'Authorization': `Bot MTMwNTgzNjk4MjEyMjk3NTIzMg.Gtn5YD.lbSWLYsJZTtSvVZuUQOJKk_pGC-15KS2WBhy0Y`
                    }
                }).then(response => {
                    const memberRoles = response.data.roles;
                    if (memberRoles.includes(role)) {
                        hasRole = true;
                    }
                    if (!hasRole) {
                        return res.redirect('/no-permission'); // Se l'utente non ha il ruolo richiesto
                    }
                    next();
                }).catch(err => {
                    console.error(err);
                    return res.redirect('/no-permission');
                });
            }
        }

        if (!hasRole) {
            return res.redirect('/no-permission'); // Se l'utente non ha il ruolo richiesto
        }

        next(); // Se il controllo ruoli passa, continua
    };
}

// Pagina protetta da ruolo
app.get('/protected', checkRole('1305843626613411840'), (req, res) => {
    res.send('Accesso consentito alla pagina protetta!');
});

// Pagina senza permessi
app.get('/no-permission', (req, res) => {
    res.send('Non hai il permesso di accedere a questa pagina.');
});

// Rotta di logout
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Homepage
app.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.send('<a href="/login">Login con Discord</a>');
    }

    res.send(`
        <h1>Ciao, ${req.user.username}</h1>
        <a href="/protected">Vai alla pagina protetta</a>
        <br>
        <a href="/logout">Logout</a>
    `);
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su https://shin508.github.io/DataBase/elements.html:${PORT}`);
});
