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

const StravaDashboard = () => {
  const [athleteData, setAthleteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAthleteData();
  }, []);

  const fetchAthleteData = async () => {
    try {
      const response = await axios.get("/.netlify/functions/strava-activities");
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
    localStorage.setItem("stravaAccessToken", token);
    setAccessToken(token);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error}</div>;

  if (!accessToken) {
    return (
      <StravaAuth clientId={clientId} onTokenReceived={handleTokenReceived} />
    );
  }

  console.log("Athlete Data:", athleteData); // Debug log

  const containerStyle = {
    width: "100%",
    overflowX: "auto",
    whiteSpace: "nowrap",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  };

  const cardContainerStyle = {
    display: "inline-block",
    width: "320px",
    marginRight: "16px",
    verticalAlign: "top",
    whiteSpace: "normal",
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-6 text-center text-orange-500">
        Strava Data Dashboard
      </h1>
      <div style={containerStyle} className="pb-4">
        {athleteData && athleteData.length > 0 ? (
          athleteData.map((sport) => (
            <div key={sport.sport} style={cardContainerStyle}>
              <Card className="h-full bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gray-700 rounded-t-lg">
                  <CardTitle className="text-2xl font-bold text-orange-400">
                    {sport.sport}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-400">
                        Total Distance:
                      </span>{" "}
                      <span className="text-green-400">
                        {sport.totalDistance} km
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-400">
                        Total Elevation:
                      </span>{" "}
                      <span className="text-blue-400">
                        {sport.totalElevation} m
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-400">
                        Total Duration:
                      </span>{" "}
                      <span className="text-purple-400">
                        {sport.totalDuration.toFixed(2)} hours
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-400">
                        Activities:
                      </span>{" "}
                      <span className="text-yellow-400">{sport.count}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-400">
                        Average Speed:
                      </span>{" "}
                      <span className="text-red-400">
                        {sport.averageSpeed} km/h
                      </span>
                    </p>
                  </div>
                  <div style={{ height: "200px" }}>
                    {sport.activities && sport.activities.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sport.activities}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                          <XAxis dataKey="date" tick={false} stroke="#888" />
                          <YAxis yAxisId="left" stroke="#888" />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#888"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#333",
                              border: "none",
                            }}
                          />
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
                      <p className="text-center text-gray-500 italic">
                        No activity data available for this sport.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic">
            No athlete data available.
          </p>
        )}
      </div>
    </div>
  );
};

export default StravaDashboard;
