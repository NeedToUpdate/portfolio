import React, { MouseEvent, useEffect, useRef } from "react";
import { gaussianRandom, getRandom } from "./utils/functions";
import { Particle } from "./utils/Particle";
import { Quad } from "./utils/Quad";
import { Vector } from "./utils/Vector";

interface props {
  numOfParticles: number;
}
const colors = ["#01ECF7", "#F9FF57", "#A104F8", "#FFFFFF"];
export default function ParticleBackground(props: props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const particles: Particle[] = [];
  const quad = useRef(null as null | Quad);
  const mousePos = useRef({ x: 100, y: 100 });
  const mouseMoved = useRef(false);
  useEffect(() => {
    if (canvas.current) {
      canvas.current.width = window.innerWidth;
      canvas.current.height = window.innerHeight;
      setup();
      const interval = setInterval(loop, 16);
      canvas.current.addEventListener("mousemove", (ev) => {
        mousePos.current = { x: ev.clientX | 0, y: ev.clientY | 0 };
        mouseMoved.current = true;
        if (quad.current) {
          let ps = quad.current!.query(ev.clientX | 0, ev.clientY | 0, 20, 400);
          ps.forEach((part) => {
            part.acceleration.add(new Vector(ev.clientX | 0, ev.clientY | 0).sub(part.p).limit(0.5));
          });
        }
      });
      canvas.current.addEventListener("mouseleave", (ev) => {
        mouseMoved.current = false;
      });
      canvas.current.addEventListener("click", (ev) => {
        if (canvas && canvas.current && canvas.current.getContext("2d") !== null) {
          let context = canvas.current.getContext("2d");
          if (context) {
            for (let i = 0; i < getRandom(3, 5); i++) {
              let p = new Particle(ev.clientX, ev.clientY, getRandom(1, 3), getRandom(colors), context);
              p.acceleration = Vector.random().mult(2);
              particles.push(p);
            }
          }
        }
      });
      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  const setup = () => {
    const context = canvas.current!.getContext("2d")!;
    for (let i = 0; i < props.numOfParticles; i++) {
      let p = new Particle(gaussianRandom(window.innerWidth / 4, window.innerWidth / 7), gaussianRandom((window.innerHeight * 2) / 3, window.innerHeight / 5), getRandom(0.5, 5), getRandom(colors), context);
      p.acceleration = Vector.random().limit(0.01);
      particles.push(p);
    }
  };
  const loop = () => {
    if (canvas.current!.getBoundingClientRect().bottom <= 0) return;
    if (quad.current) {
      quad.current.clear();
    }
    quad.current = new Quad(window.innerWidth, window.innerHeight, 0, 0);
    canvas.current!.getContext("2d")!.clearRect(0, 0, canvas.current!.width, canvas.current!.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.update(1);
      quad.current.addItem(p);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      let attract = quad.current.query(p.x, p.y, 40, 1600);
      let totalPos = attract.reduce(
        (a, b) => {
          return { x: a.x + b.x * b.width, y: a.y + b.y * b.width, size: a.size + b.width };
        },
        { x: 0, y: 0, size: 0 }
      );
      totalPos.x /= totalPos.size;
      totalPos.y /= totalPos.size;
      p.acceleration.add(new Vector(totalPos.x, totalPos.y).copy().sub(p.p).limit(0.001));
      if (mouseMoved.current) {
        p.acceleration.add(new Vector(mousePos.current.x, mousePos.current.y).sub(p.p).limit(0.01));
      } else {
        p.acceleration.add(new Vector(window.innerWidth / 3, (window.innerHeight * 2) / 3).sub(p.p).limit(0.0001));
      }
      let repel = quad.current.query(p.x, p.y, p.width, p.width ** 2);
      repel.forEach((part) => {
        p.acceleration.add(p.p.copy().sub(part.p).limit(0.001).mult(p.width));
      });
    }
  };

  return (
    <div className="absolute w-full h-screen z-0">
      <canvas ref={canvas}></canvas>
    </div>
  );
}
