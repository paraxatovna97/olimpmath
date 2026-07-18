(function() {
    'use strict';

    /**
     * OlympMath — Animation Helpers
     * Premium motion utilities for the Knowledge Map
     */

    // ─── EASING FUNCTIONS ───
    const Easing = {
        // Smooth spring-like ease
        spring: (t) => 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.3),

        // Exponential ease out
        easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

        // Cubic ease in-out
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

        // Elastic ease (for spring-like effects)
        elastic: (t) => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 :
                -Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
    };

    // ─── ANIMATION UTILITIES ───
    const Animation = {

        /**
         * Animate a value from start to end over duration
         * @param {number} start - Starting value
         * @param {number} end - Ending value
         * @param {number} duration - Duration in ms
         * @param {Function} callback - Called with current value
         * @param {string} easing - Easing name or function
         * @returns {Function} Cancel function
         */
        animate: (start, end, duration, callback, easing = 'easeOutExpo') => {
            const startTime = performance.now();
            const easingFn = typeof easing === 'function' ? easing : Easing[easing] || Easing.easeOutExpo;

            let active = true;

            const step = (now) => {
                if (!active) return;

                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFn(progress);
                const currentValue = start + (end - start) * easedProgress;

                callback(currentValue, progress);

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };

            requestAnimationFrame(step);

            return () => { active = false; };
        },

        /**
         * Staggered animation for arrays
         * @param {Array} items - Items to animate
         * @param {Function} setup - Called for each item with (item, index)
         * @param {Function} animate - Called for each item with (item, index, progress)
         * @param {number} staggerMs - Delay between each item
         * @param {number} durationMs - Duration per item
         * @param {string} easing - Easing name
         * @returns {Promise} Resolves when all animations complete
         */
        stagger: (items, setup, animate, staggerMs = 60, durationMs = 400, easing = 'easeOutExpo') => {
            const easingFn = typeof easing === 'function' ? easing : Easing[easing] || Easing.easeOutExpo;

            return new Promise((resolve) => {
                let completed = 0;
                const total = items.length;

                // Setup each item
                items.forEach((item, i) => {
                    setup(item, i);
                });

                // Animate each item with stagger
                items.forEach((item, i) => {
                    const delay = i * staggerMs;
                    const startTime = performance.now() + delay;

                    const step = (now) => {
                        if (now < startTime) {
                            requestAnimationFrame(step);
                            return;
                        }

                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / durationMs, 1);
                        const easedProgress = easingFn(progress);

                        animate(item, i, easedProgress);

                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else {
                            completed++;
                            if (completed === total) {
                                resolve();
                            }
                        }
                    };

                    requestAnimationFrame(step);
                });
            });
        },

        /**
         * Smoothly interpolate between two values
         */
        lerp: (a, b, t) => a + (b - a) * t,

        /**
         * Clamp a value between min and max
         */
        clamp: (value, min, max) => Math.max(min, Math.min(max, value)),

        /**
         * Map a value from one range to another
         */
        map: (value, inMin, inMax, outMin, outMax) => {
            return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
        }
    };

    // ─── PREMIUM MICRO-ANIMATIONS ───

    /**
     * Creates a breathing glow animation for canvas elements
     * @param {Object} ctx - Canvas context
     * @param {Object} options - Configuration
     * @returns {Function} Update function to call each frame
     */
    function createBreathingGlow(ctx, options) {
        const {
            x,
            y,
            radius,
            color = 'rgba(79, 70, 229, 0.3)',
            minIntensity = 0.2,
            maxIntensity = 0.8,
            speed = 0.002,
            phase = 0
        } = options;

        let time = 0;

        return function update(timestamp) {
            time = timestamp || performance.now();
            const breath = 0.5 + 0.5 * Math.sin(time * speed + phase);
            const intensity = minIntensity + (maxIntensity - minIntensity) * breath;

            const glowR = radius * (1 + 0.4 * intensity);
            const grad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, glowR);
            grad.addColorStop(0, color.replace(/[\d.]+\)$/, `${intensity * 0.5})`));
            grad.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${intensity * 0.2})`));
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, glowR, 0, Math.PI * 2);
            ctx.fill();

            return intensity;
        };
    }

    // ─── EXPOSE ───
    window.OlympMathAnimations = {
        Easing,
        Animation,
        createBreathingGlow
    };

})();
