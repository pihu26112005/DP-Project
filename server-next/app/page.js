"use client";

import React, { useState } from "react";

const HomePage = () => {
  const [uniqueId, setUniqueId] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [dataResult, setDataResult] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dataError, setDataError] = useState(null);

  // Fetch result from /api/result
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

  // Send data to /api/data
  const sendData = async () => {
    try {
      setDataError(null);
      setDataResult(null);

      if (!uniqueId || !dataInput) {
        setDataError("Please enter both unique ID and data.");
        return;
      }

      const parsedData = JSON.parse(dataInput); // Parse dataInput string to JSON

      const response = await fetch(`/api/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uniqueId,
          data: parsedData,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setDataError(error || "An error occurred.");
        return;
      }

      const data = await response.json();
      setDataResult(data);
    } catch (err) {
      setDataError("Failed to send data. Please ensure it's in JSON format.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Home Page</h1>

      {/* Fetch Result Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Fetch Result (GET /api/result)</h2>
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

      {/* Send Data Section */}
      <div>
        <h2>Send Data (POST /api/data)</h2>
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
        <textarea
          placeholder='Enter data (e.g., {"a":1, "b":2})'
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            height: "100px",
            marginRight: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={sendData}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Send Data
        </button>

        {dataError && (
          <div style={{ color: "red", marginTop: "10px" }}>
            <strong>Error:</strong> {dataError}
          </div>
        )}

        {dataResult && (
          <div style={{ marginTop: "20px" }}>
            <h3>Data Response:</h3>
            <pre
              style={{
                backgroundColor: "#f4f4f4",
                padding: "10px",
                borderRadius: "5px",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(dataResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
