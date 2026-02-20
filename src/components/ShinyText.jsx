import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';

const ShinyText = ({
    text,
    disabled = false,
    speed = 3,
    className = '',
    color = '#e6e9f5',
    shineColor = '#ffffff',
    spread = 90,
    yoyo = false,
    pauseOnHover = false,
    direction = 'left',
    delay = 0
}) => {
    const [isPaused, setIsPaused] = useState(false);
    const progress = useMotionValue(0);
    const elapsedRef = useRef(0);
    const lastTimeRef = useRef(null);
    const directionRef = useRef(direction === 'left' ? 1 : -1);

    const animationDuration = speed * 1000;
    const delayDuration = delay * 1000;

    useAnimationFrame(time => {
        if (disabled || isPaused) {
            lastTimeRef.current = null;
            return;
        }
        if (lastTimeRef.current === null) {
            lastTimeRef.current = time;
            return;
        }
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;
        elapsedRef.current += deltaTime;

        const cycleDuration = animationDuration + delayDuration;
        const cycleTime = elapsedRef.current % cycleDuration;
        if (cycleTime < animationDuration) {
            const p = (cycleTime / animationDuration) * 100;
            progress.set(directionRef.current === 1 ? p : 100 - p);
        } else {
            progress.set(directionRef.current === 1 ? 100 : 0);
        }
    });

    useEffect(() => {
        directionRef.current = direction === 'left' ? 1 : -1;
        elapsedRef.current = 0;
        progress.set(0);
    }, [direction]);

    const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

    const handleMouseEnter = useCallback(() => {
        if (pauseOnHover) setIsPaused(true);
    }, [pauseOnHover]);

    const handleMouseLeave = useCallback(() => {
        if (pauseOnHover) setIsPaused(false);
    }, [pauseOnHover]);

    const gradientStyle = {
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
    };

    return (
        <motion.span
            className={className}
            style={{ ...gradientStyle, backgroundPosition }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {text}
        </motion.span>
    );
};

export default ShinyText;
