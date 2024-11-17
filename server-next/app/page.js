"use client";

import React, { useState } from "react";

const HomePage = () => {
  const [uniqueId, setUniqueId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchResult = async () => {
    try {
      setError(null);
      setResult(null);

      if (!uniqueId) {
        setError("Please enter a unique ID.");
        return;
      }

      const response = await fetch(`/api/result?uniqueId=${uniqueId}`, {
        method: "GET",
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError(error || "An error occurred.");
        return;
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to fetch the result. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Home Page</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter unique ID"
          value={uniqueId}
          onChange={(e) => setUniqueId(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            marginRight: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={fetchResult}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Fetch Result
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result:</h3>
          <pre
            style={{
              backgroundColor: "#f4f4f4",
              padding: "10px",
              borderRadius: "5px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default HomePage;
