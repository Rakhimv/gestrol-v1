import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ConfigProvider, theme } from "antd";
import "./App.scss";

const { darkAlgorithm } = theme;

const App: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastActionRef = useRef<number | null>(null);
    const [direction, setDirection] = useState<"NEXT" | "PREV" | null>(null);
    const [animate, setAnimate] = useState(false);

    const thresholdUp = 0.45;  
    const thresholdDown = 0.65; 


    useEffect(() => {
        if (!videoRef.current) return;

        (async () => {
            const mp = await import("@mediapipe/face_mesh");
            const mpCamera = await import("@mediapipe/camera_utils");

            const faceMesh = new mp.FaceMesh({
                locateFile: (file: string) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7,
            });

            faceMesh.onResults((results: any) => {
                if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0)
                    return;

                const landmarks = results.multiFaceLandmarks[0];
                const noseY = landmarks[1].y; 

                const now = Date.now();
                if (lastActionRef.current && now - lastActionRef.current < 600) return;



                if (noseY < thresholdUp) {
         
                    setDirection("NEXT");
                    setAnimate(true);
                    lastActionRef.current = now;
                    axios.get("http://localhost:5559/gesture/next").catch(() => { });
                    setTimeout(() => setAnimate(false), 400);
                } else if (noseY > thresholdDown) {

                    setDirection("PREV");
                    setAnimate(true);
                    lastActionRef.current = now;
                    axios.get("http://localhost:5559/gesture/prev").catch(() => { });
                    setTimeout(() => setAnimate(false), 400);
                }
            });


            const camera = new mpCamera.Camera(videoRef.current!, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoRef.current! });
                },
                width: 200,
                height: 150,
            });

            camera.start();
        })();
    }, []);

    return (
        <ConfigProvider theme={{ algorithm: darkAlgorithm }}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    gap: 20,
                    backgroundColor: "#1f1f1f",
                }}
            >
                <video
                    ref={videoRef}
                    style={{
                        width: 200,
                        height: 150,
                        border: "2px solid white",
                        borderRadius: 8,
                    }}
                    autoPlay
                    muted
                />
                <div
                    style={{
                        color: "white",
                        fontSize: animate ? 50 : 30,
                        opacity: animate ? 1 : 0.6,
                        transition: "all 0.3s ease",
                    }}
                >
                    {direction ? direction : "Смотри вверх / вниз"}
                </div>
            </div>
        </ConfigProvider>
    );
};

export default App;
