const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const session = require('express-session');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Configura la sessione
app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: true
}));

// Configura passport
app.use(passport.initialize());
app.use(passport.session());

// Configura la strategia Discord
passport.use(new DiscordStrategy({
  clientID: '1305836982122975232',  // Sostituisci con il tuo Client ID
  clientSecret: '90fo0GOq-LswhgY0qmdSOmZX2h_LVLZ8',  // Sostituisci con il tuo Client Secret
  callbackURL: 'http://localhost:3000/auth/discord/callback',  // L'URL di callback
  scope: ['identify', 'guilds']  // Permessi che vuoi ottenere, ad esempio identificazione e accesso ai server
}, (accessToken, refreshToken, profile, done) => {
  // Questo callback verrà chiamato dopo che l'utente ha autenticato con Discord
  return done(null, profile);
}));

// Serializzazione dell'utente
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserializzazione dell'utente
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Rotta di login con Discord
app.get('/auth/discord',
  passport.authenticate('discord', { scope: ['identify', 'guilds'] }));

// Rotta di callback dopo l'autenticazione con Discord
app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    // Autenticazione riuscita, reindirizza l'utente al dashboard
    res.redirect('/dashboard');
  });

// Rotta di dashboard protetta
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.send(`Benvenuto, ${req.user.username}!`);
});

// Rotta di logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    res.redirect('/');
  });
});

// Rotta di home (pagina principale)
app.get('/', (req, res) => {
  res.send('<a href="/auth/discord">Login con Discord</a>');
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
