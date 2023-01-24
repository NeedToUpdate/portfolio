import React, { useState, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";

const mouth = ["M97.85,114.8c59.62-31.21,59-31.21,0-62.91", "M34.45,101.58c29.41,45.92,74.2,45.66,103.61,0"];
const leftEye = ["M26.66,83.67c34.88,0,19.77,0,57.19-.14", "M42.87,65.54c0-25.66,31.4-25.4,31.4-.25"];
const rightEye = ["M83.85,83.6c43.25,0,27.24,0,54.47-.26", "M98.75,65.54c0-25.66,31.4-25.4,31.4-.25"];

export default function AnimatedArrow(props: { state: 0 | 1; className?: string }) {
  const [activeIndex, setActiveIndex] = useState(props.state);
  useEffect(() => {
    setActiveIndex((old) => {
      api.start({
        mouth: mouth[props.state],
        leftEye: leftEye[props.state],
        rightEye: rightEye[props.state],
      });
      return props.state;
    });
  }, [props.state]);
  const [mouthSpring, api] = useSpring(() => ({
    from: {
      mouth: mouth[0],
      leftEye: leftEye[0],
      rightEye: rightEye[0],
    },
    to: {
      mouth: mouth[1],
      leftEye: leftEye[1],
      rightEye: rightEye[1],
    },
    config: {},
  }));

  return (
    <>
      <svg id="animated_arrow" data-name="Animated Arrow" xlinkTitle="Animated Arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172.51 172.51" stroke="#FFF" className={props.className}>
        <circle id="head" cx="86.26" cy="86.26" r="81.26" fill="none" style={{ strokeMiterlimit: 10, strokeWidth: "10px" }} />
        <animated.path d={mouthSpring.mouth} fill="none" style={{ strokeMiterlimit: 10, strokeWidth: "10px", fill: "none" }} />
        <animated.path d={mouthSpring.leftEye} fill="none" style={{ strokeMiterlimit: 10, strokeWidth: "10px", fill: "none" }} />
        <animated.path d={mouthSpring.rightEye} fill="none" style={{ strokeMiterlimit: 10, strokeWidth: "10px", fill: "none" }} />
      </svg>
    </>
  );
}
