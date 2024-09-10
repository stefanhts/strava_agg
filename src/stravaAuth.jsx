import React, { useState, useEffect } from "react";
import axios from "axios";
const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

const getRedirectUri = () => {
  let uri;
  if (import.meta.env.VITE_APP_URL) {
    uri = import.meta.env.VITE_APP_URL;
    console.log("Using VITE_APP_URL:", uri);
  } else {
    uri = window.location.origin;
    console.log("VITE_APP_URL not found, using window.location.origin:", uri);
  }

  // Ensure the URI has a protocol
  if (!uri.startsWith("http://") && !uri.startsWith("https://")) {
    uri = `https://${uri}`;
  }

  // Remove any trailing slash
  uri = uri.replace(/\/$/, "");

  console.log("Final Redirect URI:", uri);
  return uri;
};

const StravaAuth = ({ clientId, onTokenReceived }) => {
  const [authorizationCode, setAuthorizationCode] = useState(null);

  useEffect(() => {
    if (import.meta.env.VITE_DEBUG === "true") {
      console.log("Debug Information:");
      console.log("VITE_APP_URL:", import.meta.env.VITE_APP_URL);
      console.log(
        "VITE_STRAVA_CLIENT_ID:",
        import.meta.env.VITE_STRAVA_CLIENT_ID,
      );
      console.log("window.location.origin:", window.location.origin);
      console.log("window.location.href:", window.location.href);
    }
  }, []);

  useEffect(() => {
    // Check if there's an authorization code in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setAuthorizationCode(code);
      exchangeToken(code);
    }
  }, []);

  const initiateAuth = () => {
    const redirectUri = getRedirectUri();
    const scope = "read,activity:read_all";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  };

  const exchangeToken = async (code) => {
    try {
      const response = await axios.post("https://www.strava.com/oauth/token", {
        client_id: clientId,
        client_secret: clientSecret, // Be cautious about exposing this
        code: code,
        grant_type: "authorization_code",
      });

      const { access_token, refresh_token, expires_at } = response.data;

      // Store tokens securely (e.g., in localStorage)
      localStorage.setItem("stravaAccessToken", access_token);
      localStorage.setItem("stravaRefreshToken", refresh_token);
      localStorage.setItem("stravaTokenExpiresAt", expires_at);

      // Notify parent component
      onTokenReceived(access_token);
    } catch (error) {
      console.error("Error exchanging token:", error);
    }
  };

  return (
    <div>
      {!authorizationCode ? (
        <button onClick={initiateAuth}>Connect with Strava</button>
      ) : (
        <p>Authenticating...</p>
      )}
    </div>
  );
};

export default StravaAuth;
