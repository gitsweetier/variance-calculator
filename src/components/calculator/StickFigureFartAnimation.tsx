'use client';

import { useEffect, useState, useRef } from 'react';

interface StickFigure {
  id: number;
  x: number;
  y: number;
  direction: number;
  speed: number;
  isFarting: boolean;
  reactionState: 'normal' | 'screaming' | 'laughing';
  reactionTimer: number;
  walkCycle: number;
  location: 'sidewalk' | 'street';
  color: string;
}

interface Car {
  id: number;
  x: number;
  y: number;
  speed: number;
  direction: number;
  color: string;
  isTaxi: boolean;
  isBus: boolean;
}

interface Airplane {
  id: number;
  x: number;
  y: number;
  speed: number;
  direction: number;
  size: number;
}

interface Helicopter {
  id: number;
  x: number;
  y: number;
  speed: number;
  direction: number;
  size: number;
  rotorAngle: number;
}

interface Skydiver {
  id: number;
  x: number;
  y: number;
  speedY: number;
  color: string;
  isFarting: boolean;
  reactionTimer: number;
  isLanded: boolean;
  landedTimer: number;
}

export function StickFigureFartAnimation() {
  const [figures, setFigures] = useState<StickFigure[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [airplanes, setAirplanes] = useState<Airplane[]>([]);
  const [helicopters, setHelicopters] = useState<Helicopter[]>([]);
  const [skydivers, setSkydivers] = useState<Skydiver[]>([]);
  const [trafficLight, setTrafficLight] = useState<'red' | 'yellow' | 'green'>('green');
  
  const figuresRef = useRef<StickFigure[]>([]);
  const carsRef = useRef<Car[]>([]);
  const airplanesRef = useRef<Airplane[]>([]);
  const helicoptersRef = useRef<Helicopter[]>([]);
  const skydiversRef = useRef<Skydiver[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastFartTimeRef = useRef<number>(Date.now());
  const nextFartDelayRef = useRef<number>(1500 + Math.random() * 2000); // More frequent farts
  const lastLightChangeRef = useRef<number>(Date.now());
  const skydiverIdCounter = useRef<number>(0);

  useEffect(() => {
    // Initialize figures
    const initialFigures: StickFigure[] = Array.from({ length: 18 }, (_, i) => {
      const onSidewalk = i < 12;
      return {
        id: i,
        x: Math.random() * 800,
        y: onSidewalk ? 305 : 355 + Math.random() * 100,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 0.5 + Math.random() * 0.7,
        isFarting: false,
        reactionState: 'normal',
        reactionTimer: 0,
        walkCycle: Math.random() * Math.PI * 2,
        location: onSidewalk ? 'sidewalk' : 'street',
        color: `hsl(${Math.random() * 360}, 50%, 20%)`,
      };
    });

    // Initialize cars
    const carColors = ['#FF4444', '#4444FF', '#44FF44', '#FFAA00', '#FF44FF', '#44FFFF'];
    const initialCars: Car[] = Array.from({ length: 8 }, (_, i) => {
      const lane = i % 2;
      return {
        id: i,
        x: (i * 120) % 800,
        y: lane === 0 ? 390 : 460,
        speed: 2.5 + Math.random() * 1.5,
        direction: lane === 0 ? 1 : -1,
        color: carColors[i % carColors.length],
        isTaxi: i === 2 || i === 6,
        isBus: i === 4,
      };
    });

    // Initialize airplanes
    const initialAirplanes: Airplane[] = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      x: Math.random() * 800,
      y: 30 + Math.random() * 60,
      speed: 0.8 + Math.random() * 1.2,
      direction: Math.random() > 0.5 ? 1 : -1,
      size: 0.5 + Math.random() * 0.5,
    }));

    // Initialize helicopters
    const initialHelicopters: Helicopter[] = Array.from({ length: 2 }, (_, i) => ({
      id: i,
      x: Math.random() * 800,
      y: 100 + Math.random() * 50,
      speed: 1.2 + Math.random() * 0.8,
      direction: Math.random() > 0.5 ? 1 : -1,
      size: 0.6 + Math.random() * 0.4,
      rotorAngle: 0,
    }));

    figuresRef.current = initialFigures;
    carsRef.current = initialCars;
    airplanesRef.current = initialAirplanes;
    helicoptersRef.current = initialHelicopters;
    skydiversRef.current = [];
    setFigures(initialFigures);
    setCars(initialCars);
    setAirplanes(initialAirplanes);
    setHelicopters(initialHelicopters);
    setSkydivers([]);

    const animate = () => {
      const now = Date.now();

      // Update Traffic Light
      if (now - lastLightChangeRef.current > 5000) {
        setTrafficLight(prev => (prev === 'green' ? 'yellow' : prev === 'yellow' ? 'red' : 'green'));
        lastLightChangeRef.current = now;
      }

      // Random Farting Logic
      if (now - lastFartTimeRef.current > nextFartDelayRef.current) {
        const randomIndex = Math.floor(Math.random() * figuresRef.current.length);
        const farter = figuresRef.current[randomIndex];
        if (!farter.isFarting) {
          farter.isFarting = true;
          farter.reactionTimer = 0;
          figuresRef.current.forEach((fig) => {
            if (fig.id !== farter.id && fig.location === farter.location && Math.abs(fig.x - farter.x) < 120) {
              fig.reactionState = Math.random() > 0.5 ? 'screaming' : 'laughing';
              fig.reactionTimer = 0;
            }
          });
          lastFartTimeRef.current = now;
          nextFartDelayRef.current = 1500 + Math.random() * 2000; // More frequent farts
        }
      }

      // Update Figures
      figuresRef.current.forEach(fig => {
        const moveMult = fig.isFarting ? 0 : fig.reactionState === 'normal' ? 1 : 0.3;
        fig.x += fig.direction * fig.speed * moveMult;
        fig.walkCycle += 0.4 * moveMult;
        if (fig.x > 850) fig.x = -50;
        if (fig.x < -50) fig.x = 850;

        if (fig.isFarting) {
          fig.reactionTimer += 16;
          if (fig.reactionTimer > 2500) {
            fig.isFarting = false;
            fig.reactionTimer = 0;
          }
        } else if (fig.reactionState !== 'normal') {
          fig.reactionTimer += 16;
          if (fig.reactionTimer > 3000) {
            fig.reactionState = 'normal';
            fig.reactionTimer = 0;
          }
        }
      });

      // Update Cars
      carsRef.current.forEach(car => {
        const canMove = trafficLight === 'green' || (trafficLight === 'yellow' && Math.random() > 0.2);
        if (canMove) {
          car.x += car.direction * car.speed;
        }
        if (car.x > 900) car.x = -100;
        if (car.x < -100) car.x = 900;
      });

      // Update Airplanes
      airplanesRef.current.forEach(plane => {
        plane.x += plane.direction * plane.speed;
        if (plane.x > 1000) plane.x = -200;
        if (plane.x < -200) plane.x = 1000;
      });

      // Update Helicopters
      helicoptersRef.current.forEach(h => {
        h.x += h.direction * h.speed;
        h.rotorAngle = (h.rotorAngle + 20) % 360;
        if (h.x > 1000) h.x = -200;
        if (h.x < -200) h.x = 1000;

        // Drop a skydiver occasionally
        if (Math.random() < 0.005) {
          skydiversRef.current.push({
            id: skydiverIdCounter.current++,
            x: h.x,
            y: h.y + 20,
            speedY: 2 + Math.random() * 3, // Faster fall
            color: `hsl(${Math.random() * 360}, 70%, 40%)`,
            isFarting: true, // Always farting
            reactionTimer: 0,
            isLanded: false,
            landedTimer: 0,
          });
        }
      });

      // Update Skydivers
      skydiversRef.current = skydiversRef.current.filter(s => {
        if (!s.isLanded) {
          s.y += s.speedY;
          s.reactionTimer = (s.reactionTimer + 16) % 2500;
          
          // Check for landing
          const finalGroundY = 300 + (s.id % 2 === 0 ? 5 : 100); 
          if (s.y >= finalGroundY) {
            s.y = finalGroundY;
            s.isLanded = true;
            s.isFarting = false;
          }
        } else {
          s.landedTimer += 16;
        }
        
        return s.landedTimer < 5000; // Keep on ground for 5 seconds
      });

      setFigures([...figuresRef.current]);
      setCars([...carsRef.current]);
      setAirplanes([...airplanesRef.current]);
      setHelicopters([...helicoptersRef.current]);
      setSkydivers([...skydiversRef.current]);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current!);
  }, [trafficLight]);

  const renderStickFigure = (fig: StickFigure) => {
    const { x, y, isFarting, reactionState, direction, walkCycle, color } = fig;
    const walkPhase = walkCycle % (Math.PI * 2);
    const leftLegForward = Math.sin(walkPhase) > 0;
    const shake = reactionState === 'laughing' ? Math.sin(Date.now() / 50) * 3 : 0;
    const flip = (v: number) => direction === -1 ? -v : v;

    return (
      <g key={fig.id} transform={`translate(${x + shake}, ${y})`}>
        {isFarting && (
          <g opacity={Math.sin((fig.reactionTimer / 2500) * Math.PI)}>
            {/* Larger, more obvious green gas cloud */}
            <ellipse cx={flip(-15)} cy="-5" rx="30" ry="18" fill="#4ade80" opacity="0.7" />
            <circle cx={flip(-30)} cy="-10" r="12" fill="#22c55e" opacity="0.5" />
            <circle cx={flip(-10)} cy="5" r="10" fill="#16a34a" opacity="0.4" />
            {/* Stink lines */}
            <path d={`M ${flip(-20)} -15 Q ${flip(-25)} -25 ${flip(-20)} -35`} stroke="#166534" fill="none" strokeWidth="2" opacity="0.6" />
            <path d={`M ${flip(-10)} -12 Q ${flip(-12)} -22 ${flip(-8)} -32`} stroke="#166534" fill="none" strokeWidth="2" opacity="0.6" />
          </g>
        )}
        
        {/* Reaction icons */}
        {reactionState === 'screaming' && (
          <g transform="translate(0, -50)">
            <text x="5" y="0" fontSize="24" fontWeight="bold" fill="red" style={{ userSelect: 'none' }}>!</text>
            <text x="-15" y="-5" fontSize="20" fontWeight="bold" fill="red" style={{ userSelect: 'none' }}>?!</text>
          </g>
        )}
        {reactionState === 'laughing' && (
          <g transform="translate(10, -50)">
            <text x="0" y="0" fontSize="16" fontWeight="bold" fill="#f59e0b" style={{ userSelect: 'none' }}>HA HA!</text>
          </g>
        )}

        {/* Head */}
        <circle cx="0" cy="-30" r="8" fill="white" stroke={color} strokeWidth="2" />
        
        {/* Face details */}
        {isFarting ? (
          // Relieved face
          <>
            <path d="M -3 -32 L -1 -32 M 1 -32 L 3 -32" stroke={color} strokeWidth="1" />
            <path d="M -3 -27 Q 0 -24 3 -27" stroke={color} strokeWidth="1.5" fill="none" />
          </>
        ) : reactionState === 'screaming' ? (
          // Shocked face
          <>
            <circle cx="-3" cy="-33" r="1.5" fill={color} />
            <circle cx="3" cy="-33" r="1.5" fill={color} />
            <circle cx="0" cy="-27" r="3" fill="none" stroke={color} strokeWidth="1.5" />
          </>
        ) : reactionState === 'laughing' ? (
          // Laughing face
          <>
            <path d="M -4 -33 L -1 -31 M 4 -33 L 1 -31" stroke={color} strokeWidth="1.5" />
            <path d="M -4 -26 Q 0 -22 4 -26" stroke={color} strokeWidth="2" fill="none" />
          </>
        ) : (
          // Normal face
          <>
            <circle cx="-3" cy="-33" r="1" fill={color} />
            <circle cx="3" cy="-33" r="1" fill={color} />
            <path d="M -3 -27 Q 0 -25 3 -27" stroke={color} strokeWidth="1" fill="none" />
          </>
        )}

        <line x1="0" y1="-22" x2="0" y2="10" stroke={color} strokeWidth="2" />
        {reactionState === 'screaming' ? (
          <>
            <line x1="0" y1="-18" x2={flip(-15)} y2="-35" stroke={color} strokeWidth="2.5" />
            <line x1="0" y1="-18" x2={flip(15)} y2="-35" stroke={color} strokeWidth="2.5" />
          </>
        ) : (
          <>
            <line x1="0" y1="-10" x2={flip(leftLegForward ? -10 : 10)} y2="0" stroke={color} strokeWidth="2" />
            <line x1="0" y1="-10" x2={flip(leftLegForward ? 10 : -10)} y2="0" stroke={color} strokeWidth="2" />
          </>
        )}
        <line x1="0" y1="10" x2={flip(leftLegForward ? -10 : 10)} y2="25" stroke={color} strokeWidth="2" />
        <line x1="0" y1="10" x2={flip(leftLegForward ? 10 : -10)} y2="25" stroke={color} strokeWidth="2" />
      </g>
    );
  };

  return (
    <div className="block" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0f0f0' }}>
      <div className="block-title" style={{ marginBottom: '1rem' }}>City Life (Hot Tips)</div>
      <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', border: '3px solid black' }}>
        <svg width="800" height="500" viewBox="0 0 800 500" style={{ backgroundColor: '#87CEEB' }}>
          {/* Background Buildings */}
          {[0, 100, 200, 300, 400, 500, 600, 700].map((bx, i) => {
            const h = 150 + (i * 37 % 100);
            const w = 80 + (i * 13 % 40);
            return (
              <g key={`b-${i}`}>
                <rect x={bx} y={300 - h} width={w} height={h} fill="#4b5563" stroke="#1f2937" strokeWidth="2" />
                {/* Windows */}
                {Array.from({ length: Math.floor(h / 30) }).map((_, row) => (
                  Array.from({ length: Math.floor(w / 25) }).map((_, col) => (
                    <rect
                      key={`${row}-${col}`}
                      x={bx + 10 + col * 20}
                      y={300 - h + 15 + row * 25}
                      width={10}
                      height={12}
                      fill={(i + row + col) % 4 === 0 ? '#fef08a' : '#111827'}
                    />
                  ))
                ))}
              </g>
            );
          })}

          {/* Airplanes - Moved in front of buildings */}
          {airplanes.map(plane => (
            <g key={plane.id} transform={`translate(${plane.x}, ${plane.y}) scale(${plane.direction * plane.size}, ${plane.size})`}>
              {/* Plane Body */}
              <path d="M -40 0 L 40 0 L 50 -10 L 45 -15 L -30 -15 Z" fill="white" stroke="#333" strokeWidth="1" />
              {/* Wing */}
              <path d="M -10 -5 L 10 -5 L 5 -25 L -5 -25 Z" fill="#eee" stroke="#333" strokeWidth="1" />
              {/* Tail */}
              <path d="M -40 -15 L -50 -30 L -30 -30 L -25 -15 Z" fill="#eee" stroke="#333" strokeWidth="1" />
              {/* Windows */}
              <circle cx="10" cy="-8" r="2" fill="#87CEEB" />
              <circle cx="25" cy="-8" r="2" fill="#87CEEB" />
              <circle cx="40" cy="-8" r="2" fill="#87CEEB" />
            </g>
          ))}

          {/* Helicopters - Moved in front of buildings */}
          {helicopters.map(h => (
            <g key={h.id} transform={`translate(${h.x}, ${h.y}) scale(${h.direction * h.size}, ${h.size})`}>
              {/* Main Body */}
              <ellipse cx="0" cy="0" rx="30" ry="15" fill="#374151" stroke="#111" strokeWidth="2" />
              <rect x="-40" y="-5" width="20" height="5" fill="#374151" stroke="#111" strokeWidth="1" />
              {/* Tail Rotor */}
              <rect x="-45" y="-10" width="2" height="15" fill="#111" transform={`rotate(${h.rotorAngle * 2}, -44, -2.5)`} />
              {/* Main Rotor */}
              <line x1="0" y1="-15" x2="0" y2="-20" stroke="#111" strokeWidth="2" />
              <line x1="-40" y1="-20" x2="40" y2="-20" stroke="#111" strokeWidth="3" transform={`scale(${Math.sin(h.rotorAngle * 0.1)}, 1)`} />
              {/* Cockpit */}
              <path d="M 10 -10 Q 25 -10 30 0 Q 25 10 10 10 Z" fill="#87CEEB" opacity="0.6" stroke="#111" strokeWidth="1" />
              {/* Skids */}
              <line x1="-15" y1="15" x2="-15" y2="20" stroke="#111" strokeWidth="2" />
              <line x1="15" y1="15" x2="15" y2="20" stroke="#111" strokeWidth="2" />
              <line x1="-25" y1="20" x2="25" y2="20" stroke="#111" strokeWidth="2" />
            </g>
          ))}

          {/* Falling Skydivers - Moved in front of buildings */}
          {skydivers.map(s => (
            <g key={s.id} transform={`translate(${s.x}, ${s.y})`}>
              {/* Scream markers for skydiver */}
              {!s.isLanded && (
                <g transform="translate(0, -50)">
                  <text x="-15" y="0" fontSize="14" fontWeight="bold" fill="red" style={{ userSelect: 'none' }}>AAAAAAHH!!!</text>
                </g>
              )}
              {/* Fart cloud - only while falling */}
              {s.isFarting && (
                <g opacity={Math.sin((s.reactionTimer / 2500) * Math.PI)}>
                  <circle cx="0" cy="-40" r="15" fill="#4ade80" opacity="0.6" />
                  <path d="M -10 -45 Q -15 -55 -10 -65" stroke="#166534" fill="none" strokeWidth="1.5" />
                </g>
              )}
              
              {s.isLanded ? (
                // Broken bones pose
                <g transform="rotate(90) translate(-10, 0)">
                  <circle cx="0" cy="-30" r="6" fill="white" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-24" x2="0" y2="-5" stroke={s.color} strokeWidth="2" />
                  {/* Mangled limbs */}
                  <line x1="0" y1="-20" x2="-10" y2="-40" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-20" x2="20" y2="-15" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-5" x2="-15" y2="5" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-5" x2="5" y2="15" stroke={s.color} strokeWidth="2" />
                  {/* Pain markers */}
                  <text x="10" y="-35" fontSize="10" fill="red" fontWeight="bold">X_X</text>
                </g>
              ) : (
                // Stick figure falling
                <>
                  <circle cx="0" cy="-30" r="6" fill="white" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-24" x2="0" y2="-5" stroke={s.color} strokeWidth="2" />
                  {/* Flailing limbs */}
                  <line x1="0" y1="-20" x2="-15" y2="-35" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-20" x2="15" y2="-35" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-5" x2="-10" y2="10" stroke={s.color} strokeWidth="2" />
                  <line x1="0" y1="-5" x2="10" y2="10" stroke={s.color} strokeWidth="2" />
                </>
              )}
            </g>
          ))}

          <rect y="300" width="800" height="200" fill="#333" />
          <rect y="300" width="800" height="40" fill="#888" />
          <line x1="0" y1="415" x2="800" y2="415" stroke="yellow" strokeDasharray="20,20" strokeWidth="2" />
          {cars.map(car => (
            <g key={car.id} transform={`translate(${car.x}, ${car.y}) scale(${car.direction}, 1)`}>
              <rect x="-40" y="-15" width={car.isBus ? 120 : 80} height={30} fill={car.isTaxi ? 'yellow' : car.color} stroke="black" strokeWidth="2" rx="5" />
              <rect x="5" y="-10" width="20" height="15" fill="#ADD8E6" stroke="black" />
              <rect x="-25" y="-10" width="20" height="15" fill="#ADD8E6" stroke="black" />
              <circle cx="-25" cy="15" r="8" fill="black" />
              <circle cx="25" cy="15" r="8" fill="black" />
              <circle cx="35" cy="0" r="4" fill="yellow" opacity="0.8" />
            </g>
          ))}
          {figures.map(renderStickFigure)}
        </svg>
      </div>
      <p style={{ marginTop: '1rem', opacity: 0.6 }}>Busy street scene with pedestrians and traffic. Farts are purely coincidental.</p>
    </div>
  );
}
