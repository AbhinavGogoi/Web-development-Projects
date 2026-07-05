import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Atmospheric Cloud Band (watercolor-style, like the reference) ───────────
// Instead of cartoon puffs, these are wide, soft gradient blurs that
// create a dreamy sky effect — matching the Bloom reference image.
const CloudBand = ({ id }) => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
            <filter id={`cloud-blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
            </filter>
            <radialGradient id={`cloud-grad-${id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                <stop offset="40%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
        </defs>
    </svg>
);

// ─── Paper Plane SVG (bigger, more detailed) ─────────────────────────────────
const PaperPlane = ({ x, y, rotation }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        {/* Drop shadow */}
        <ellipse cx="0" cy="12" rx="32" ry="8" fill="rgba(15,23,42,0.12)" />
        {/* Main plane body */}
        <polygon
            points="-42,15 42,0 -42,-15 -24,0"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1"
            strokeLinejoin="round"
        />
        {/* Wing fold crease */}
        <line x1="-40" y1="0" x2="42" y2="0" stroke="#334155" strokeWidth="0.8" />
        {/* Top wing — lighter highlight */}
        <polygon
            points="-40,0 42,0 -40,-12"
            fill="#334155"
        />
        {/* Bottom wing — darker shadow */}
        <polygon
            points="-40,0 42,0 -40,12"
            fill="#0f172a"
        />
        {/* Nose tip accent */}
        <polygon
            points="30,0 42,0 30,-3"
            fill="#475569"
        />
    </g>
);

// ─── Smoke Trail Particle ────────────────────────────────────────────────────
const SmokeParticle = ({ cx, cy, r, opacity }) => (
    <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="white"
        opacity={opacity}
        style={{ filter: 'blur(3px)' }}
    />
);

// ─── Atmospheric cloud data — wide, soft bands at various heights ────────────
// These mimic the reference: large diffused white/translucent cloud layers
const CLOUDS = [
    // Top layer — bright, prominent clouds
    { top: '2%',  width: 750, height: 280, opacity: 0.85, layer: 'cloud-layer-1', delay: '0s' },
    { top: '5%',  width: 600, height: 240, opacity: 0.70, layer: 'cloud-layer-2', delay: '-20s' },
    { top: '12%', width: 850, height: 300, opacity: 0.65, layer: 'cloud-layer-3', delay: '-10s' },
    // Mid-upper
    { top: '22%', width: 700, height: 220, opacity: 0.55, layer: 'cloud-layer-4', delay: '-30s' },
    { top: '32%', width: 800, height: 260, opacity: 0.50, layer: 'cloud-layer-5', delay: '-5s' },
    // Mid
    { top: '45%', width: 600, height: 200, opacity: 0.45, layer: 'cloud-layer-6', delay: '-25s' },
    { top: '55%', width: 720, height: 240, opacity: 0.50, layer: 'cloud-layer-1', delay: '-35s' },
    // Lower — thick and bright
    { top: '66%', width: 850, height: 280, opacity: 0.60, layer: 'cloud-layer-2', delay: '-15s' },
    { top: '76%', width: 750, height: 260, opacity: 0.65, layer: 'cloud-layer-3', delay: '-40s' },
    { top: '86%', width: 680, height: 230, opacity: 0.55, layer: 'cloud-layer-5', delay: '-8s' },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const PaperPlaneBackground = () => {
    const pathRef = useRef(null);
    const trailRef = useRef([]);
    const rafRef = useRef(null);
    const [planeState, setPlaneState] = useState({ x: 0, y: 0, rotation: 0 });
    const [trail, setTrail] = useState([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Track page dimensions — uses ResizeObserver on <body> so path auto-extends
    // when new sections are added below (e.g., Testimonials, Footer, etc.)
    useEffect(() => {
        const updateSize = () => {
            setDimensions({
                width: window.innerWidth,
                height: document.documentElement.scrollHeight
            });
        };
        updateSize();

        // Window resize
        window.addEventListener('resize', updateSize);

        // Body resize (catches new sections being added/removed)
        let observer;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(updateSize);
            observer.observe(document.body);
        }

        // Also re-measure after images/fonts finish loading
        const timer = setTimeout(updateSize, 1500);

        return () => {
            window.removeEventListener('resize', updateSize);
            if (observer) observer.disconnect();
            clearTimeout(timer);
        };
    }, []);

    // Build the flight path — generates S-curves proportional to page height.
    // Uses a loop so adding more page content = more curves, not a fixed set.
    const getFlightPath = useCallback(() => {
        const w = dimensions.width;
        const h = dimensions.height;
        if (w === 0 || h === 0) return '';

        // Generate a series of S-curve segments that tile down the page.
        // Each segment covers roughly one viewport height of vertical space.
        const viewportH = window.innerHeight || 900;
        const segmentCount = Math.max(3, Math.ceil(h / viewportH));
        const segH = h / segmentCount;

        let path = `M ${w * 0.1} ${h * 0.01}`;

        for (let i = 0; i < segmentCount; i++) {
            const yStart = i * segH;
            const yEnd = (i + 1) * segH;
            const yMid = (yStart + yEnd) / 2;

            if (i % 2 === 0) {
                // Curve right
                path += ` C ${w * 0.85} ${yStart + segH * 0.3}, ${w * 0.9} ${yMid}, ${w * 0.78} ${yEnd}`;
            } else {
                // Curve left
                path += ` C ${w * 0.15} ${yStart + segH * 0.3}, ${w * 0.1} ${yMid}, ${w * 0.22} ${yEnd}`;
            }
        }

        return path;
    }, [dimensions]);

    // Scroll-driven animation loop
    useEffect(() => {
        const path = pathRef.current;
        if (!path || dimensions.width === 0) return;

        const TRAIL_LENGTH = 35;
        let lastX = 0;
        let lastY = 0;

        const updatePlane = () => {
            const scrollY = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

            const totalLength = path.getTotalLength();
            const point = path.getPointAtLength(progress * totalLength);

            // Calculate rotation from tangent (small delta ahead)
            const delta = Math.min(3, totalLength * 0.002);
            const nextPoint = path.getPointAtLength(
                Math.min(progress * totalLength + delta, totalLength)
            );
            const angle = Math.atan2(
                nextPoint.y - point.y,
                nextPoint.x - point.x
            ) * (180 / Math.PI);

            // Viewport-relative coords: subtract scrollY since SVG is fixed
            const viewX = point.x;
            const viewY = point.y - scrollY;

            setPlaneState({ x: viewX, y: viewY, rotation: angle });

            // Only add trail point if plane has moved enough
            const dx = point.x - lastX;
            const dy = point.y - lastY;
            if (dx * dx + dy * dy > 20) {
                lastX = point.x;
                lastY = point.y;
                trailRef.current = [
                    { x: viewX, y: viewY, id: Date.now() },
                    ...trailRef.current.slice(0, TRAIL_LENGTH - 1)
                ];
            }

            // Update trail positions — older particles drift slightly for natural smoke
            const updatedTrail = trailRef.current.map((tp, idx) => ({
                ...tp,
                y: tp.y + idx * 0.4
            }));
            setTrail(updatedTrail);

            rafRef.current = requestAnimationFrame(updatePlane);
        };

        rafRef.current = requestAnimationFrame(updatePlane);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [dimensions]);

    const flightPath = getFlightPath();

    if (dimensions.width === 0 || !flightPath) return null;

    return (
        <>
            {/* SVG defs for cloud blur filters */}
            {CLOUDS.map((_, i) => (
                <CloudBand key={`def-${i}`} id={i} />
            ))}

            {/* === LAYER 1: Atmospheric Cloud Bands (watercolor-style) === */}
            <div
                className="fixed inset-0 overflow-hidden pointer-events-none"
                style={{ zIndex: 0 }}
                aria-hidden="true"
            >
                {CLOUDS.map((cloud, i) => (
                    <div
                        key={i}
                        className={`absolute ${cloud.layer}`}
                        style={{
                            top: cloud.top,
                            width: cloud.width,
                            height: cloud.height,
                            animationDelay: cloud.delay,
                        }}
                    >
                        {/* Soft radial gradient blob — creates the atmospheric look */}
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                background: `radial-gradient(ellipse at center, rgba(255,255,255,${cloud.opacity}) 0%, rgba(255,255,255,${cloud.opacity}) 30%, rgba(255,255,255,${cloud.opacity * 0.6}) 55%, transparent 75%)`,
                                filter: 'blur(18px)',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Hidden SVG for path calculations (full-document coordinates) */}
            <svg
                style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
                aria-hidden="true"
            >
                <path
                    ref={pathRef}
                    d={flightPath}
                    fill="none"
                    stroke="none"
                />
            </svg>

            {/* === LAYER 2: Visible Plane + Smoke Trail (viewport coords) === */}
            <svg
                className="fixed inset-0 pointer-events-none"
                style={{ zIndex: 20, width: '100vw', height: '100vh' }}
                viewBox={`0 0 ${dimensions.width} ${window.innerHeight}`}
                preserveAspectRatio="none"
                aria-hidden="true"
            >

                {/* Smoke trail particles */}
                {trail.map((point, i) => {
                    const progress = i / trail.length;
                    const opacity = 0.5 * (1 - progress);
                    const radius = 5 + 10 * progress;
                    return (
                        <SmokeParticle
                            key={`trail-${i}`}
                            cx={point.x}
                            cy={point.y}
                            r={radius}
                            opacity={opacity}
                        />
                    );
                })}

                {/* Paper plane */}
                <PaperPlane
                    x={planeState.x}
                    y={planeState.y}
                    rotation={planeState.rotation}
                />
            </svg>
        </>
    );
};

export default PaperPlaneBackground;
