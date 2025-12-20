import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor = () => {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const canvasRef = useRef(null);
    const particles = useRef([]);

    const springConfig = { damping: 25, stiffness: 400 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            cursorX.set(e.clientX - 10);
            cursorY.set(e.clientY - 10);

            // Generate particles
            for (let i = 0; i < 3; i++) {
                particles.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3 + 1,
                    life: 1,
                });
            }
        };

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let aniFrame;

        const animate = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    return;
                }
                ctx.fillStyle = `rgba(99, 102, 241, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            aniFrame = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', moveCursor);
        animate();

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            cancelAnimationFrame(aniFrame);
        };
    }, [cursorX, cursorY]);

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 9998,
                    opacity: 0.5
                }}
            />
            <motion.div
                style={{
                    translateX: cursorXSpring,
                    translateY: cursorYSpring,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    mixBlendMode: 'screen',
                    boxShadow: '0 0 20px var(--primary), 0 0 40px var(--primary)',
                    opacity: 0.8,
                }}
            />
        </>
    );
};

export default CustomCursor;
