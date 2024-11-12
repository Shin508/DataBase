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
  scope: ['identify', 'guilds', 'guilds.members.read']  // Aggiungi permesso per leggere i membri
}, (accessToken, refreshToken, profile, done) => {
  // Questo callback verrà chiamato dopo che l'utente ha autenticato con Discord
  // Salva l'accessToken, che userai per fare richieste API a Discord
  profile.accessToken = accessToken;
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
  passport.authenticate('discord', { scope: ['identify', 'guilds', 'guilds.members.read'] }));

// Rotta di callback dopo l'autenticazione con Discord
app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  async (req, res) => {
    // Una volta che l'utente è autenticato, ottieni i suoi ruoli
    const userId = req.user.id;
    const accessToken = req.user.accessToken;

    // Ottieni i server (guilds) dell'utente
    try {
      const guilds = req.user.guilds; // Questo ti dà i server a cui appartiene l'utente
      
      // Esegui una richiesta API per ottenere i membri di ciascun server e i loro ruoli
      for (const guild of guilds) {
        const guildId = guild.id;
        const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        // Ottenere i ruoli dell'utente nel server
        const roles = response.data.roles;  // Questo ti dà l'array dei ruoli

        // Ora puoi fare quello che vuoi con i ruoli
        console.log(`Ruoli dell'utente nel server ${guild.name}: ${roles.join(', ')}`);

        // Aggiungi la logica per controllare se l'utente ha il ruolo giusto
        if (roles.includes('1305843626613411840')) {
          console.log('L\'utente ha il ruolo richiesto!');
          // Permetti l'accesso o fai qualcosa
        } else {
          console.log('L\'utente non ha il ruolo richiesto');
          // Negare l'accesso o fare qualcos'altro
        }
      }
    } catch (error) {
      console.error('Errore nel recuperare i ruoli:', error);
    }

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
