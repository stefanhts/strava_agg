const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StravaAuth from "./StravaAuth";
import "./dashboard.css";

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
            per_page: 200,
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
          activities: [],
        };
      }

      sportSummary[sport].totalDistance += activity.distance / 1000;
      sportSummary[sport].totalElevation += activity.total_elevation_gain;
      sportSummary[sport].totalDuration += activity.moving_time / 3600;
      sportSummary[sport].count += 1;
      sportSummary[sport].activities.push({
        date: new Date(activity.start_date).toLocaleDateString(),
        distance: Number((activity.distance / 1000).toFixed(2)),
        elevation: Number(activity.total_elevation_gain.toFixed(2)),
      });
    });

    return Object.values(sportSummary).map((sport) => ({
      ...sport,
      totalDistance: Number(sport.totalDistance.toFixed(2)),
      totalElevation: Number(sport.totalElevation.toFixed(2)),
      totalDuration: Number(sport.totalDuration.toFixed(2)),
      averageSpeed: Number(
        (sport.totalDistance / sport.totalDuration).toFixed(2),
      ),
      activities: sport.activities.slice(-10).reverse(), // Get last 10 activities and reverse for chronological order
    }));
  };

  const handleTokenReceived = (token) => {
    setAccessToken(token);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error}</div>;

  if (!accessToken) {
    return <StravaAuth onTokenReceived={handleTokenReceived} />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Strava Data Dashboard</h1>
      <div className="dashboard-grid">
        {athleteData && athleteData.length > 0 ? (
          athleteData.map((sport) => (
            <Card key={sport.sport} className="dashboard-card">
              <CardHeader>
                <CardTitle>{sport.sport}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Distance: {sport.totalDistance} km</p>
                <p>Total Elevation: {sport.totalElevation} m</p>
                <p>Total Duration: {sport.totalDuration.toFixed(2)} hours</p>
                <p>Activities: {sport.count}</p>
                <p>Average Speed: {sport.averageSpeed} km/h</p>
                <div className="h-60 mt-4">
                  {sport.activities && sport.activities.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={sport.activities}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={false} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="distance"
                          stroke="#8884d8"
                          name="Distance (km)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="elevation"
                          stroke="#82ca9d"
                          name="Elevation (m)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>No activity data available for this sport.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No athlete data available.</p>
        )}
      </div>
    </div>
  );
};

export default StravaDashboard;
