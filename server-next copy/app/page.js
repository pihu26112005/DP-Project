"use client";
import React, { useState, useEffect } from 'react';
import { Client, Account, Storage, ID } from 'appwrite';
import { diffLines } from 'diff';
import ShineBorder from '@/components/ui/shine-border';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// import { useTheme } from "next-themes";


const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('671f94c1001f0c9a88a1');

const account = new Account(client);
const storage = new Storage(client);

const CreateResultUI = () => {
  const [minErrorFile, setMinErrorFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [uploadFileData, setUploadFileData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [adultConc, setAdultConc] = useState(null);
  const [error, setError] = useState(null);
  // const [mongodbArrSize, setMongodbArrSize] = useState(null);
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
    // console.log(calculateVolumeFromFilename("DK_6.0.csv"));
  }, []);



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


      const uploadFileData = { filename: file.name, frequencies, values };
      setUploadFileData(uploadFileData);

    };

    reader.readAsText(file);
  };



  const calculateMSE = (values1, values2) => {
    const minLength = Math.min(values1.length, values2.length);
    const truncatedValues1 = values1.slice(0, minLength);
    const truncatedValues2 = values2.slice(0, minLength);

    const normalizedValues1 = truncatedValues1;
    const normalizedValues2 = truncatedValues2;

    let sum = 0;
    for (let i = 0; i < minLength; i++) {
      const diff = normalizedValues1[i] - normalizedValues2[i];
      sum += diff * diff;
    }

    return sum / minLength;
  };



  const findFileWithMinimumError = async () => {
    if (!uploadFileData || !fileData || fileData.length === 0) {
      console.error("No data available for comparison.");
      return;
    }

    let minError = Infinity;
    let minErrorFile = null;
    const fileErrors = [];

    fileData.forEach(file => {
      try {
        const mse = calculateMSE(uploadFileData.values, file.values);
        fileErrors.push({ filename: file.filename, error: mse });

        if (mse < minError) {
          minError = mse;
          minErrorFile = file; // Ensure minErrorFile is an object
          setMinErrorFile(file);
        }
      } catch (error) {
        console.error(`Error calculating MSE for file ${file.filename}:`, error);
      }
    });

    setError(fileErrors);
    console.log("File errors:", fileErrors);

    if (minErrorFile) {
      const requestBody = {
        unique_id: '123',
        raw_file_name: uploadFileData.filename,
        matched_file_name: minErrorFile.filename,

      };

      fetch('/api/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Data stored successfully:');
        })
        .catch(error => {
          console.error('Error storing data:', error);
        });
    } else {
      console.log("No file found with minimum error.");
    }
  };


  const fetchLatestResult = async () => {
    try {
      const response = await fetch('/api/getLatestResult');
      if (!response.ok) {
        throw new Error('Failed to fetch latest result');
      }
      const data = await response.json();
      setLatestResult(data);
      // console.log('Latest result:', data);
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

  const calculateVolumeFromFilename = (filename) => {
    const emelamine = 6;
    const emilk = 40;

    const match = filename.match(/DK_(\d+\.\d+)\.csv/);
    if (match) {
      const dielectricConstant = parseFloat(match[1]);
      const erCubedRoot = Math.cbrt(dielectricConstant);
      const emelamineCubedRoot = Math.cbrt(emelamine);
      const emilkCubedRoot = Math.cbrt(emilk);

      const volume = (erCubedRoot - emilkCubedRoot) / (emelamineCubedRoot - emilkCubedRoot);
      // setAdultConc(volume);
      return volume;
    }
    return "N/A";
  };

  const calculateDRfromFilename = (filename) => {
    const match = filename.match(/DK_(\d+\.\d+)\.csv/);
    if (match) {
      return parseFloat(match[1]);
    }
    return "N/A";
  };

  const handleTestAgain = () => {
    setMinErrorFile(null);
    setUploadFileData(null);
    setError(null);
    setLatestResult(null);
    setFileData(null);
    fetchAllFiles();
    router.push("#1");
  };


  // const theme = useTheme();

  return (
    <div
      className="h-screen"
      style={{
        backgroundImage: "url('/image/imi.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div id="1" className='mx-auto  w-[90%] h-[100vh]'>
        {/* <ShineBorder
          className="text-center text-2xl font-bold capitalize h-[300px] w-[400px] top-[100px] left-0"
          borderWidth={2}
          borderRadius={20}
        // color={theme.theme === "dark" ? "white" : "black"}
        > */}
        <div className="text-2xl font-bold h-[500px] w-[400px] top-11 left-0 text-center flex flex-col justify-center items-centerrounded-3xl">
          <input type="file" id="fileInput" onChange={handleFileChange} className="hidden" />
          <label htmlFor="fileInput" className="cursor-pointer bg-bhosda-1 text-white py-4 px-8 rounded-3xl">
            Choose File
          </label>
          <p className='w-full text-sm p-2'>Drag 'n' drop a file here, or click to select a file</p>
        </div>
        {/* </ShineBorder> */}
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

      <div id="2" className='h-[110vh] border-2 border-green-300 relative bg-cover bg-center' style={{ backgroundImage: "url('/image/im2.jpeg')" }}>
        <div className='h-[40%] w-[40%] left-0 mt-40 flex justify-center items-center absolute'>
          <div className='text-cxl font-bold text-connect-6 connect-custom-outline pb-2 w-[80%] text-center m-auto'>Result :</div>
        </div>
        <div className='dekhe h-[40%] w-[30%] mt-14 flex flex-col right-[32%] bottom-[35%] justify-center items-center border-2 border-red-400 absolute shadow-lg p-6'>
          <div className='text-2xl font-semibold w-[80%] text-center pb-2 text-gray-800'>
            Adulterant Type: {minErrorFile ? "Melamine" : ""}
          </div>
          <div className='text-lg font-medium w-[80%] text-center text-gray-600'>
            Adulterant Concentration: {minErrorFile ? calculateVolumeFromFilename(minErrorFile.filename) : "N/A"}
          </div>
          <div className='text-lg font-medium w-[80%] text-center text-gray-600'>
            Dielectric Constant: {minErrorFile ? calculateDRfromFilename(minErrorFile.filename) : "N/A"}
          </div>
        </div>
        <div className='left-[15%] bottom-[45%] absolute rounded-2xl cursor-pointer p-4 bg-red-300 hover:bg-white hover:border-2 hover:border-red-300' onClick={handleTestAgain}>
          Test Again
        </div>
        {/* <div className='top-0 right-0 absolute h-full w-[30%]'>
          <Image src="/image/im22.jpg" alt="imi" layout="fill" objectFit="cover" />
        </div> */}
      </div>
      {/* <button onClick={fetchLatestResult} disabled={uploading}>
        Fetch Latest Result
      </button> */}
      {/* {latestResult && (
        <div>
          <h3>Latest Result</h3>
          <p>Raw File Name: {latestResult.raw_file_name}</p>
          <p>Matched File Name: {latestResult.matched_file_name}</p>
          {/* Add more fields as needed */}
      {/* </div> */}
      {/* )} */}

    </div>
  );
};

export default CreateResultUI;
