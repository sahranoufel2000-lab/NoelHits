// ========================================
// CONFIGURATION SPOTIFY
// ========================================

const CLIENT_ID = "6574f3a475c2434b912779d5d0425890";

const REDIRECT_URI = "http://127.0.0.1:3000/callback";

// Permissions dont notre application aura besoin
const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state"
].join(" ");


// ========================================
// ÉLÉMENTS HTML
// ========================================

const loginButton = document.getElementById("loginButton");
const app = document.getElementById("app");

const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

const playButton = document.getElementById("playButton");


// ========================================
// PKCE
// ========================================

function generateRandomString(length) {

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {

    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );

  }

  return result;
}


async function generateCodeChallenge(codeVerifier) {

  const data = new TextEncoder().encode(codeVerifier);

  const digest = await window.crypto.subtle.digest(
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


// ========================================
// LOGIN SPOTIFY
// ========================================

async function loginWithSpotify() {

  const codeVerifier = generateRandomString(128);

  localStorage.setItem(
    "spotify_code_verifier",
    codeVerifier
  );

  const codeChallenge =
    await generateCodeChallenge(codeVerifier);


  const params = new URLSearchParams({

    client_id: CLIENT_ID,

    response_type: "code",

    redirect_uri: REDIRECT_URI,

    scope: SCOPES,

    code_challenge_method: "S256",

    code_challenge: codeChallenge

  });


  window.location.href =
    "https://accounts.spotify.com/authorize?" +
    params.toString();

}


// ========================================
// RÉCUPÉRER LE CODE SPOTIFY
// ========================================

async function handleCallback() {

  const urlParams =
    new URLSearchParams(window.location.search);

  const code = urlParams.get("code");

  if (!code) {
    return;
  }


  const codeVerifier =
    localStorage.getItem("spotify_code_verifier");


  if (!codeVerifier) {

    alert(
      "Impossible de retrouver le code PKCE."
    );

    return;
  }


  const body = new URLSearchParams({

    client_id: CLIENT_ID,

    grant_type: "authorization_code",

    code: code,

    redirect_uri: REDIRECT_URI,

    code_verifier: codeVerifier

  });


  try {

    const response = await fetch(
      "https://accounts.spotify.com/api/token",
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body: body

      }
    );


    const data = await response.json();


    if (data.access_token) {

      localStorage.setItem(
        "spotify_access_token",
        data.access_token
      );


      if (data.refresh_token) {

        localStorage.setItem(
          "spotify_refresh_token",
          data.refresh_token
        );

      }


      // Nettoie l'URL
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );


      startApplication();

    } else {

      console.error(data);

      alert(
        "Erreur lors de la connexion à Spotify."
      );

    }

  } catch (error) {

    console.error(error);

    alert(
      "Impossible de contacter Spotify."
    );

  }

}


// ========================================
// DÉMARRER L'APPLICATION
// ========================================

function startApplication() {

  loginButton.classList.add("hidden");

  app.classList.remove("hidden");

  statusText.textContent =
    "Connecté à Spotify 🎵";

  statusDot.style.color =
    "#1db954";

}


// ========================================
// BOUTON LOGIN
// ========================================

loginButton.addEventListener(
  "click",
  loginWithSpotify
);


// ========================================
// BOUTON TEST
// ========================================

document
  .getElementById("testButton")
  .addEventListener("click", () => {

    alert(
      "🎵 Le scan des cartes sera ajouté ici !"
    );

  });


// ========================================
// INITIALISATION
// ========================================

handleCallback();


// Vérifie si on est déjà connecté
const existingToken =
  localStorage.getItem("spotify_access_token");


if (existingToken && !window.location.search) {

  startApplication();

}
