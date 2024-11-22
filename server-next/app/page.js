"use client";
import React, { useState, useEffect } from 'react';
import { Client, Account, Storage, ID } from 'appwrite';
import { diffLines } from 'diff';
import ShineBorder from '@/components/ui/shine-border';
import { useRouter } from 'next/navigation';
// import { useTheme } from "next-themes";


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
  const [latestResult, setLatestResult] = useState(null);
  const router = useRouter();

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
          lines.forEach((line, index) => {
            if (index === 0) return; // Skip header line
            const [lineone] = line.trim().split(/\s+/); // Use whitespace as the delimiter
            const [frequency, reS11, imS11, reZ, imZ] = lineone.split(',');
            frequencies.push(parseFloat(frequency));
            const reS11Float = parseFloat(reS11);
            const imS11Float = parseFloat(imS11);
            if (isNaN(reS11Float) || isNaN(imS11Float)) {
              console.error(`Invalid number encountered ON FETCH ALL FILES - reS11: ${reS11}, imS11: ${imS11}`);
              return;
            }
            const magnitude = Math.sqrt(Math.pow(reS11Float, 2) + Math.pow(imS11Float, 2));
            const value = 20 * Math.log10(magnitude);
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


  // function similarityRatio(fileContentA, fileContentB) {
  //   console.log("starting similarityRatio");
  //   const minLength = Math.min(fileContentA.length, fileContentB.length);
  //   console.log("minLength", minLength);
  //   const truncatedA = fileContentA.slice(0, minLength);
  //   console.log("truncatedA", truncatedA);
  //   const truncatedB = fileContentB.slice(0, minLength);
  //   console.log("truncatedB", truncatedB);

  //   const diff = diffLines(truncatedA.join('\n'), truncatedB.join('\n'));
  //   console.log("diff", diff);
  //   const totalLength = truncatedA.join('\n').length + truncatedB.join('\n').length;
  //   console.log("totalLength", totalLength);
  //   const changesLength = diff.reduce((acc, part) => acc + (part.added || part.removed ? part.value.length : 0), 0);
  //   console.log("changesLength", changesLength);
  //   return 1 - changesLength / totalLength;
  // }


  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const fileContent = e.target.result;
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      const frequencies = [];
      const values = [];
      lines.forEach((line, index) => {
        if (index === 0) return;
        const [lineone] = line.trim().split(/\s+/); // Use whitespace as the delimiter
        // console.log(lineone);
        const [frequency, reS11, imS11, reZ, imZ] = lineone.split(',');
        // console.log(`Parsed values - frequency: ${frequency}, reS11: ${reS11}, imS11: ${imS11}, reZ: ${reZ}, imZ: ${imZ}`);
        frequencies.push(parseFloat(frequency));
        const reS11Float = parseFloat(reS11);
        const imS11Float = parseFloat(imS11);
        if (isNaN(reS11Float) || isNaN(imS11Float)) {
          console.error(`Invalid number encountered - reS11: ${reS11}, imS11: ${imS11}`);
          return;
        }
        const magnitude = Math.sqrt(Math.pow(reS11Float, 2) + Math.pow(imS11Float, 2));
        const value = 20 * Math.log10(magnitude);
        if (isNaN(value)) {
          console.error(`Calculated value is NaN - magnitude: ${magnitude}, value: ${value}`);
        }
        values.push(value);
      });
      console.log("file complete");
      console.log(frequencies);
      console.log(values);
      console.log(file.name);
      console.log("complete");

      const uploadFileData = { filename: file.name, frequencies, values };
      setUploadFileData(uploadFileData);
      console.log("uploadFileData", uploadFileData);

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
    const minLength = Math.min(values1.length, values2.length);
    const truncatedValues1 = values1.slice(0, minLength);
    const truncatedValues2 = values2.slice(0, minLength);

    // const normalize = (values) => {
    //   const min = Math.min(...values);
    //   const max = Math.max(...values);
    //   return values.map(value => (value - min) / (max - min));
    // };

    // const normalizedValues1 = normalize(truncatedValues1);
    // const normalizedValues2 = normalize(truncatedValues2);

    const normalizedValues1 = truncatedValues1;
    const normalizedValues2 = truncatedValues2;

    let sum = 0;
    for (let i = 0; i < minLength; i++) {
      const diff = normalizedValues1[i] - normalizedValues2[i];
      sum += diff * diff;
    }

    return sum / minLength;
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
        console.log(`MSE for file ${file.filename}:`, mse);
        if (mse < minError) {
          minError = mse;
          minErrorFile = file; // Ensure minErrorFile is an object
          setMinErrorFile(file);
        }
      } catch (error) {
        console.error(`Error calculating MSE for file ${file.filename}:`, error);
      }
    });

    if (minErrorFile) {
      console.log(`File with minimum error: ${minErrorFile.filename}`);
      console.log(minErrorFile.values);
      console.log(uploadFileData.values);
      // Log the POST request body
      const requestBody = {
        unique_id: '123',
        raw_file_name: uploadFileData.filename,
        raw_file_freq: uploadFileData.frequencies,
        raw_file_values: uploadFileData.values,
        matched_file_name: minErrorFile.filename,
        matched_file_freq: minErrorFile.frequencies,
        matched_file_values: minErrorFile.values,
      };
      console.log("POST request body:", requestBody);

      // Make a POST request to store the data in MongoDB
      fetch('/api/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  // const findMostSimilarFile = () => {
  //   if (!uploadFileData || !fileData || fileData.length === 0) {
  //     console.error("No data available for comparison.");
  //     return;
  //   }

  //   console.log("Comparing files...");
  //   console.log("Upload file data:", uploadFileData);
  //   console.log("File data:", fileData);

  //   let maxSimilarity = 0;
  //   let bestMatch = null;

  //   fileData.forEach(file => {
  //     const similarity = similarityRatio(uploadFileData.values, file.values);
  //     if (similarity > maxSimilarity) {
  //       maxSimilarity = similarity;
  //       bestMatch = file;
  //       setMinErrorFile(file);
  //     }
  //   });

  //   if (bestMatch) {
  //     console.log(`File with maximum similarity: ${bestMatch.filename}`);
  //     const requestBody = {
  //       unique_id: '123',
  //       raw_file_name: uploadFileData.filename,
  //       raw_file_freq: uploadFileData.frequencies,
  //       raw_file_values: uploadFileData.values,
  //       matched_file_name: bestMatch.filename,
  //       matched_file_freq: bestMatch.frequencies,
  //       matched_file_values: bestMatch.values,
  //     };
  //     console.log("POST request body:", requestBody);

  //     fetch('/api/result', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(requestBody),
  //     })
  //     .then(response => response.json())
  //     .then(data => {
  //       console.log("Data stored successfully:", data);
  //     })
  //     .catch(error => {
  //       console.error("Error storing data:", error);
  //     });
  //   } else {
  //     console.log('No matching files found.');
  //   }
  // };


  const fetchLatestResult = async () => {
    try {
      const response = await fetch('/api/getLatestResult');
      if (!response.ok) {
        throw new Error('Failed to fetch latest result');
      }
      const data = await response.json();
      setLatestResult(data);
      console.log('Latest result:', data);
    } catch (error) {
      console.error('Error fetching latest result:', error);
      alert('Failed to fetch latest result');
    }
  };

  useEffect(() => {
    if (uploadFileData && fileData) {
      // findMostSimilarFile();
      findFileWithMinimumError();
      router.push("#2");
    }
  }, [uploadFileData, fileData]);

  const extractDKFromFilename = (filename) => {
    const match = filename.match(/DK_(\d+\.\d+)\.csv/);
    return match ? parseFloat(match[1]) : null;
  };

  // const theme = useTheme();

  return (
    <div
      className="h-screen"
      style={{
        background: "rgb(237,230,224)",
        background: "linear-gradient(85deg, rgba(237,230,224,1) 0%, rgba(227,169,127,1) 100%)"
      }}
    >
      <div id="1" className='mx-auto flex justify-center items-center w-[80%] h-[100vh]'>
        <ShineBorder
          className="text-center text-2xl font-bold capitalize h-[70%] w-1/2"
          borderWidth={2}
        // color={theme.theme === "dark" ? "white" : "black"}
        >
          <div className="border-2 border-dashed border-gray-300 p-5 text-center h-full flex flex-col justify-center items-center w-full">
            <input type="file" id="fileInput" onChange={handleFileChange} className="hidden" />
            <label htmlFor="fileInput" className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded">
              Choose File
            </label>
            <p className='w-full text-xs'>Drag 'n' drop a file here, or click to select a file</p>
          </div>
        </ShineBorder>
      </div>

      {/* <div className='flex justify-center  cursor-pointer'>
        <ShineBorder
          className="text-center text-2xl font-bold capitalize"
          borderWidth={1}
        // color={theme.theme === "dark" ? "white" : "black"}
        >
          <button onClick={findFileWithMinimumError} disabled={uploading}>
            Compare Files
          </button>
        </ShineBorder>
      </div> */}

      <div id="2" className='h-[100vh] border-2 border-green-300'>
        <div className='h-[40%] w-[40%] mx-auto mt-14 flex justify-center items-center border-2 border-red-400'>
          <h3>Result will be displayed here</h3>
          <div>
            {minErrorFile ? extractDKFromFilename(minErrorFile.filename) : "b"}
          </div>
        </div>

        {/* <button onClick={fetchLatestResult} disabled={uploading}>
        Fetch Latest Result
      </button> */}
        {latestResult && (
          <div>
            <h3>Latest Result</h3>
            <p>Raw File Name: {latestResult.raw_file_name}</p>
            <p>Matched File Name: {latestResult.matched_file_name}</p>
            {/* Add more fields as needed */}
          </div>
        )}

      </div>
    </div>
  );
};

export default CreateResultUI;
