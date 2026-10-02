const CLIENT_ID = "6574f3a475c2434b912779d5d0425890";

const REDIRECT_URI =
  "https://sahranoufel2000-lab.github.io/NoelHits/";

const SCOPES =
  "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state";


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


async function generateCodeChallenge(verifier) {

  const data =
    new TextEncoder().encode(verifier);

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
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


async function loginSpotify() {

  console.log("🟢 BOUTON SPOTIFY CLIQUÉ");

  const verifier =
    generateRandomString(128);

  localStorage.setItem(
    "spotify_code_verifier",
    verifier
  );

  const challenge =
    await generateCodeChallenge(verifier);

  const url =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge
    });

  console.log("🔵 REDIRECTION SPOTIFY");

  window.location.href = url;
}


document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log("🟣 APP.JS EST BIEN CHARGÉ");

    const button =
      document.getElementById("loginButton");

    console.log(
      "Bouton trouvé :",
      button
    );

    if (!button) {

      console.error(
        "🔴 ERREUR : loginButton introuvable"
      );

      return;
    }

    button.addEventListener(
      "click",
      loginSpotify
    );

    console.log(
      "🟢 BOUTON CONNECTÉ"
    );
  }
);
