import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth'; // Not used in this snippet, but kept for context
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { extractTextFromBase64Data } from '../utils/ocrHelper'; // Corrected import path
import { fileToBase64, getFileType } from '../utils/fileUtils'; // Corrected import path

const SidePanel = ({ onTextExtracted, userId }) => {
  const [file, setFile] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const baseUrl = 'http://localhost:5000';
  const [extractedText, setExtractedText] = useState('');
  // const [text, setText] = useState(''); // This state variable is not used and can be removed

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    if (!selected) return;
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!userId) {
      toast.error("User ID not found. Please log in.");
      return;
    }
    if (!file) {
      toast.error("No file selected for upload.");
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    try {
      const response = await axios.post(`${baseUrl}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("✅ File uploaded:", response.data);
      toast.success('File uploaded successfully!');
      setFile(null); // Clear the selected file after upload
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.error('Upload failed. See console for details.');
    }
  };

  const handleDelete = async (fileId) => {
    if (!userId) {
      toast.error("User ID not found. Please log in.");
      return;
    }
    try {
      await axios.delete(`${baseUrl}/api/files/${fileId}`, {
        params: { user_id: userId },
      });
      toast.success("File deleted successfully");
      fetchFiles(); // Refresh the file list
      // Clear selected file preview if the deleted file was being previewed
      if (selectedFileUrl && selectedFileUrl.includes(fileId)) {
        setSelectedFileUrl(null);
        setSelectedFileType('');
      }
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete file");
    }
  };

  const fetchFiles = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${baseUrl}/api/files`, {
        params: { user_id: userId },
      });
      console.log("📁 Files fetched:", res.data);
      setFilesList(res.data);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast.error('Failed to fetch files.');
    }
  };

  const handleFileClick = (fileItem) => {
    const fileUrl = `${baseUrl}/storage/${fileItem.path}`;
    setSelectedFileUrl(fileUrl);
    setSelectedFileType(fileItem.filename.split('.').pop().toLowerCase());
  };

  const saveExtractedText = async (textToSave) => {
    if (!userId || !textToSave) return; // Ensure userId and text are present
    try {
      // Use a new endpoint for saving/updating text associated with the user
      await axios.post(`${baseUrl}/api/extracted-text`, { userId, text: textToSave });
      console.log("✅ Extracted text saved/updated successfully.");
    } catch (error) {
      console.error('❌ Failed to save text:', error);
      toast.error('Failed to save extracted text.');
    }
  };

  const deleteExtractedText = async () => {
    if (!userId) return;
    try {
      await axios.delete(`${baseUrl}/api/extracted-text/${userId}`);
      setExtractedText(''); // Clear the extracted text from state
      onTextExtracted(''); // Clear text on the whiteboard as well
      toast.success("Extracted text deleted successfully.");
    } catch (error) {
      console.error('❌ Failed to delete text:', error);
      toast.error('Failed to delete extracted text.');
    }
  };

  const fetchExtractedText = async () => {
    if (!userId) return;
    try {
      // Fetch the saved text for the current user
      const response = await axios.get(`${baseUrl}/api/extracted-text/${userId}`);
      if (response.data && response.data.text) {
        setExtractedText(response.data.text);
        // Pass the loaded text to the whiteboard on load
        onTextExtracted(response.data.text);
        console.log("✅ Extracted text loaded:", response.data.text);
      }
    } catch (error) {
      // It's normal for this to fail if no text has been saved yet, so log as info
      console.info('No extracted text found for user:', userId);
    }
  };

  const handleOCR = async () => {
    // Initial check for a file
    if (!file) {
      toast.warn("Please select a file using 'Choose File' button to perform OCR.");
      return;
    }

    // Create a local copy of the file to prevent state changes from interfering
    const fileToProcess = file;

    // Determine the file type for OCR processing
    const type = getFileType(fileToProcess); // This will return 'image' or 'pdf'

    if (type !== 'image' && type !== 'pdf') {
      toast.error('OCR only supports image (PNG, JPG) or PDF files.');
      return;
    }

    setIsProcessingOCR(true);
    toast.info("Processing OCR...");

    try {
      // Convert the file to a base64 data URL
      const base64Data = await fileToBase64(fileToProcess);
      
      // Call the updated OCR helper function, passing both data and type
      const extractedTextResult = await extractTextFromBase64Data(base64Data, type);

      if (extractedTextResult) {
        setExtractedText(extractedTextResult);
        onTextExtracted(extractedTextResult); // Send to whiteboard
        toast.success("Text extracted and sent to whiteboard!");
        await saveExtractedText(extractedTextResult); // Save to backend
      } else {
        toast.info("No text could be extracted from this file.");
      }
    } catch (error) {
      console.error('OCR failed:', error);
      toast.error(`OCR failed: ${error.message}. Check browser console and backend logs.`);
    } finally {
      setIsProcessingOCR(false);
      // Clear the file input and state after processing, regardless of success or failure
      setFile(null);
      document.querySelector('input[type="file"]').value = '';
    }
  };

  // Effect to fetch files when userId changes (e.g., on login/logout)
  useEffect(() => {
    fetchFiles();
  }, [userId]);

  // Effect to load previously extracted text when the component mounts or userId changes
  useEffect(() => {
    fetchExtractedText();
  }, [userId]);

  // Effect to debounce saving of edited extracted text
  useEffect(() => {
    // Only save if extractedText is not empty (i.e., there's something to save)
    if (extractedText) {
      const handler = setTimeout(() => {
        saveExtractedText(extractedText);
      }, 1000); // Wait 1 second after the user stops typing before saving

      // Cleanup function: clear the timeout if the component unmounts or extractedText changes again
      return () => {
        clearTimeout(handler);
      };
    }
  }, [extractedText, userId]); // Re-run when extractedText or userId changes

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: '#010141',
        borderRight: '1px solid #ccc',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        height: '100vh',
        boxSizing: 'border-box',
        color: '#fff',
        borderTopRightRadius: '16px',
        borderBottomRightRadius: '16px',
      }}
    >
      <h4 style={{ marginBottom: '10px', fontSize: '18px', color: '#ffffff' }}>
        Attach File
      </h4>
      <input
        type="file"
        onChange={handleFileChange}
        style={{
          fontSize: '12px',
          marginBottom: '10px',
          backgroundColor: '#fff',
          color: '#000',
          borderRadius: '4px',
          padding: '4px',
        }}
      />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={handleUpload}
          style={{
            fontSize: '13px',
            padding: '6px 12px',
            backgroundColor: '#4A90E2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            flex: 1,
          }}
        >
          Upload
        </button>
        <button
          onClick={handleOCR}
          disabled={isProcessingOCR || !file}
          style={{
            fontSize: '13px',
            padding: '6px 12px',
            backgroundColor: isProcessingOCR ? '#888' : '#28A745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isProcessingOCR ? 'not-allowed' : 'pointer',
            flex: 1,
          }}
        >
          {isProcessingOCR ? 'Processing...' : 'Extract Text'}
        </button>
      </div>

      <h4 style={{ marginBottom: '10px', fontSize: '16px', color: '#ffffff' }}>
        Uploaded Files
      </h4>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          maxHeight: '250px',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          padding: '6px 10px',
          color: '#000',
        }}
      >
        {filesList.length === 0 ? (
          <li style={{ color: '#888', fontSize: '12px' }}>No files uploaded yet.</li>
        ) : (
          filesList.map((fileItem) => (
            <li key={fileItem.id} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleFileClick(fileItem)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#010141',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={fileItem.filename}
              >
                {fileItem.filename}
              </button>
              <button onClick={() => handleDelete(fileItem.id)} style={{ color: 'red', fontSize: '12px', border: 'none', background: 'none', marginLeft: '8px', cursor: 'pointer' }}>
                🗑
              </button>
            </li>
          ))
        )}
      </ul>
      {selectedFileUrl && (
        <div style={{ marginTop: '20px' }}>
          <h5 style={{ fontSize: '14px', marginBottom: '8px' }}>Preview</h5>
          {['jpg', 'jpeg', 'png'].includes(selectedFileType) ? (
            <img
              src={selectedFileUrl}
              alt="Preview"
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '6px',
                border: '1px solid #ccc',
              }}
            />
          ) : selectedFileType === 'pdf' ? (
            <iframe
              src={selectedFileUrl}
              width="100%"
              height="260px"
              title="PDF Preview"
              style={{
                border: '1px solid #ccc',
                borderRadius: '6px',
              }}
            />
          ) : (
            <p style={{ fontSize: '12px', color: '#fff' }}>
              Not previewable.{' '}
              <a
                href={selectedFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4A90E2', textDecoration: 'underline' }}
              >
                Download
              </a>
            </p>
          )}
        </div>
      )}
      {extractedText && (
        <div
          ref={(ref) => (window.extractedBox = ref)}
          style={{
            position: 'fixed',
            top: '100px',
            left: '350px',
            zIndex: 999,
            width: '400px',
            height: '240px',
            backgroundColor: '#f9f9f9',
            border: '2px solid #ccc',
            borderRadius: '8px',
            padding: '12px',
            cursor: 'move',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            color: '#000',
            resize: 'both',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onMouseDown={(e) => {
            const box = e.currentTarget;
            if (e.target.closest('.resize-handle') || e.target.tagName === 'TEXTAREA' || e.target.classList.contains('close-btn')) return;
            const shiftX = e.clientX - box.getBoundingClientRect().left;
            const shiftY = e.clientY - box.getBoundingClientRect().top;
            function moveAt(pageX, pageY) {
              const screenW = window.innerWidth;
              const screenH = window.innerHeight;
              const boxW = box.offsetWidth;
              const boxH = box.offsetHeight;
              let newLeft = pageX - shiftX;
              let newTop = pageY - shiftY;
              newLeft = Math.max(0, Math.min(newLeft, screenW - boxW));
              newTop = Math.max(0, Math.min(newTop, screenH - boxH));
              box.style.left = newLeft + 'px';
              box.style.top = newTop + 'px';
            }
            function onMouseMove(e) {
              moveAt(e.pageX, e.pageY);
            }
            document.addEventListener('mousemove', onMouseMove);
            document.onmouseup = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.onmouseup = null;
            };
          }}
        >
          <button
            className="close-btn"
            onClick={(e) => {
              e.preventDefault();
              deleteExtractedText(); // Call the new function to delete from Firestore
            }}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#333',
              fontWeight: 'bold',
            }}
          >
            ❌
          </button>
          <h5 style={{ fontSize: '15px', marginBottom: '8px', fontWeight: 'bold' }}>Extracted Text</h5>
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            style={{
              width: '100%',
              height: 'calc(100% - 50px)',
              resize: 'none',
              padding: '8px',
              fontSize: '13px',
              borderRadius: '4px',
              border: '1px solid #aaa',
              backgroundColor: '#fff',
              fontFamily: 'monospace',
              color: '#000',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SidePanel;
