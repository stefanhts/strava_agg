import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StravaAuth from "./stravaAuth";

const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;

const StravaDashboard = () => {
  const [athleteData, setAthleteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("stravaAccessToken"),
  );

  useEffect(() => {
    if (accessToken) {
      fetchAthleteData();
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  const fetchAthleteData = async () => {
    try {
      const response = await axios.get(
        "https://www.strava.com/api/v3/athlete/activities",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            per_page: 200, // Adjust this value based on how many activities you want to fetch
          },
        },
      );

      const processedData = processStravaData(response.data);
      setAthleteData(processedData);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch Strava data");
      setLoading(false);
    }
  };

  const processStravaData = (activities) => {
    const sportSummary = {};

    activities.forEach((activity) => {
      const sport = activity.type;

      if (!sportSummary[sport]) {
        sportSummary[sport] = {
          sport: sport,
          totalDistance: 0,
          totalElevation: 0,
          totalDuration: 0,
          count: 0,
          averageSpeed: 0,
        };
      }

      sportSummary[sport].totalDistance += activity.distance / 1000;
      sportSummary[sport].totalElevation += activity.total_elevation_gain;
      sportSummary[sport].totalDuration += activity.moving_time / 3600;
      sportSummary[sport].count += 1;
      sportSummary[sport].averageSpeed =
        sportSummary[sport].totalDistance / sportSummary[sport].totalDuration;
    });

    return Object.values(sportSummary).map((sport) => ({
      sport: sport.sport,
      totalDistance: Number(sport.totalDistance.toFixed(2)),
      totalElevation: Number(sport.totalElevation.toFixed(2)),
      totalDuration: Number(sport.totalDuration.toFixed(2)),
      count: sport.count,
      averageSpeed: Number(sport.averageSpeed.toFixed(2)),
    }));
  };

  const handleTokenReceived = (token) => {
    setAccessToken(token);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  if (!accessToken) {
    return (
      <StravaAuth clientId={clientId} onTokenReceived={handleTokenReceived} />
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Strava Data Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {athleteData &&
          athleteData.map((sport) => (
            <Card key={sport.sport}>
              <CardHeader>
                <CardTitle>{sport.sport}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Distance: {sport.totalDistance} km</p>
                <p>Total Elevation: {sport.totalElevation} m</p>
                <p>Total Duration: {sport.totalDuration} hours</p>
                <p>Activities: {sport.count}</p>
                <p>Average Speed: {sport.averageSpeed} km/h</p>
              </CardContent>
            </Card>
          ))}
      </div>
      {athleteData && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={athleteData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sport" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="totalDistance"
              fill="#8884d8"
              name="Total Distance (km)"
            />
            <Bar
              yAxisId="right"
              dataKey="totalElevation"
              fill="#82ca9d"
              name="Total Elevation (m)"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StravaDashboard;
