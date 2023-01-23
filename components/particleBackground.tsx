import React, { MouseEvent, useEffect, useRef } from "react";
import { gaussianRandom, getRandom } from "./utils/functions";
import { Particle } from "./utils/Particle";
import { Quad } from "./utils/Quad";
import { Vector } from "./utils/Vector";

interface props {
  numOfParticles: number;
}
const colors = ["#01ECF7", "#F9FF57", "#A104F8"];
export default function ParticleBackground(props: props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const particles: Particle[] = [];
  const quad = useRef(null as null | Quad);
  useEffect(() => {
    if (canvas.current) {
      canvas.current.width = window.innerWidth;
      canvas.current.height = window.innerHeight;
      setup();
      const interval = setInterval(loop, 16);
      canvas.current.addEventListener("mouseover", (ev) => {
        if (quad.current) {
          let ps = quad.current!.query(ev.clientX | 0, ev.clientY | 0, 20, 4000);
          console.log(ev);
          ps.forEach((part) => {
            part.acceleration.add(new Vector(ev.clientX | 0, ev.clientY | 0).sub(part.p).limit(0.5));
          });
        }
      });
      canvas.current.addEventListener("click", (ev) => {
        if (canvas && canvas.current && canvas.current.getContext("2d") !== null) {
          let context = canvas.current.getContext("2d");
          if (context) {
            for (let i = 0; i < getRandom(3, 5); i++) {
              let p = new Particle(ev.clientX, ev.clientY, getRandom(2, 5), getRandom(colors), context);
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
  }, [canvas.current]);

  const setup = () => {
    const context = canvas.current!.getContext("2d")!;
    for (let i = 0; i < props.numOfParticles; i++) {
      let p = new Particle(gaussianRandom(window.innerWidth / 4, window.innerWidth / 7), gaussianRandom((window.innerHeight * 2) / 3, window.innerHeight / 5), getRandom(2, 5), getRandom(colors), context);
      p.acceleration = Vector.random().mult(0.1);
      particles.push(p);
    }
  };
  const loop = () => {
    if (quad.current) {
      quad.current!.clear();
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
      let attract = quad.current.query(p.x, p.y, 20, 400);
      attract.forEach((part) => {
        part.acceleration.add(
          p.p
            .copy()
            .sub(part.p)
            .limit(0.0003)
            .mult(p.width ** 2)
        );
      });
      let repel = quad.current.query(p.x, p.y, p.width, p.width ** 2);
      repel.forEach((part) => {
        part.acceleration.clear(); //add(part.p.copy().sub(p.p).limit(0.001).mult(p.width));
      });
    }
  };

  return (
    <div className="absolute w-full h-full z-0">
      <canvas ref={canvas}></canvas>
    </div>
  );
}
