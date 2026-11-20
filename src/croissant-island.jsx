import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ACESFilmicToneMapping, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, WebGLRenderer,
} from 'three';
import { createCroissant } from './croissant-mesh.js';

const initialView = { pitch: .32, yaw: -.29, zoom: 1 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function CroissantIsland() {
  const stage = useRef(null);
  const view = useRef({ ...initialView });
  const repaint = useRef(() => {});
  const pointer = useRef(null);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const viewport = stage.current;
    let renderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, .1, 45);
    const model = createCroissant();
    const key = new DirectionalLight(0xffe7cc, 2.55);
    key.position.set(-3, 5, 4);
    const rim = new DirectionalLight(0xffd8af, 1.45);
    rim.position.set(3, 2, -5);
    scene.add(model, key, rim, new HemisphereLight(0xfff8ec, 0xb58e73, 1.9));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    viewport.prepend(renderer.domElement);

    function draw() {
      const { pitch, yaw, zoom } = view.current;
      model.rotation.set(pitch, yaw, 0, 'YXZ');
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    function resize() {
      const { clientWidth: width, clientHeight: height } = viewport;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.position.set(0, 2.5, 7.4 * Math.max(1, 1.22 / camera.aspect));
      camera.lookAt(0, 0, 0);
      renderer.setSize(width, height, false);
      draw();
    }

    const lost = (event) => {
      event.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    repaint.current = draw;
    resize();

    return () => {
      observer.disconnect();
      repaint.current = () => {};
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      renderer.domElement.remove();
      renderer.dispose();
      model.geometry.dispose();
      model.material.dispose();
    };
  }, []);

  function rotate(yaw, pitch) {
    view.current.yaw = (view.current.yaw + yaw) % (2 * Math.PI);
    view.current.pitch = (view.current.pitch + pitch) % (2 * Math.PI);
    repaint.current();
  }

  function zoom(delta) {
    view.current.zoom = clamp(view.current.zoom + delta, .8, 1.45);
    repaint.current();
    setStatus(`Масштаб: ${Math.round(view.current.zoom * 100)} %`);
  }

  function reset() {
    view.current = { ...initialView };
    repaint.current();
    setStatus('Исходный ракурс восстановлен');
  }

  function onKeyDown(event) {
    const action = {
      ArrowLeft: () => rotate(-.3, 0), ArrowRight: () => rotate(.3, 0),
      ArrowUp: () => rotate(0, -.3), ArrowDown: () => rotate(0, .3),
      '+': () => zoom(.15), '-': () => zoom(-.15), Home: reset,
    }[event.key];
    if (typeof action !== 'function') return;
    event.preventDefault();
    action();
  }

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.dataset.dragging = '';
  }

  function moveDrag(event) {
    const previous = pointer.current;
    if (previous?.id !== event.pointerId) return;
    rotate((event.clientX - previous.x) * .012, (event.clientY - previous.y) * .012);
    previous.x = event.clientX;
    previous.y = event.clientY;
  }

  function stopDrag(event) {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    delete event.currentTarget.dataset.dragging;
  }

  return (
    <div className="croissant-viewer">
      <div
        className="croissant-stage"
        ref={stage}
        tabIndex={failed ? undefined : 0}
        role="group"
        aria-label="Трёхмерная модель круассана"
        aria-describedby="croissant-controls-help"
        onKeyDown={failed ? undefined : onKeyDown}
        onPointerDown={failed ? undefined : startDrag}
        onPointerMove={moveDrag}
        onLostPointerCapture={stopDrag}
        data-unavailable={failed || undefined}
      >
        {failed && <img src="assets/pastry-hero.jpg" alt="Слоёная выпечка на сервировочной доске" />}
      </div>
      <p className="croissant-help" id="croissant-controls-help">
        {failed ? 'На этом устройстве 3D недоступно.' : 'Потяните модель или используйте клавиши со стрелками.'}
      </p>
      {!failed && <div className="croissant-controls" role="group" aria-label="Управление моделью">
        <button className="button" type="button" onClick={() => rotate(-.4, 0)}>Влево</button>
        <button className="button" type="button" onClick={() => rotate(.4, 0)}>Вправо</button>
        <button className="button" type="button" aria-label="Уменьшить" onClick={() => zoom(-.15)}>−</button>
        <button className="button" type="button" aria-label="Приблизить" onClick={() => zoom(.15)}>+</button>
        <button className="button" type="button" onClick={reset}>Сбросить</button>
      </div>}
      <p className="sr-only" role="status">{status}</p>
    </div>
  );
}

const rootElement = document.querySelector('#croissant-3d-root');
if (rootElement) {
  createRoot(rootElement).render(<CroissantIsland />);
}
