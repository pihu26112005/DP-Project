"use client";
import React, { useState, useEffect } from 'react';
import { Client, Account, Storage, ID } from 'appwrite';
import { Databases } from "appwrite";


const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('671f94c1001f0c9a88a1');

const account = new Account(client);
const storage = new Storage(client);
const databases = new Databases(client);


const CreateResultUI = () => {
  const [files, setFiles] = useState([]);
  const [minErrorFile, setMinErrorFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [uploadFileData, setUploadFileData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    document: null, // State for the selected document
  });

  // const { user } = useGlobalContext();

  // Fetch all files from Appwrite Storage
  const fetchAllFiles = async () => {
    try {
      // console.log("pahla hu main")
      const response = await storage.listFiles('671fa00f0021cb655fbd');
      const files = response.files;
      // console.log("dusr hu main")
  
      const fileDataPromises = files.map(async (file) => {
        const fileUrl = await storage.getFileView('671fa00f0021cb655fbd', file.$id);
        const fileResponse = await fetch(fileUrl);
        // console.log("teesra hu main")
  
        if (fileResponse.ok) {
          const fileContent = await fileResponse.text();
          // console.log("chautha hu main")
  
          // Split file content into lines and find where the data begins
          const lines = fileContent.split('\n').filter(line => line.trim() !== '');
          const dataStartIndex = lines.findIndex(line => line.startsWith("BEGIN CH1_DATA")) + 1;
  
          // Extract frequencies and values
          const freq = [];
          const values = [];
  
          for (let i = dataStartIndex; i < lines.length; i++) {
            const line = lines[i].trim();
  
            // Break if reaching the end of the data block
            if (!line || line.startsWith('!') || line.startsWith('END')) break;
  
            const [frequency, val1, val2, val3, val4] = line.split(',').map(parseFloat);
  
            // Validate the parsed values
            if (!isNaN(frequency) && [val1, val2, val3, val4].every(val => !isNaN(val))) {
              freq.push(frequency);
              values.push([val1, val2, val3, val4]);
            } else {
              console.log(`Skipping invalid line: ${line}`);
            }
          }
          // console.log("paanchva hu main")
  
          return { filename: file.name, freq, values };
        } else {
          throw new Error(`Failed to fetch file content for ${file.name}`);
        }
      });
      // console.log("chheva hu main")
  
      const allFileData = await Promise.all(fileDataPromises);
      setFileData(allFileData);
      // console.log(allFileData[0]); // Debugging: log the structured data
    } catch (error) {
      console.error("Error fetching files:", error);
      console.log("Error", "Failed to fetch files from Appwrite storage");
    }
  };
  

  useEffect(() => {
    fetchAllFiles();
  }, []);


  // const handleFileChange = async (event) => {
  //   // if (!form.document) {
  //   //   console.log("Please uplllload a file to compare.");
  //   //   return;
  //   // }
  
  //   setUploading(true);
  
  //   try {
  //     const { mimeType, ...rest } = form.document.assets[0];
  //     const asset = { type: mimeType, ...rest };
  
  //     // Upload the file to Appwrite storage
  //     const uploadResponse = await storage.createFile('678556be0035ff1d0135', ID.unique(), asset);
  
  //     // Fetch the uploaded file content
  //     const fileUrl = await storage.getFileView('678556be0035ff1d0135', uploadResponse.$id);
  //     const fileResponse = await fetch(fileUrl);
  
  //     if (fileResponse.ok) {
  //       const fileContent = await fileResponse.text();
  
  //       // Split file content into lines and find where the data begins
  //       const lines = fileContent.split('\n').filter(line => line.trim() !== '');
  //       const dataStartIndex = lines.findIndex(line => line.startsWith("BEGIN CH1_DATA")) + 1;
  
  //       // Extract frequencies and values
  //       const frequencies = [];
  //       const values = [];
  
  //       for (let i = dataStartIndex; i < lines.length; i++) {
  //         const line = lines[i].trim();
  
  //         // Break if reaching the end of the data block
  //         if (!line || line.startsWith('!') || line.startsWith('END')) break;
  
  //         const [frequency, val1, val2, val3, val4] = line.split(',').map(parseFloat);
  
  //         // Validate the parsed values
  //         if (!isNaN(frequency) && [val1, val2, val3, val4].every(val => !isNaN(val))) {
  //           frequencies.push(frequency);
  //           values.push([val1, val2, val3, val4]);
  //         } else {
  //           console.log(`Skipping invalid line: ${line}`);
  //         }
  //       }
  
  //       const uploadFileData = { filename: uploadResponse.name, frequencies, values };
  //       setUploadFileData(uploadFileData);
  
  //       console.log("Success", "File uploaded and processed successfully.");
  //     } else {
  //       throw new Error(`Failed to fetch file content for ${uploadResponse.name}`);
  //     }
  //   } catch (error) {
  //     console.error("Error uploading file:", error);
  //     console.log("Error", "Failed to upload file to Appwrite storage.");
  //   } finally {
  //     setUploading(false);
  //   }
  // };


  const handleFileChange = async (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      console.log("Please upload a valid file.");
      return;
    }
  
    setUploading(true);
  
    try {
      const file = event.target.files[0]; // Get the selected file
      const fileId = ID.unique();
  
      // Upload file to Appwrite storage
      const uploadResponse = await storage.createFile('678556be0035ff1d0135', fileId, file);
  
      // Fetch the uploaded file content
      const fileDownloadUrl = await storage.getFileDownload('678556be0035ff1d0135', uploadResponse.$id);
      const fileResponse = await fetch(fileDownloadUrl);
  
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file content: ${fileResponse.statusText}`);
      }
  
      const fileContent = await fileResponse.text();
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      const dataStartIndex = lines.findIndex(line => line.startsWith("BEGIN CH1_DATA")) + 1;
  
      // Extract frequencies and values
      const frequencies = [];
      const values = [];
  
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('!') || line.startsWith('END')) break;
  
        const [frequency, val1, val2, val3, val4] = line.split(',').map(parseFloat);
        if (!isNaN(frequency) && [val1, val2, val3, val4].every(val => !isNaN(val))) {
          frequencies.push(frequency);
          values.push([val1, val2, val3, val4]);
        } else {
          console.log(`Skipping invalid line: ${line}`);
        }
      }
  
      setUploadFileData({ filename: file.name, frequencies, values });
  
      console.log("Success: File uploaded and processed successfully.");
    } catch (error) {
      console.error("Error:", error);
      console.log("Error: Failed to upload or process file.");
    } finally {
      setUploading(false);
    }
  };
  

  const calculateMSE = (values1, values2) => {
    if (values1.length !== values2.length) {
      throw new Error("Arrays must have the same length to calculate MSE.");
    }
  
    let totalSquaredError = 0;
    let totalElements = 0;
  
    for (let i = 0; i < values1.length; i++) {
      if (values1[i].length !== values2[i].length) {
        throw new Error(`Mismatch in sub-array lengths at index ${i}`);
      }
  
      for (let j = 0; j < values1[i].length; j++) {
        const diff = values1[i][j] - values2[i][j];
        totalSquaredError += diff * diff;
        totalElements++;
      }
    }
    console.log("Total Squared Error:", totalSquaredError);
    console.log("Total Elements:", totalElements);
  
    return totalSquaredError / totalElements;
  };




  const findFileWithMinimumError = () => {
    if (!uploadFileData || !fileData || fileData.length === 0) {
      console.error("No data available for comparison.");
      return;
    }
    console.log("Comparing uploaded file with all files...");
    console.log("Uploaded file:", uploadFileData.filename);
    console.log("Number of files to compare:", fileData.length);
    console.log("............................................................................................................................")
    console.log(fileData[0].values);
    console.log("............................................................................................................................")
  
    let minError = Infinity;
    let minErrorFile = null;
  
    fileData.forEach(file => {
      try {
        const mse = calculateMSE(uploadFileData.values, file.values);
        if (mse < minError) {
          minError = mse;
          minErrorFile = file.filename;
          setMinErrorFile(file.filename);
        }
        // console.log(`MSE for file ${file.filename}:`, mse);
      } catch (error) {
        console.error(`Error calculating MSE for file ${file.filename}:`, error);
      } 
    });
  
    if (minErrorFile) {
      console.log(`File with minimum error: ${minErrorFile}`);
    } else {
      console.log("No file found with minimum error.");
    }
  };

  const storeComparisonResult = async (uploadedFileName) => {
    try {
      console.log("ha mian phunch gaya ")
      const response = await databases.createDocument(
        "67b38d4c0016eef784f4",  // Replace with your actual Database ID
        "67b38d55002d55adc257", // Replace with your actual Collection ID
        ID.unique(),        // Generates a unique document ID
        {
          result: uploadedFileName,
        }
      );
      console.log("ha mian phunch gaya ")
  
      console.log("Comparison result stored successfully:", response);
    } catch (error) {
      console.error("Error storing comparison result:", error);
    }
  };
  
  

  useEffect(() => {
    const findAndStoreFileWithMinimumError = async () => {
      await findFileWithMinimumError();
    };
  
    if(fileData && uploadFileData){
      findAndStoreFileWithMinimumError();
    }
  }, [fileData, uploadFileData]); // Runs when fileData or uploadFileData changes
  
  // Effect to store result after minErrorFile is updated
  useEffect(() => {
    if (minErrorFile) {
      storeComparisonResult(minErrorFile);
    }
  }, [minErrorFile]); // Runs when minErrorFile is updated

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
        <div className="text-2xl font-bold h-[500px] w-[400px] top-11 left-0 text-center flex flex-col justify-center items-centerrounded-3xl">
          <input type="file" id="fileInput" onChange={handleFileChange} className="hidden" />
          <label htmlFor="fileInput" className="cursor-pointer bg-bhosda-1 text-white py-4 px-8 rounded-3xl">
            Choose File
          </label>
          <p className='w-full text-sm p-2'>Drag 'n' drop a file here, or click to select a file</p>
        </div>
        {/* </ShineBorder> */}
      </div>
    </div>
  );
};

export default CreateResultUI;
