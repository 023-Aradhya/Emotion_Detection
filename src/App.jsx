import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";  

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState("");

  const loadModels = async () => {
    const MODEL_URL = "/models";
    await faceapi.nets.tinyFaceDetector.loadFromUri(
      `${MODEL_URL}/tiny_face_detector_model`
    );
    await faceapi.nets.faceExpressionNet.loadFromUri(
      `${MODEL_URL}/face_expression_model`
    );
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing webcam:", err));
  };

  const handleVideoOnPlay = () => {
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };

      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (resizedDetections) {
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        const expressions = resizedDetections.expressions;
        const maxValue = Math.max(...Object.values(expressions));
        const dominantEmotion = Object.keys(expressions).find(
          (key) => expressions[key] === maxValue
        );
        setEmotion(dominantEmotion);
      }
    }, 200);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    loadModels().then(startVideo);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg,rgb(91, 60, 230), #e2d1c3)",
      fontFamily: "'Poppins', sans-serif",
      padding: "10px",
    }}>
      <h1 style={{
        fontSize: "2.5rem",
        color: "#333",
        marginBottom: "10px",
        textShadow: "1px 1px 2px rgba(191, 35, 35, 0.2)"
      }}>
        Facial Emotion Detection
      </h1>
  
      <div style={{
        position: "relative",
        borderRadius: "15px",
        overflow: "hidden",
        boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
        width: "480x",
        height: "400px",   
        backgroundColor: "#000",
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={handleVideoOnPlay}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
  
      <div style={{
        marginTop: "30px",
        padding: "12px 24px",
        backgroundColor: "#6a11cb",
        backgroundImage: "linear-gradient(315deg, #6a11cb 0%, #2575fc 74%)",
        color: "white",
        borderRadius: "30px",
        fontSize: "1.5rem",
        fontWeight: "bold",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}>
        Detected Emotion: {emotion ? emotion.toUpperCase() : "Detecting..."}
      </div>
    </div>
  );  
}

export default App;
