
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import ControlPanel from './components/ControlPanel';
import { Particle, AppConfig, DEFAULT_WORDS, DEFAULT_MOUTH_POS } from './types';

// Constants
const MAX_PARTICLES = 200; // Increased limit for stacking fun
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PARTICLE_LIFETIME_MS = 10000; // 10 Seconds

const App: React.FC = () => {
  // Refs for HTML Elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for Logic (Refs are used in the animation loop to avoid closure staleness)
  const requestRef = useRef<number>(0);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastEruptionTimeRef = useRef<number>(0);
  const mouthPosRef = useRef(DEFAULT_MOUTH_POS); // Normalized 0-1
  const mouthOpennessRef = useRef<number>(0); // 0.0 to 1.0 (jawOpen)
  
  // CRITICAL: Use Ref for loop condition to prevent stale closures in recursion
  const isStreamingRef = useRef(false);
  const isFaceDetectedRef = useRef(false); // Ref version for loop logic
  
  // State for UI
  const [isConnected, setIsConnected] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false); // State version for UI
  const [audioLevel, setAudioLevel] = useState(0); // For UI meter only
  const [uiMouthOpenness, setUiMouthOpenness] = useState(0); // For UI meter only
  const [wordList, setWordList] = useState<string[]>(DEFAULT_WORDS);
  const [config, setConfig] = useState<AppConfig>({
    sensitivity: 0.05,
    particleScale: 1.0,
    gravity: 0.35,
    useMouthTracking: true,
    fixedText: "", // Default empty
    minMouthOpenness: 0.05, // Default threshold for jaw opening
  });

  // Keep a ref of config for the animation loop
  const configRef = useRef(config);
  const wordListRef = useRef(wordList);
  
  useEffect(() => {
      configRef.current = config;
  }, [config]);

  useEffect(() => {
      wordListRef.current = wordList;
  }, [wordList]);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true, // Critical for detecting jawOpen
          runningMode: "VIDEO",
          numFaces: 1
        });
        console.log("Face Landmarker loaded");
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
      }
    };
    initMediaPipe();

    // Cleanup
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      isStreamingRef.current = false;
    };
  }, []);

  const spawnParticle = (x: number, y: number, volumeIntensity: number) => {
    if (particlesRef.current.length >= MAX_PARTICLES) return;
    
    // Logic: Use fixed text if provided, else random
    // Use Ref to get latest config inside loop
    const currentConfig = configRef.current;
    const currentList = wordListRef.current;

    const text = currentConfig.fixedText.trim() !== "" 
      ? currentConfig.fixedText 
      : currentList[Math.floor(Math.random() * currentList.length)];
    
    // Calculate properties based on volume
    // REVISED SIZE LOGIC:
    // Base size 12px (small whisper)
    // Dynamic range: up to +100px based on volume
    const baseSize = 12;
    const dynamicSize = volumeIntensity * 100; 
    const size = (baseSize + dynamicSize) * currentConfig.particleScale;
    
    // Physics: Eruption effect
    // Add random spread to X
    const vx = (Math.random() - 0.5) * 15; 
    // Initial velocity Up (negative Y)
    const vy = -10 - (volumeIntensity * 30); 

    particlesRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      vx,
      vy,
      size,
      alpha: 1,
      color: `hsl(${Math.random() * 60 + 330}, 100%, 70%)`,
      rotation: (Math.random() - 0.5) * 0.5,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      createdAt: Date.now()
    });
  };

  const updateParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    const currentConfig = configRef.current;
    const isFaceLocked = isFaceDetectedRef.current;

    // --- DEBUG: Draw Mouth Position ---
    if (isStreamingRef.current) {
        const targetX = (isFaceLocked && currentConfig.useMouthTracking 
          ? (1 - mouthPosRef.current.x) 
          : 0.5) * width;
        const targetY = (isFaceLocked && currentConfig.useMouthTracking 
          ? mouthPosRef.current.y 
          : 0.5) * height;

        ctx.save();
        
        // Debug Visuals: Green = Face Locked. 
        // If Mouth Open threshold passed: Filled Circle. If Closed: Empty Crosshair.
        const isOpen = mouthOpennessRef.current > currentConfig.minMouthOpenness;
        
        ctx.strokeStyle = isFaceLocked ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.3)";
        ctx.fillStyle = isOpen ? "rgba(0, 255, 0, 0.5)" : "transparent";
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        if (isOpen) {
            ctx.arc(targetX, targetY, 15, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Crosshair
            ctx.moveTo(targetX - 15, targetY);
            ctx.lineTo(targetX + 15, targetY);
            ctx.moveTo(targetX, targetY - 15);
            ctx.lineTo(targetX, targetY + 15);
        }
        ctx.stroke();
        ctx.restore();
    }
    // ----------------------------------

    const now = Date.now();
    const particles = particlesRef.current;

    // 1. Physics Update Loop
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const radius = p.size * 0.35; // Hitbox radius

      // --- Movement ---
      p.vy += currentConfig.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // --- Floor Collision (Stacking at bottom) ---
      if (p.y + radius > height) {
        p.y = height - radius;
        p.vy *= -0.4; // Bounce dampen
        p.vx *= 0.6;  // Floor friction
        p.rotationSpeed *= 0.8;
      }

      // --- Wall Collision ---
      if (p.x - radius < 0) {
        p.x = radius;
        p.vx *= -0.6;
      } else if (p.x + radius > width) {
        p.x = width - radius;
        p.vx *= -0.6;
      }

      // --- Lifecycle (10s) ---
      const age = now - p.createdAt;
      if (age > PARTICLE_LIFETIME_MS) {
         p.alpha -= 0.05; // Fade out quickly after 10s
      }
      
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
    }

    // 2. Collision Resolution Loop (Stacking effect)
    // Run multiple iterations for stability
    const iterations = 3;
    for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distSq = dx*dx + dy*dy;
                
                // Radius based on font size
                const r1 = p1.size * 0.35; 
                const r2 = p2.size * 0.35;
                const minDist = r1 + r2;

                if (distSq < minDist * minDist && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    
                    // Normal vector
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // Separate particles
                    const force = 0.5; // separation strength
                    
                    // Apply separation
                    p1.x -= nx * overlap * force;
                    p1.y -= ny * overlap * force;
                    p2.x += nx * overlap * force;
                    p2.y += ny * overlap * force;
                    
                    // Friction/Damping during collision
                    // This helps them "stack" rather than explode
                    if (k === 0) { // Only apply velocity damping once
                        p1.vx *= 0.9;
                        p1.vy *= 0.9;
                        p2.vx *= 0.9;
                        p2.vy *= 0.9;
                    }
                }
            }
        }
    }

    // 3. Render Loop
    for (const p of particles) {
      ctx.save();
      // Translate to center of particle
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.font = `900 ${p.size}px 'Segoe UI Emoji', 'Noto Sans TC', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Text Outline
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.strokeText(p.text, 0, 0);
      
      // Text Fill
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  };

  const predictWebcam = useCallback(() => {
    // Check ref instead of state to avoid closure issues
    if (!isStreamingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Face Tracking
      if (faceLandmarkerRef.current) {
        const startTimeMs = performance.now();
        const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (results.faceLandmarks.length > 0) {
          // Update Logic Refs
          isFaceDetectedRef.current = true;
          
          const landmarks = results.faceLandmarks[0];
          // 13: upper lip, 14: lower lip
          const upperLip = landmarks[13];
          const lowerLip = landmarks[14];
          mouthPosRef.current = {
            x: (upperLip.x + lowerLip.x) / 2,
            y: (upperLip.y + lowerLip.y) / 2
          };

          // Get Jaw Openness from Blendshapes
          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            const categories = results.faceBlendshapes[0].categories;
            const jawOpen = categories.find(c => c.categoryName === 'jawOpen')?.score || 0;
            mouthOpennessRef.current = jawOpen;
          }

        } else {
          isFaceDetectedRef.current = false;
          mouthOpennessRef.current = 0;
        }

        // Sync UI State (Throttled if needed, but simple set is fine for now)
        // We only set this if it changed to avoid React render spam, but here we just rely on the Ref for logic.
        if (isFaceDetected !== isFaceDetectedRef.current) {
            setIsFaceDetected(isFaceDetectedRef.current);
        }
        setUiMouthOpenness(mouthOpennessRef.current);
      }

      // 2. Audio Analysis
      let normalizedVol = 0;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Sensitivity normalization
        normalizedVol = average / 255;
        setAudioLevel(normalizedVol); 
      }

      // 3. Trigger Eruption
      const now = performance.now();
      const currentConfig = configRef.current;
      
      // LOGIC UPDATE: Check Volume AND Mouth Openness
      const isMouthOpen = currentConfig.useMouthTracking 
          ? (mouthOpennessRef.current > currentConfig.minMouthOpenness) 
          : true;

      // Check Ref for accurate "current frame" detection status
      const isFaceLocked = isFaceDetectedRef.current;

      if (normalizedVol > currentConfig.sensitivity && isMouthOpen && (now - lastEruptionTimeRef.current > 100)) {
           // Coordinate conversion
           // Video is mirrored via CSS, so we mirror X coordinate here to match: (1 - x)
           let spawnX = 0.5 * CANVAS_WIDTH;
           let spawnY = 0.5 * CANVAS_HEIGHT;

           if (currentConfig.useMouthTracking) {
             // If face is detected, use mouth. If not, fallback to center (0.5)
             const mX = isFaceLocked ? mouthPosRef.current.x : 0.5;
             const mY = isFaceLocked ? mouthPosRef.current.y : 0.5;
             
             spawnX = (1 - mX) * CANVAS_WIDTH;
             spawnY = mY * CANVAS_HEIGHT;
           }

           spawnParticle(spawnX, spawnY, normalizedVol);
           lastEruptionTimeRef.current = now;
      }

      // 4. Render
      updateParticles(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // Recursive call
    if (isStreamingRef.current) {
        requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isFaceDetected]); // Dep is kept for linting, but Refs drive the logic

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: CANVAS_WIDTH }, 
          height: { ideal: CANVAS_HEIGHT } 
        },
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to ensure dimensions are known
        videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             // Start loop
             isStreamingRef.current = true;
             setIsConnected(true);
             requestRef.current = requestAnimationFrame(predictWebcam);
        };
      }

      // Setup Audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone. Please allow permissions.");
    }
  };

  const stopStream = () => {
    isStreamingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Clear canvas
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    setIsConnected(false);
    setIsFaceDetected(false);
    isFaceDetectedRef.current = false; // Reset ref
    setAudioLevel(0);
    setUiMouthOpenness(0);
  };

  return (
    <div className="relative w-screen h-screen bg-black flex justify-center items-center overflow-hidden">
      
      {/* Background/Loader */}
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-4">
             <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-violet-600 animate-pulse mx-auto blur-xl opacity-50"></div>
             <p className="text-gray-500 font-mono text-sm animate-pulse">Waiting for camera...</p>
          </div>
        </div>
      )}

      {/* Main AR Viewport */}
      <div className="relative aspect-video h-full max-h-screen w-auto border border-gray-800 shadow-2xl bg-gray-900 rounded-lg overflow-hidden">
        {/* Video is Mirrored visually via CSS */}
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
          playsInline
          muted
        />
        
        {/* Canvas overlays (NOT mirrored via CSS, we handle X-flip in JS) */}
        <canvas 
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="absolute inset-0 w-full h-full object-cover" 
        />
      </div>

      <ControlPanel 
        config={config} 
        setConfig={setConfig} 
        wordList={wordList}
        setWordList={setWordList}
        isConnected={isConnected}
        toggleConnection={isConnected ? stopStream : startStream}
        audioLevel={audioLevel}
        isFaceDetected={isFaceDetected}
        mouthOpenness={uiMouthOpenness}
      />
    </div>
  );
};

export default App;
