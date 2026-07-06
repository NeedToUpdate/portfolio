export class Vector {
  //anything to do with vectors, should be self-explanatory
  //most functions DO NOT create a new vector when called
  //so if you need to keep your values, call .copy() first
  x: number;
  y: number;
  constructor(x: number, y: number);
  constructor(x: Vector);
  constructor(x: number | Vector, y?: number) {
    if (x instanceof Vector) {
      this.x = x.x;
      this.y = x.y;
      return;
    } else if (typeof x === "object") {
      if ((x as { x: number }).x !== undefined && (x as { y: number }).y !== undefined) {
        this.x = (x as { x: number }).x;
        this.y = (x as { y: number }).y as number;
        return;
      } else {
        console.error("wrong object to make a vector");
      }
    } else if (typeof x === "number" || x === undefined) {
      this.x = x || 0;
      this.y = y || 0;
      return;
    }
    this.x = 0;
    this.y = 0;
  }

  static fromAngle(r: number, rads: number | undefined) {
    if (!rads) {
      r /= 180;
      r *= Math.PI;
      r -= Math.PI / 2;
      //console.log(r)
    }
    return new Vector(Math.cos(r), Math.sin(r));
  }

  static dot(v1: Vector, v2: Vector) {
    return v1.x * v2.x + v1.y * v2.y;
  }
  static random(): Vector;
  static random(x?: number, y?: number) {
    //creates a random vector from 0 to limits given
    if (x == undefined && y == undefined) {
      return new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
    if (typeof x === "number" && typeof y === "number") {
      return new Vector(Math.random() * x, Math.random() * y);
    } else if (typeof x === "number" && !y) {
      return new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).set(x);
    } else {
      return new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).set(1);
    }
  }

  add(v: Vector | number) {
    if (v instanceof Vector) {
      this.x += v.x;
      this.y += v.y;
    } else if (typeof v === "number") {
      this.x += v;
      this.y += v;
    }
    return this;
  }

  sub(v: Vector) {
    return this.subtract(v);
  }

  subtract(v: Vector | number) {
    if (v instanceof Vector) {
      this.x -= v.x;
      this.y -= v.y;
    } else if (typeof v === "number") {
      this.x -= v;
      this.y -= v;
    }
    return this;
  }

  getAngle(rads: number) {
    if (!rads) {
      return (Math.atan2(this.y, this.x) * 180) / Math.PI + 90;
    } else {
      return Math.atan2(this.y, this.x) + Math.PI / 2;
    }
  }

  clear() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  div(scalar: number) {
    return this.divide(scalar);
  }

  divide(scalar: number) {
    return this.multiply(1 / scalar);
  }

  mult(scalar: number) {
    return this.multiply(scalar);
  }

  multiply(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  copy() {
    return new Vector(this);
  }

  map(fn: (arg0: number) => number) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    return this;
  }

  get mag() {
    return this.magnitude;
  }

  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  log() {
    console.log(JSON.stringify(this));
  }

  rotate(r: number, rads: number | undefined) {
    if (!rads) {
      r = this.d2r(r);
      //r -= Math.PI/2;
    }
    let dx = this.x * Math.cos(r) - this.y * Math.sin(r);
    let dy = this.x * Math.sin(r) + this.y * Math.cos(r);
    this.x = dx;
    this.y = dy;
    return this;
  }

  d2r(r: number) {
    return (r / 180) * Math.PI;
  }

  limit(n: number) {
    let m = this.mag;
    if (m > n) {
      this.mult(n / m);
      return this;
    } else {
      return this;
    }
  }

  perp() {
    return this.perpendicular();
  }

  perpendicular() {
    let dx = this.y;
    let dy = this.x * -1;
    this.y = dy;
    this.x = dx;
    return this;
  }

  dot(v: Vector) {
    return this.x * v.x + this.y * v.y;
  }

  rotateAround(p: Vector, angle: number, rads: number | undefined) {
    if (!rads) {
      angle *= Math.PI / 180;
    }
    let c = Math.cos(-angle);
    let s = Math.sin(-angle);
    let nx = c * (this.x - p.x) + s * (this.y - p.y) + p.x;
    let ny = c * (this.y - p.y) - s * (this.x - p.x) + p.y;
    this.x = nx;
    this.y = ny;
    return this;
  }

  distance(v: Vector) {
    let x = this.x - v.x;
    let y = this.y - v.y;
    return Math.sqrt(x * x + y * y);
  }

  dist(v: Vector) {
    return this.distance(v);
  }

  set(n: number) {
    let m = this.mag;
    if (m === 0) {
      this.mult(n);
      return this;
    }
    this.mult(n / m);
    return this;
  }

  floor() {
    this.x = this.x | 0;
    this.y = this.y | 0;
  }
  normalize() {
    return this.set(1);
  }
  round() {
    this.x = this.x | 0;
    this.y = this.y | 0;
    return this;
  }
  get zeroY() {
    let copy = this.copy();
    copy.y = 0;
    return copy;
  }
  get zeroX() {
    let copy = this.copy();
    copy.x = 0;
    return copy;
  }
}
