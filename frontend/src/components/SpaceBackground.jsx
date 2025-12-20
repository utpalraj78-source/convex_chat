import React, { useEffect, useRef } from 'react';

const SpaceBackground = ({ themeMode }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const starColor = themeMode === 'light' ? '99, 102, 241' : '255, 255, 255';
        const astColor = themeMode === 'light' ? '79, 70, 229' : '139, 92, 246';

        let stars = [];
        let asteroids = [];
        const starCount = 200;
        const asteroidCount = 3;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.8,
                    opacity: Math.random(),
                    speed: Math.random() * 0.05 + 0.02,
                });
            }
        };

        const createAsteroid = () => {
            const size = Math.random() * 15 + 10;
            return {
                x: Math.random() * canvas.width,
                y: -50,
                size,
                speedX: (Math.random() - 0.5) * 2 + 1,
                speedY: Math.random() * 3 + 2,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                points: Array.from({ length: 6 }, () => Math.random() * 0.5 + 0.5),
            };
        };

        const drawAsteroid = (ast) => {
            ctx.save();
            ctx.translate(ast.x, ast.y);
            ctx.rotate(ast.rotation);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${astColor}, 0.4)`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const r = ast.size * ast.points[i];
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            // Trail
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-ast.speedX * 10, -ast.speedY * 10);
            ctx.strokeStyle = `rgba(${astColor}, 0.1)`;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Stars
            stars.forEach(star => {
                ctx.fillStyle = `rgba(${starColor}, ${star.opacity})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                star.y += star.speed;
                if (star.y > canvas.height) star.y = 0;

                star.opacity += (Math.random() - 0.5) * 0.05;
                if (star.opacity < 0.1) star.opacity = 0.1;
                if (star.opacity > 1) star.opacity = 1;
            });

            // Draw Asteroids
            if (Math.random() < 0.005 && asteroids.length < asteroidCount) {
                asteroids.push(createAsteroid());
            }

            asteroids.forEach((ast, index) => {
                drawAsteroid(ast);
                ast.x += ast.speedX;
                ast.y += ast.speedY;
                ast.rotation += ast.rotationSpeed;

                if (ast.y > canvas.height + 100 || ast.x > canvas.width + 100) {
                    asteroids.splice(index, 1);
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [themeMode]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -1,
                opacity: themeMode === 'light' ? 0.4 : 0.8,
            }}
        />
    );
};

export default SpaceBackground;
