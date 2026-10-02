const CLIENT_ID = "6574f3a475c2434b912779d5d0425890";
const REDIRECT_URI = "https://sahranoufel2000-lab.github.io/NoelHits/";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state"
].join(" ");

// ===============================
// PKCE
// ===============================

function generateRandomString(length) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let text = "";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(
      Math.floor(Math.random() * possible.length)
    );
  }

  return text;
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return btoa(
    String.fromCharCode(...new Uint8Array(digest))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


// ===============================
// CONNEXION SPOTIFY
// ===============================

async function loginSpotify() {

  console.log("Bouton Spotify cliqué");

  const verifier = generateRandomString(128);

  localStorage.setItem(
    "spotify_code_verifier",
    verifier
  );

  const challenge =
    await generateCodeChallenge(verifier);

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge
    });

  console.log("Redirection vers Spotify...");

  window.location.href = authUrl;
}


// ===============================
// RÉCUPÉRER LE TOKEN
// ===============================

async function getAccessToken() {

  const params =
    new URLSearchParams(window.location.search);

  const code = params.get("code");

  if (!code) {
    return null;
  }

  const verifier =
    localStorage.getItem("spotify_code_verifier");

  if (!verifier) {
    console.error("Code verifier introuvable.");
    return null;
  }

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },

      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier
      })
    }
  );

  const data = await response.json();

  if (data.access_token) {

    localStorage.setItem(
      "spotify_access_token",
      data.access_token
    );

    // Nettoyer l'URL
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    return data.access_token;
  }

  console.error(
    "Erreur Spotify:",
    data
  );

  return null;
}


// ===============================
// VARIABLES
// ===============================

let accessToken = null;
let spotifyPlayer = null;
let spotifyDeviceId = null;


// ===============================
// INITIALISATION
// ===============================

async function initialize() {

  console.log("Application NoelHits démarrée");

  accessToken =
    localStorage.getItem(
      "spotify_access_token"
    );

  const newToken =
    await getAccessToken();

  if (newToken) {
    accessToken = newToken;
  }

  const loginButton =
    document.getElementById("loginButton");

  if (loginButton) {

    loginButton.addEventListener(
      "click",
      loginSpotify
    );

    console.log(
      "Bouton Spotify connecté"
    );
  }

  if (!accessToken) {

    console.log(
      "Pas encore connecté à Spotify"
    );

    return;
  }

  startSpotifyPlayer();
}


// ===============================
// SPOTIFY WEB PLAYBACK SDK
// ===============================

function startSpotifyPlayer() {

  console.log(
    "Initialisation du lecteur Spotify..."
  );

  if (
    typeof window.Spotify === "undefined"
  ) {

    console.log(
      "Spotify SDK pas encore chargé."
    );

    return;
  }

  spotifyPlayer =
    new Spotify.Player({

      name: "NoelHits",

      getOAuthToken: callback => {
        callback(accessToken);
      },

      volume: 0.8
    });


  spotifyPlayer.addListener(
    "ready",
    ({ device_id }) => {

      console.log(
        "Spotify prêt. Device:",
        device_id
      );

      spotifyDeviceId =
        device_id;

      const statusText =
        document.getElementById(
          "statusText"
        );

      if (statusText) {
        statusText.textContent =
          "Spotify est prêt 🎵";
      }

      const statusDot =
        document.getElementById(
          "statusDot"
        );

      if (statusDot) {
        statusDot.classList.add(
          "connected"
        );
      }

      checkCardFromURL();
    }
  );


  spotifyPlayer.addListener(
    "not_ready",
    ({ device_id }) => {

      console.log(
        "Spotify non disponible:",
        device_id
      );
    }
  );


  spotifyPlayer.addListener(
    "initialization_error",
    ({ message }) => {

      console.error(
        "Erreur initialisation:",
        message
      );
    }
  );


  spotifyPlayer.addListener(
    "authentication_error",
    ({ message }) => {

      console.error(
        "Erreur authentification:",
        message
      );
    }
  );


  spotifyPlayer.addListener(
    "account_error",
    ({ message }) => {

      console.error(
        "Erreur compte Spotify:",
        message
      );
    }
  );


  spotifyPlayer.addListener(
    "playback_error",
    ({ message }) => {

      console.error(
        "Erreur lecture:",
        message
      );
    }
  );


  spotifyPlayer.connect();
}


// ===============================
// LANCER UNE CARTE
// ===============================

async function playCard(cardNumber) {

  if (!spotifyDeviceId) {

    console.error(
      "Lecteur Spotify pas prêt."
    );

    return;
  }

  const response =
    await fetch("cards.json");

  const cards =
    await response.json();

  const card =
    cards.find(
      c => Number(c.id) === Number(cardNumber)
    );

  if (!card) {

    console.error(
      "Carte introuvable:",
      cardNumber
    );

    return;
  }

  const spotifyURI =
    `spotify:track:${card.spotifyId}`;

  console.log(
    "Lecture:",
    spotifyURI
  );


  // Transférer la lecture vers NoelHits
  await fetch(
    "https://api.spotify.com/v1/me/player",
    {
      method: "PUT",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        device_ids: [
          spotifyDeviceId
        ],

        play: false
      })
    }
  );


  // Jouer la chanson
  const playResponse =
    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          uris: [spotifyURI],
          position_ms: 0
        })
      }
    );


  if (!playResponse.ok) {

    const error =
      await playResponse.text();

    console.error(
      "Erreur Spotify:",
      error
    );

    return;
  }

  console.log(
    "🎵 Chanson lancée!"
  );
}


// ===============================
// CARTE DANS L'URL
// ===============================

function checkCardFromURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const card =
    params.get("card");

  if (card) {

    console.log(
      "Carte détectée:",
      card
    );

    playCard(card);
  }
}


// ===============================
// BOUTON DE TEST
// ===============================

const testButton =
  document.getElementById(
    "testButton"
  );

if (testButton) {

  testButton.addEventListener(
    "click",
    () => {

      const number =
        prompt(
          "Numéro de carte:"
        );

      if (number) {
        playCard(number);
      }
    }
  );
}


// ===============================
// DÉMARRAGE
// ===============================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();
}
