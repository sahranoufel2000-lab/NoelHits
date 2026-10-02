# /*

NOELHITS
Spotify + PKCE + Web Playback SDK
=================================

*/

// ========================================
// CONFIGURATION
// ========================================

const CLIENT_ID =
"6574f3a475c2434b912779d5d0425890";

// IMPORTANT:
// Cette adresse doit être EXACTEMENT la même
// que celle configurée dans Spotify Developer.

const REDIRECT_URI =
"https://sahranoufel2000-lab.github.io/NoelHits/";

const SCOPES = [
"streaming",
"user-read-email",
"user-read-private",
"user-read-playback-state",
"user-modify-playback-state"
].join(" ");

// ========================================
// VARIABLES
// ========================================

let spotifyPlayer = null;

let spotifyDeviceId = null;

let accessToken = null;

// ========================================
// ÉLÉMENTS HTML
// ========================================

const loginButton =
document.getElementById("loginButton");

const loginSection =
document.getElementById("loginSection");

const app =
document.getElementById("app");

const statusText =
document.getElementById("statusText");

const statusDot =
document.getElementById("statusDot");

const playButton =
document.getElementById("playButton");

const testButton =
document.getElementById("testButton");

const songTitle =
document.getElementById("songTitle");

const artistName =
document.getElementById("artistName");

// ========================================
// PKCE
// ========================================

function generateRandomString(length) {

const characters =
"ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
"abcdefghijklmnopqrstuvwxyz" +
"0123456789";

let result = "";

for (let i = 0; i < length; i++) {

```
result +=
  characters.charAt(
    Math.floor(
      Math.random() * characters.length
    )
  );
```

}

return result;

}

async function generateCodeChallenge(
codeVerifier
) {

const data =
new TextEncoder().encode(
codeVerifier
);

const digest =
await window.crypto.subtle.digest(
"SHA-256",
data
);

return btoa(
String.fromCharCode(
...new Uint8Array(digest)
)
)
.replace(/+/g, "-")
.replace(///g, "_")
.replace(/=+$/, "");

}

// ========================================
// LOGIN SPOTIFY
// ========================================

async function loginWithSpotify() {

const codeVerifier =
generateRandomString(128);

localStorage.setItem(
"spotify_code_verifier",
codeVerifier
);

const codeChallenge =
await generateCodeChallenge(
codeVerifier
);

const state =
generateRandomString(16);

localStorage.setItem(
"spotify_state",
state
);

const params =
new URLSearchParams({

```
  client_id:
    CLIENT_ID,

  response_type:
    "code",

  redirect_uri:
    REDIRECT_URI,

  scope:
    SCOPES,

  state:
    state,

  code_challenge_method:
    "S256",

  code_challenge:
    codeChallenge

});
```

window.location.href =
"https://accounts.spotify.com/authorize?" +
params.toString();

}

// ========================================
// RÉCUPÉRER LE TOKEN
// ========================================

async function handleCallback() {

const params =
new URLSearchParams(
window.location.search
);

const code =
params.get("code");

const returnedState =
params.get("state");

const error =
params.get("error");

// L'utilisateur a refusé

if (error) {

```
console.error(
  "Spotify authorization error:",
  error
);

statusText.textContent =
  "Connexion Spotify annulée.";

return;
```

}

// Aucun code:
// ce n'est pas un callback

if (!code) {

```
return;
```

}

// Vérification CSRF

const savedState =
localStorage.getItem(
"spotify_state"
);

if (
!returnedState ||
returnedState !== savedState
) {

```
alert(
  "Erreur de sécurité lors de la connexion Spotify."
);

return;
```

}

const codeVerifier =
localStorage.getItem(
"spotify_code_verifier"
);

if (!codeVerifier) {

```
alert(
  "Code PKCE introuvable."
);

return;
```

}

const body =
new URLSearchParams({

```
  client_id:
    CLIENT_ID,

  grant_type:
    "authorization_code",

  code:
    code,

  redirect_uri:
    REDIRECT_URI,

  code_verifier:
    codeVerifier

});
```

try {

```
const response =
  await fetch(
    "https://accounts.spotify.com/api/token",
    {

      method: "POST",

      headers: {

        "Content-Type":
          "application/x-www-form-urlencoded"

      },

      body:
        body

    }
  );


const data =
  await response.json();


console.log(
  "Spotify token response:",
  data
);


if (!response.ok) {

  console.error(data);

  alert(
    "Spotify a refusé la connexion."
  );

  return;

}


accessToken =
  data.access_token;


localStorage.setItem(
  "spotify_access_token",
  accessToken
);


// Spotify fournit normalement
// un refresh token avec PKCE.

if (data.refresh_token) {

  localStorage.setItem(
    "spotify_refresh_token",
    data.refresh_token
  );

}


// Nettoyage

localStorage.removeItem(
  "spotify_code_verifier"
);

localStorage.removeItem(
  "spotify_state"
);


window.history.replaceState(
  {},
  document.title,
  window.location.pathname
);


startApplication();
```

} catch (error) {

```
console.error(error);

alert(
  "Impossible de contacter Spotify."
);
```

}

}

// ========================================
// DÉMARRER L'APPLICATION
// ========================================

function startApplication() {

loginSection.classList.add(
"hidden"
);

app.classList.remove(
"hidden"
);

statusText.textContent =
"Connexion au lecteur Spotify...";

statusDot.style.color =
"#1db954";

initializeSpotifyPlayer();

}

// ========================================
// INITIALISER LE WEB PLAYBACK SDK
// ========================================

function initializeSpotifyPlayer() {

if (!accessToken) {

```
accessToken =
  localStorage.getItem(
    "spotify_access_token"
  );
```

}

if (!accessToken) {

```
console.error(
  "Aucun access token."
);

return;
```

}

// Vérifie que le SDK est chargé

if (
typeof Spotify ===
"undefined"
) {

```
console.log(
  "Spotify SDK pas encore chargé."
);

return;
```

}

spotifyPlayer =
new Spotify.Player({

```
  name:
    "NoelHits 🎄",

  volume:
    0.7,

  getOAuthToken:
    callback => {

      callback(
        accessToken
      );

    }

});
```

// ====================================
// PLAYER PRÊT
// ====================================

spotifyPlayer.addListener(
"ready",
({ device_id }) => {

```
  console.log(
    "Spotify Player prêt:",
    device_id
  );


  spotifyDeviceId =
    device_id;


  statusText.textContent =
    "Spotify est prêt 🎵";


  statusDot.style.color =
    "#1db954";

}
```

);

// ====================================
// PLAYER DÉCONNECTÉ
// ====================================

spotifyPlayer.addListener(
"not_ready",
({ device_id }) => {

```
  console.log(
    "Spotify Player hors ligne:",
    device_id
  );


  statusText.textContent =
    "Lecteur Spotify déconnecté.";

}
```

);

// ====================================
// ERREURS
// ====================================

spotifyPlayer.addListener(
"initialization_error",
({ message }) => {

```
  console.error(
    "Initialization error:",
    message
  );

  statusText.textContent =
    "Erreur d'initialisation Spotify.";

}
```

);

spotifyPlayer.addListener(
"authentication_error",
({ message }) => {

```
  console.error(
    "Authentication error:",
    message
  );

  statusText.textContent =
    "Erreur d'authentification Spotify.";

}
```

);

spotifyPlayer.addListener(
"account_error",
({ message }) => {

```
  console.error(
    "Account error:",
    message
  );

  statusText.textContent =
    "Un compte Spotify Premium est requis.";

}
```

);

spotifyPlayer.addListener(
"playback_error",
({ message }) => {

```
  console.error(
    "Playback error:",
    message
  );

  statusText.textContent =
    "Erreur de lecture Spotify.";

}
```

);

// ====================================
// CHANGEMENT DE CHANSON
// ====================================

spotifyPlayer.addListener(
"player_state_changed",
state => {

```
  if (!state) {

    return;

  }


  const track =
    state.track_window
      .current_track;


  if (!track) {

    return;

  }


  songTitle.textContent =
    track.name;


  artistName.textContent =
    track.artists
      .map(
        artist => artist.name
      )
      .join(", ");

}
```

);

// ====================================
// CONNECTER LE PLAYER
// ====================================

spotifyPlayer.connect();

}

// ========================================
// LECTURE / PAUSE
// ========================================

playButton.addEventListener(
"click",
async () => {

```
if (!spotifyPlayer) {

  alert(
    "Le lecteur Spotify n'est pas encore prêt."
  );

  return;

}


await spotifyPlayer.togglePlay();
```

}
);

// ========================================
// TEST
// ========================================

testButton.addEventListener(
"click",
() => {

```
alert(
  "Le scanner de cartes sera connecté ici 🎴"
);
```

}
);

// ========================================
// SDK SPOTIFY
// ========================================

window.onSpotifyWebPlaybackSDKReady =
() => {

```
console.log(
  "Spotify Web Playback SDK chargé."
);


const existingToken =
  localStorage.getItem(
    "spotify_access_token"
  );


if (
  existingToken &&
  !accessToken
) {

  accessToken =
    existingToken;


  startApplication();

}
```

};

// ========================================
// INITIALISATION
// ========================================

handleCallback();

// Si déjà connecté

const existingToken =
localStorage.getItem(
"spotify_access_token"
);

if (
existingToken &&
!window.location.search
) {

accessToken =
existingToken;

startApplication();

}
