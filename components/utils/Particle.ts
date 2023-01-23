import { ContextType } from "react";
import { get2digitHex, getRandom } from "./functions";
import { Vector } from "./Vector";

export class Particle {
  width: number;
  offset: number;
  life: number;
  velocity: Vector;
  old_velocity: Vector;
  acceleration: Vector;
  p: Vector;
  context: CanvasRenderingContext2D;
  color: string;
  timeStepAccumulator: number; //used in case of lag, will run the update function more
  timePerStep: number; //time per step
  MAX_FORCE: number; //to prevent craziness
  MAX_VELOCITY: number; //terminal velocity
  dead: boolean;
  opacity: number;
  opacityIncreasing: boolean;

  constructor(x: number, y: number, width: number, color: string, context: CanvasRenderingContext2D) {
    this.p = new Vector(x, y);
    this.width = width;
    this.offset = 0;
    this.life = 100;
    this.velocity = new Vector(0, 0);
    this.old_velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.context = context;
    this.color = color;

    this.timePerStep = 1;
    this.timeStepAccumulator = 0;
    this.dead = false;
    this.opacity = getRandom(0, 255) | 0;
    this.opacityIncreasing = getRandom(1) == 1;

    //========= CONFIG ===========
    this.MAX_FORCE = 0.5;
    this.MAX_VELOCITY = 2;

    this.draw();
  }
  get x() {
    return this.p.x;
  }
  get y() {
    return this.p.y;
  }
  set x(val: number) {
    this.p.x = val;
  }
  set y(val: number) {
    this.p.y = val;
  }
  kill() {
    this.dead = true;
  }
  update(time: number) {
    if (this.life <= 0) this.kill();
    if (this.dead) return;
    this.timeStepAccumulator += time;
    while (this.timeStepAccumulator >= this.timePerStep) {
      if (this.dead) break;
      this.acceleration.limit(this.MAX_FORCE);
      this.old_velocity = this.velocity.copy();
      this.velocity.add(this.acceleration.copy());
      this.velocity.limit(this.MAX_VELOCITY);
      this.p.add(this.velocity.copy().add(this.old_velocity).mult(0.5));
      this.acceleration.clear();

      this.handleBounds();

      this.timeStepAccumulator = this.timeStepAccumulator - this.timePerStep;
    }
    this.draw();
  }

  draw() {
    this.context.fillStyle = this.color + get2digitHex(this.opacity);
    if (this.opacityIncreasing) {
      this.opacity += 1;
      if (this.opacity >= 255) {
        this.opacity = 255;
        this.opacityIncreasing = false;
      }
    } else {
      this.opacity -= 1;
      if (this.opacity <= 0) {
        this.opacity = 0;
        this.opacityIncreasing = true;
      }
    }
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
    this.context.fill();
  }
  handleBounds() {
    let paddingX = 0;
    let paddingY = 0;
    if (this.x + paddingX > window.innerWidth) {
      this.x = window.innerWidth - paddingX;
      this.velocity.x *= -1;
    }
    if (this.y + paddingY > window.innerHeight) {
      this.y = window.innerHeight - paddingY;
      this.velocity.y *= -1;
    }
    if (this.x + paddingX < 0) {
      this.x = -paddingX;
      this.velocity.x *= -1;
    }
    if (this.y + paddingY < 0) {
      this.velocity.y *= -1;
      this.y = -paddingY;
    }
  }
}
