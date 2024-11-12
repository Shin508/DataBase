require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const DiscordStrategy = require('passport-discord').Strategy;

const app = express();

// Configurazione della sessione
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false
}));

// Inizializza Passport per la gestione dell'autenticazione
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Configura la strategia di Discord
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ['identify', 'guilds', 'guilds.members.read']
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile));
}));

// Rotta di autenticazione con Discord
app.get('/auth/discord', passport.authenticate('discord'));

// Callback dopo l'autenticazione
app.get('/auth/redirect', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/check-role');
});

// Rotta per verificare il ruolo dell'utente
app.get('/check-role', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');

  const userGuilds = req.user.guilds;
  const targetGuildID = process.env.GUILD_ID;
  const requiredRoleID = process.env.ROLE_ID;

  // Trova il server di destinazione e verifica se l'utente ha il ruolo richiesto
  const guild = userGuilds.find(g => g.id === targetGuildID);
  if (guild && guild.roles.includes(requiredRoleID)) {
    res.send("Accesso al database concesso.");
  } else {
    res.send("Accesso negato. Ruolo mancante.");
  }
});

// Rotta per il logout
app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

app.listen(3000, () => console.log('Server avviato su https://shin508.github.io/DataBase/'));
