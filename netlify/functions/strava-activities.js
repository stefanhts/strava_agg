const axios = require("axios");

let accessToken = null;
let tokenExpirationTime = 0;

async function getAccessToken() {
  if (Date.now() >= tokenExpirationTime) {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
    });

    accessToken = response.data.access_token;
    tokenExpirationTime = Date.now() + response.data.expires_in * 1000;
  }
  return accessToken;
}

exports.handler = async function (event, context) {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 200 },
      },
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Be more specific in production
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error fetching Strava data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch Strava data" }),
    };
  }
};
