import React from "react";

export default function GradientBackground() {
  return (
    <>
      <div aria-hidden={true} className="absolute w-full h-[300vh] z-0 top-0 left-0 pointer-events-none">
        {/*teal coloured moving radial blur*/}
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="100%" width="100%" preserveAspectRatio="xMinYMin meet">
          <defs>
            <linearGradient id="linGrad" gradientTransform="rotate(70)">
              <stop offset="0%" stopColor="#01ecf733">
                <animate attributeName="stop-color" values="#01ecf722;#00000022;#A104F822;#00000022;#01ecf722;" dur="20s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#00000022">
                <animate attributeName="stop-color" values="#00000022;#A104F822;#00000022;#01ecf722;#00000022;" dur="20s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#A104F822">
                <animate attributeName="stop-color" values="#A104F822;#00000022;#01ecf722;#00000022;#A104F822;" dur="20s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <rect id="rect3" fill="url(#linGrad)" width="100%" height="100%"></rect>
        </svg>
      </div>
    </>
  );
}
