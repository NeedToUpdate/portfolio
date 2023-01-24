import React from "react";

export default function DynamicBackground() {
  return (
    <>
      <div aria-hidden={true} className="absolute w-full h-screen z-0">
        {/*teal coloured moving radial blur*/}
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="100%" width="100%" preserveAspectRatio="xMinYMin meet">
          <defs>
            <radialGradient id="radGrad" fx="10%" fy="0%" r="200%">
              <stop offset="0%" stopColor="#01ecf733" />
              <stop offset="50%" stopColor="#00000000" />
            </radialGradient>
          </defs>
          <rect id="rect1" fill="url(#radGrad)" width="100%" height="100%">
            <animate xlinkHref="#radGrad" attributeName="fy" dur="15s" values="45%;85%;65%;45%" repeatCount="indefinite" restart="whenNotActive" />
            <animate xlinkHref="#radGrad" attributeName="fx" dur="13s" values="10%;15%;20%;10%" repeatCount="indefinite" restart="whenNotActive" />
          </rect>
        </svg>
      </div>
      <div aria-hidden={true} className="absolute w-full h-screen z-0">
        {/*magenta coloured moving radial blur*/}
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="100%" width="100%" preserveAspectRatio="xMinYMin meet">
          <defs>
            <radialGradient id="radGrad2" fx="10%" fy="0%" r="200%">
              <stop offset="0%" stopColor="#A104F844" />
              <stop offset="50%" stopColor="#00000000" />
            </radialGradient>
          </defs>
          <rect id="rect2" fill="url(#radGrad2)" width="100%" height="100%">
            <animate xlinkHref="#radGrad2" attributeName="fy" dur="15s" values="65%;25%;55%;65%" repeatCount="indefinite" restart="whenNotActive" />
            <animate xlinkHref="#radGrad2" attributeName="fx" dur="13s" values="0%;15%;10%;0%" repeatCount="indefinite" restart="whenNotActive" />
          </rect>
        </svg>
      </div>
    </>
  );
}
