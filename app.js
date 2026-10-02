const CLIENT_ID = "6574f3a475c2434b912779d5d0425890";

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

let accessToken = null;
let spotifyPlayer = null;
let spotifyDeviceId = null;
let cards = [];

// ========================================
// HTML
// ========================================

const loginButton =
document.getElementById("loginButton");

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
result += characters.charAt(
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
await crypto.subtle.digest(
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
// CHARGER LES CARTES
// ========================================

async function loadCards() {

try {

```
const response =
  await fetch("cards.json");

if (!response.ok) {

  throw new Error(
    "Impossible de charger cards.json"
  );

}

cards =
  await response.json();

console.log(
  "Cartes chargées:",
  cards
);
```

} catch (error) {

```
console.error(
  "Erreur cards.json:",
  error
);

statusText.textContent =
  "Erreur : impossible de charger les cartes.";
```

}
}

// ========================================
// CONNEXION SPOTIFY
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
// CALLBACK SPOTIFY
// ========================================

async function handleCallback() {

const params =
new URLSearchParams(
window.location.search
);

const code =
params.get("code");

const state =
params.get("state");

const error =
params.get("error");

if (error) {

```
console.error(
  "Erreur Spotify:",
  error
);

statusText.textContent =
  "Connexion Spotify annulée.";

return;
```

}

if (!code) {

```
return;
```

}

const savedState =
localStorage.getItem(
"spotify_state"
);

if (
!state ||
state !== savedState
) {

```
alert(
  "Erreur de sécurité Spotify."
);

return;
```

}

const codeVerifier =
localStorage.getItem(
"spotify_code_verifier"
);

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

      method:
        "POST",

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


if (!response.ok) {

  console.error(data);

  alert(
    "Spotify n'a pas accepté la connexion."
  );

  return;

}


accessToken =
  data.access_token;


localStorage.setItem(
  "spotify_access_token",
  accessToken
);


if (data.refresh_token) {

  localStorage.setItem(
    "spotify_refresh_token",
    data.refresh_token
  );

}


localStorage.removeItem(
  "spotify_code_verifier"
);

localStorage.removeItem(
  "spotify_state"
);


// Enlève ?code=... de l'adresse

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

statusText.textContent =
  "Erreur de connexion Spotify.";
```

}
}

// ========================================
// DÉMARRER L'APPLICATION
// ========================================

function startApplication() {

if (!accessToken) {

```
accessToken =
  localStorage.getItem(
    "spotify_access_token"
  );
```

}

loginButton.classList.add(
"hidden"
);

app.classList.remove(
"hidden"
);

statusText.textContent =
"Connexion au lecteur Spotify...";

initializeSpotifyPlayer();
}

// ========================================
// INITIALISER SPOTIFY PLAYER
// ========================================

function initializeSpotifyPlayer() {

if (!accessToken) {

```
console.error(
  "Pas de token Spotify."
);

return;
```

}

if (
typeof Spotify ===
"undefined"
) {

```
console.log(
  "Spotify SDK n'est pas encore chargé."
);

return;
```

}

if (spotifyPlayer) {

```
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

// ------------------------------------
// PLAYER PRÊT
// ------------------------------------

spotifyPlayer.addListener(
"ready",
({ device_id }) => {

```
  console.log(
    "NoelHits Spotify Device:",
    device_id
  );


  spotifyDeviceId =
    device_id;


  statusText.textContent =
    "Spotify est prêt 🎵";


  statusDot.style.color =
    "#1db954";


  // Vérifie immédiatement
  // s'il y a une carte dans l'URL

  checkCardFromURL();

}
```

);

// ------------------------------------
// PLAYER HORS LIGNE
// ------------------------------------

spotifyPlayer.addListener(
"not_ready",
({ device_id }) => {

```
  console.log(
    "Device hors ligne:",
    device_id
  );


  statusText.textContent =
    "Le lecteur Spotify est hors ligne.";

}
```

);

// ------------------------------------
// ERREURS
// ------------------------------------

spotifyPlayer.addListener(
"initialization_error",
({ message }) => {

```
  console.error(
    "Initialization error:",
    message
  );

  statusText.textContent =
    "Erreur du lecteur Spotify.";

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
    "Spotify Premium est requis.";

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
    "Erreur pendant la lecture.";

}
```

);

// ------------------------------------
// CHANGEMENT DE CHANSON
// ------------------------------------

spotifyPlayer.addListener(
"player_state_changed",
state => {

```
  if (!state) {

    return;

  }


  const track =
    state.track_window
      ?.current_track;


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

// ------------------------------------
// CONNECTER
// ------------------------------------

spotifyPlayer
.connect()
.then(success => {

```
  console.log(
    "Spotify player connecté:",
    success
  );

});
```

}

// ========================================
// JOUER UNE CARTE
// ========================================

async function playCard(cardNumber) {

cardNumber =
Number(cardNumber);

if (!cardNumber) {

```
alert(
  "Numéro de carte invalide."
);

return;
```

}

// Vérifier que le lecteur existe

if (!spotifyDeviceId) {

```
alert(
  "Le lecteur Spotify n'est pas encore prêt."
);

return;
```

}

// Chercher la carte

const card =
cards.find(
item =>
Number(item.id) ===
cardNumber
);

if (!card) {

```
alert(
  `Carte ${cardNumber} introuvable.`
);

return;
```

}

// ------------------------------------
// IMPORTANT
//
// Chaque carte doit avoir :
//
// spotifyId:
// "XXXXXXXXXXXX"
// ------------------------------------

if (!card.spotifyId) {

```
alert(
  `La carte ${cardNumber} n'a pas encore de Spotify ID.`
);

console.error(
  "Carte sans spotifyId:",
  card
);

return;
```

}

const spotifyURI =
`spotify:track:${card.spotifyId}`;

console.log(
"Lecture:",
spotifyURI
);

statusText.textContent =
`Carte ${cardNumber} 🎵`;

songTitle.textContent =
"Chargement...";

artistName.textContent =
"Spotify";

try {

```
const response =
  await fetch(
    "https://api.spotify.com/v1/me/player/play" +
    `?device_id=${encodeURIComponent(
      spotifyDeviceId
    )}`,
    {

      method:
        "PUT",

      headers: {

        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json"

      },

      body:
        JSON.stringify({

          uris:
            [spotifyURI],

          position_ms:
            0

        })

    }
  );


if (!response.ok) {

  const errorText =
    await response.text();

  console.error(
    "Spotify playback error:",
    errorText
  );


  statusText.textContent =
    "Spotify n'a pas pu lancer la chanson.";


  return;

}


console.log(
  "🎵 Chanson lancée!"
);


statusText.textContent =
  `🎵 Carte ${cardNumber} — lecture en cours`;
```

} catch (error) {

```
console.error(error);

statusText.textContent =
  "Erreur de communication avec Spotify.";
```

}
}

// ========================================
// LIRE ?card=1 DANS L'URL
// ========================================

function checkCardFromURL() {

const params =
new URLSearchParams(
window.location.search
);

const cardNumber =
params.get("card");

if (!cardNumber) {

```
return;
```

}

console.log(
"Carte trouvée dans URL:",
cardNumber
);

playCard(cardNumber);

}

// ========================================
// BOUTON PLAY / PAUSE
// ========================================

if (playButton) {

playButton.addEventListener(
"click",
async () => {

```
  if (!spotifyPlayer) {

    alert(
      "Le lecteur Spotify n'est pas prêt."
    );

    return;

  }


  await spotifyPlayer.togglePlay();

}
```

);

}

// ========================================
// TEST MANUEL
// ========================================

if (testButton) {

testButton.addEventListener(
"click",
() => {

```
  const cardNumber =
    prompt(
      "Quel numéro de carte veux-tu jouer ?"
    );


  if (
    cardNumber !== null &&
    cardNumber.trim() !== ""
  ) {

    playCard(
      cardNumber.trim()
    );

  }

}
```

);

}

// ========================================
// SPOTIFY SDK
// ========================================

window.onSpotifyWebPlaybackSDKReady =
() => {

```
console.log(
  "Spotify Web Playback SDK chargé."
);


const savedToken =
  localStorage.getItem(
    "spotify_access_token"
  );


if (savedToken) {

  accessToken =
    savedToken;


  startApplication();

}
```

};

// ========================================
// INITIALISATION
// ========================================

(async function init() {

await loadCards();

await handleCallback();

const savedToken =
localStorage.getItem(
"spotify_access_token"
);

if (
savedToken &&
!window.location.search.includes(
"code="
)
) {

```
accessToken =
  savedToken;


// Le SDK appellera normalement
// onSpotifyWebPlaybackSDKReady.

if (
  typeof Spotify !==
  "undefined"
) {

  startApplication();

}
```

}

})();
