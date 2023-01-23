export function getRandom(): number;
export function getRandom(num1: number): number;
export function getRandom(num1: Array<any>): any;
export function getRandom(num1: number, num2: number): number;
export function getRandom() {
  //returns random stuff
  //1 arg means return random int between 0 and arg-1
  //2 args means return float in range ar1,arg2
  //array means return random value in array
  //-1 means return a 1 or -1
  if (arguments.length === 0) {
    return Math.random();
  }
  if (arguments.length === 1) {
    if (arguments[0] instanceof Array) {
      return arguments[0][(Math.random() * arguments[0].length) | 0];
    }
    if (typeof arguments[0] === "number") {
      if (arguments[0] === -1) {
        return Math.random() < 0.5 ? -1 : 1;
      }
      return (Math.random() * arguments[0]) | 0;
    }
  } else if (arguments.length === 2) {
    return Math.random() * (arguments[1] - arguments[0]) + arguments[0];
  }
}

export function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random(); //Converting [0,1) to (0,1)
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}
