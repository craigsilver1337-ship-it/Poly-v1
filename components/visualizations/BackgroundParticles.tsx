"use client";
import React, { useRef, useEffect } from "react";
import { Renderer, Camera, Transform, Program, Mesh, Plane, Vec2, Vec3 } from "ogl";

export default function BackgroundParticles({ className = "" }: { className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const renderer = new Renderer({ alpha: true, depth: false, dpr: Math.min(window.devicePixelRatio, 2) });
        const gl = renderer.gl;
        containerRef.current.appendChild(gl.canvas);
        gl.clearColor(0, 0, 0, 0);

        const camera = new Camera(gl, { fov: 45 });
        camera.position.set(0, 0, 20);

        const resize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const height = containerRef.current.offsetHeight;
                renderer.setSize(width, height);
                camera.perspective({ aspect: width / height });
            }
        };
        window.addEventListener("resize", resize);
        resize();

        const scene = new Transform();

        const numParticles = 3000;
        const position = new Float32Array(numParticles * 3);
        const random = new Float32Array(numParticles * 4);

        for (let i = 0; i < numParticles; i++) {
            // Spread particles
            position[i * 3] = (Math.random() - 0.5) * 40;
            position[i * 3 + 1] = (Math.random() - 0.5) * 20;
            position[i * 3 + 2] = (Math.random() - 0.5) * 20;

            random[i * 4] = Math.random();
            random[i * 4 + 1] = Math.random();
            random[i * 4 + 2] = Math.random();
            random[i * 4 + 3] = Math.random();
        }

        const geometry = new Plane(gl, { width: 0.1, height: 0.1 });

        geometry.addAttribute("offset", { instanced: 1, size: 3, data: position });
        geometry.addAttribute("random", { instanced: 1, size: 4, data: random });

        const mouse = new Vec2(0, 0);
        const targetMouse = new Vec2(0, 0);

        const vertex = /* glsl */ `
      attribute vec3 position;
      attribute vec2 uv;
      attribute vec3 offset;
      attribute vec4 random;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uTime;
      uniform vec2 uMouse;
      
      varying vec2 vUv;
      varying float vAlpha;
      
      void main() {
        vUv = uv;
        
        vec3 pos = offset;
        
        // Gentle wave motion
        pos.y += sin(uTime * 0.2 + pos.x * 0.5) * 0.5;
        pos.x += cos(uTime * 0.15 + pos.y * 0.3) * 0.2;
        
        // Mouse interaction
        // Simple screen-space approximation re-mapped to world
        float dist = distance(pos.xy, uMouse * vec2(20.0, 10.0));
        float force = max(0.0, 6.0 - dist);
        
        if (dist < 6.0) {
            // Push away
            vec2 dir = normalize(pos.xy - uMouse * vec2(20.0, 10.0));
            pos.xy += dir * force * 0.5;
        }

        // Particle Size pulsing
        float size = random.w * (0.8 + sin(uTime + random.x * 10.0) * 0.4);
        
        // Billboard
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        mvPosition.xyz += position * size * 2.0; 
        
        gl_Position = projectionMatrix * mvPosition;
        
        // Alpha pulse
        vAlpha = 0.4 + 0.6 * sin(uTime * 2.0 + random.y * 20.0);
      }
    `;

        const fragment = /* glsl */ `
      precision highp float;
      uniform vec3 uColor;
      
      varying vec2 vUv;
      varying float vAlpha;
      
      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        
        // Soft circle
        float circle = smoothstep(0.5, 0.0, dist);
        
        if (circle < 0.01) discard;
        
        // Hotspot center
        float heat = smoothstep(0.1, 0.0, dist);
        
        vec3 finalColor = uColor + heat * 0.3;
        
        gl_FragColor = vec4(finalColor, circle * vAlpha * circle);
      }
    `;

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new Vec3(0.23, 0.51, 0.96) }, // #3b82f6
                uMouse: { value: new Vec2(0, 0) },
            },
            transparent: true,
            depthTest: false,
        });

        const mesh = new Mesh(gl, { geometry, program });
        mesh.setParent(scene);

        let requestID: number;
        const update = (t: number) => {
            requestID = requestAnimationFrame(update);

            // Interpolate mouse
            mouse.lerp(targetMouse, 0.05);

            program.uniforms.uTime.value = t * 0.001;
            program.uniforms.uMouse.value = mouse;

            renderer.render({ scene, camera });
        };
        requestID = requestAnimationFrame(update);

        const handleMouseMove = (e: MouseEvent) => {
            // Normalize -1 to 1
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1; // Invert Y for GL
            targetMouse.set(x, y);
        };
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            cancelAnimationFrame(requestID);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            if (containerRef.current && containerRef.current.contains(gl.canvas)) {
                containerRef.current.removeChild(gl.canvas);
            }
        };
    }, []);

    return <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`} />;
}
