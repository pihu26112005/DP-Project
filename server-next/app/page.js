"use client";
import React, { useState, useEffect } from 'react';
import { Client, Account, Storage, ID } from 'appwrite';
import { useDropzone } from 'react-dropzone';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('671f94c1001f0c9a88a1');

const account = new Account(client);
const storage = new Storage(client);

const CreateResultUI = () => {
  const [files, setFiles] = useState([]);
  const [minErrorFile, setMinErrorFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [uploadFileData, setUploadFileData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchAllFiles = async () => {
    try {
      const response = await storage.listFiles('671fa00f0021cb655fbd');
      const files = response.files;

      const fileDataPromises = files.map(async (file) => {
        const fileUrl = await storage.getFileView('671fa00f0021cb655fbd', file.$id);
        const fileResponse = await fetch(fileUrl);
        if (fileResponse.ok) {
          const fileContent = await fileResponse.text();

          const lines = fileContent.split('\n').filter(line => line.trim() !== '');
          const frequencies = [];
          const values = [];
          lines.forEach(line => {
            const [frequency, value] = line.trim().split(/\s+/);
            frequencies.push(parseFloat(frequency));
            values.push(parseFloat(value));
          });

          return { filename: file.name, frequencies, values };
        } else {
          throw new Error(`Failed to fetch file content for ${file.name}`);
        }
      });

      const allFileData = await Promise.all(fileDataPromises);
      setFileData(allFileData);
    } catch (error) {
      console.error("Error fetching files:", error);
      alert("Failed to fetch files from Appwrite storage");
    }
  };

  useEffect(() => {
    fetchAllFiles();
  }, []);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const fileContent = e.target.result;
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      const frequencies = [];
      const values = [];
      lines.forEach(line => {
        const [frequency, value] = line.trim().split(/\s+/);
        frequencies.push(parseFloat(frequency));
        values.push(parseFloat(value));
      });

      const uploadFileData = { filename: file.name, frequencies, values };
      setUploadFileData(uploadFileData);

      setUploading(true);
      try {
        const uploadResponse = await storage.createFile('671fa00f0021cb655fbd', ID.unique(), file);
        alert("File uploaded and processed successfully.");
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file to Appwrite storage.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const calculateMSE = (values1, values2) => {
    if (values1.length !== values2.length) {
      throw new Error("Arrays must have the same length to calculate MSE.");
    }

    let sum = 0;
    for (let i = 2; i < values1.length; i++) {
      const diff = values1[i] - values2[i];
      sum += diff * diff;
    }

    return sum / values1.length;
  };

  const findFileWithMinimumError = () => {
    if (!uploadFileData || !fileData || fileData.length === 0) {
      console.error("No data available for comparison.");
      return;
    }

    console.log("Comparing files...");
    console.log("Upload file data:", uploadFileData);
    console.log("File data:", fileData);
    let minError = Infinity;
    let minErrorFile = null;

    fileData.forEach(file => {
      try {
        const mse = calculateMSE(uploadFileData.values, file.values);
        if (mse < minError) {
          minError = mse;
          minErrorFile = file;
          setMinErrorFile(file);
        }
      } catch (error) {
        console.error(`Error calculating MSE for file ${file.filename}:`, error);
      }
    });

    if (minErrorFile) {
      console.log(`File with minimum error: ${minErrorFile}`);
      // Make a POST request to store the data in MongoDB
      fetch('/api/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unique_id: '123',
          raw_file_name: uploadFileData.filename,
          raw_file_freq: uploadFileData.frequencies,
          raw_file_values: uploadFileData.values,
          matched_file_name: minErrorFile.filename,
          matched_file_freq: minErrorFile.frequencies,
          matched_file_values: minErrorFile.values,
        }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Data stored successfully:', data);
      })
      .catch(error => {
        console.error('Error storing data:', error);
      });
    } else {
      console.log("No file found with minimum error.");
    }
  };

  useEffect(() => {
    if (uploadFileData && fileData) {
      findFileWithMinimumError();
    }
  }, [uploadFileData, fileData]);

  const extractDKFromFilename = (filename) => {
    const match = filename.match(/DK_(\d+\.\d+)_S/);
    return match ? parseFloat(match[1]) : null;
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop a file here, or click to select a file</p>
      </div>

      <button onClick={findFileWithMinimumError} disabled={uploading}>
        Compare Files
      </button>

      <div>
        <h3>Result will be displayed here</h3>
        <div>
          {minErrorFile ? extractDKFromFilename(minErrorFile.filename) : "N/A"}
        </div>
      </div>

    </div>
  );
};

export default CreateResultUI;