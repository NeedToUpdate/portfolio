import React from "react";

export default function PictureLoader() {
  // in the shape of my picture, will load before the image does
  return (
    <svg id="art-loader" data-name="artem-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 532.72 719.1" className="bottom-0  right-0 absolute  md:h-[40vh] sm:h-[50vh] h-[40vh] w-auto">
      <defs>
        <linearGradient id="fillAnim" gradientTransform="rotate(70)">
          <stop offset="0%" stopColor="#0f0f0f" />
          <stop offset="33%" stopColor="#0f0f0f" />
          <stop offset="50%" stopColor="#1e1e1e" />
          <stop offset="67%" stopColor="#0f0f0f" />
          <stop offset="100%" stopColor="#0f0f0f" />
          <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" begin="0s" dur="1.5s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <path
        fill="url(#fillAnim)"
        d="M499.61,718.6c20.72-58.89,26-124.37,30.08-187.76C530.84,475,540.24,417,513.51,367.57c-8-14.67-9.05-13.5-23.12-18.85-22.33-7.7-43.73-24.08-63.35-38.08-17.68-8-29.46-28.27-49.47-31.69-25.93-20.53-15.85-57.89-11.76-85.77,7.67-5.17,15.17-11.59,17.6-21.06,14.5-58.35-10.32-30-15.5-71.62,3.64-47.58-44.83-116.63-96.33-96.37-1.68.73-3.3,1.32-4.54-.71-1.28-.48-1,1.64-1.32,2.55-3.14.24-5.49,2.27-8.85,1.68-7.28-2.78-6.32,8.79-21.22,8l2,2.38c-13.13-1.54-37.16,31.38-46.48,42.18-6.17,15.59,7.84,30.51,5.55,46.34-1.53,15.81,2.88,31.46-1.43,46.69.71,9.17,11.88,13.27,11.41,23,0,33.6,14,63.89,34,90-1.29,12.87-40.85,8.43-51.67,7.26-7.61-1.44-13.31,1-17.79,6.78-14.23,5.43-23.53,20.75-33,31.49-10.09,10-11,25.73-22.2,35.33-5,4.88-2.54,12.91-7,18.28C79.13,417.25,27.37,460,15.76,520.59,7,544.52-12.18,585.49,13,603.79c.77,2.12,2.83.84,4.2,1.35,2.66,3.13,7.46-.58,9.87,2.71,5.86,1.26,8,8.68,13.62,10.87a305.86,305.86,0,0,1,34.44,24.86C94.31,653,111,661,133.36,659.77c10.17-.92,6.45,14.43,3.75,19.54-.44,3.94.07,8.22-1.63,11.72.12,9.81-2.81,18.1-4,27.57Z"
      />
    </svg>
  );
}
