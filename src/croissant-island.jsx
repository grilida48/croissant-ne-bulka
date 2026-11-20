import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

const segments = [
  { x: -112, y: 28, z: -2, r: -34, s: .58 },
  { x: -82, y: 8, z: 10, r: -24, s: .76 },
  { x: -45, y: -5, z: 22, r: -12, s: .94 },
  { x: 0, y: -10, z: 30, r: 0, s: 1.06 },
  { x: 45, y: -5, z: 22, r: 12, s: .94 },
  { x: 82, y: 8, z: 10, r: 24, s: .76 },
  { x: 112, y: 28, z: -2, r: 34, s: .58 },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function CroissantIsland() {
  const prefersReducedMotion = useReducedMotion();
  const rotateX = useMotionValue(-12);
  const rotateY = useMotionValue(-18);
  const springConfig = prefersReducedMotion
    ? { stiffness: 1000, damping: 1000, mass: .01 }
    : { stiffness: 170, damping: 24, mass: .65 };
  const smoothX = useSpring(rotateX, springConfig);
  const smoothY = useSpring(rotateY, springConfig);
  const displayedX = prefersReducedMotion ? rotateX : smoothX;
  const displayedY = prefersReducedMotion ? rotateY : smoothY;
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('Исходный ракурс');

  const rotateBy = (x, y, message) => {
    rotateX.set(clamp(rotateX.get() + x, -40, 40));
    rotateY.set(rotateY.get() + y);
    setStatus(message);
  };

  const reset = () => {
    rotateX.set(-12);
    rotateY.set(-18);
    setStatus('Исходный ракурс восстановлен');
  };

  const handleKeyDown = (event) => {
    const actions = {
      ArrowLeft: () => rotateBy(0, -14, 'Круассан повёрнут влево'),
      ArrowRight: () => rotateBy(0, 14, 'Круассан повёрнут вправо'),
      ArrowUp: () => rotateBy(-10, 0, 'Круассан наклонён вверх'),
      ArrowDown: () => rotateBy(10, 0, 'Круассан наклонён вниз'),
      Home: reset,
    };

    if (!actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
  };

  return (
    <div className="croissant-viewer">
      <motion.div
        className="croissant-stage"
        data-dragging={isDragging || undefined}
        tabIndex={0}
        role="group"
        aria-label="Интерактивная объёмная модель круассана. Перетаскивайте или используйте клавиши со стрелками."
        aria-describedby="croissant-controls-help"
        onKeyDown={handleKeyDown}
        onPanStart={() => setIsDragging(true)}
        onPan={(_, info) => {
          rotateY.set(rotateY.get() + info.delta.x * .45);
        }}
        onPanEnd={() => setIsDragging(false)}
      >
        <motion.div
          className="croissant-object"
          aria-hidden="true"
          style={{ rotateX: displayedX, rotateY: displayedY }}
        >
          {segments.map((segment, index) => (
            <span
              className="croissant-segment"
              key={index}
              style={{
                '--segment-x': `${segment.x}px`,
                '--segment-y': `${segment.y}px`,
                '--segment-z': `${segment.z}px`,
                '--segment-r': `${segment.r}deg`,
                '--segment-s': segment.s,
              }}
            />
          ))}
        </motion.div>
        <span className="croissant-shadow" aria-hidden="true" />
      </motion.div>
      <p className="croissant-help" id="croissant-controls-help">Зажмите и потяните</p>
      <div className="croissant-controls" role="group" aria-label="Управление моделью">
        <button className="button" type="button" onClick={() => rotateBy(0, -24, 'Круассан повёрнут влево')}>Влево</button>
        <button className="button" type="button" onClick={reset}>Сбросить</button>
        <button className="button" type="button" onClick={() => rotateBy(0, 24, 'Круассан повёрнут вправо')}>Вправо</button>
      </div>
      <p className="sr-only" aria-live="polite">{status}</p>
    </div>
  );
}

const rootElement = document.querySelector('#croissant-3d-root');

if (rootElement) {
  createRoot(rootElement).render(<CroissantIsland />);
}
