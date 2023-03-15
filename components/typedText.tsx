import React, { useEffect, useRef, useState } from "react";

interface props {
  children: string;
  className?: string;
  time: number; //in milliseconds
  delayStart?: number; //in milliseconds
  onClick?: Function;
}

function getDelays(text: string, totalTime: number, delayStart?: number) {
  let delays: number[] = [];
  delays.push(delayStart || 0);
  const letters = Array.from(text);
  const tickMap = (letter: string) => {
    switch (letter) {
      case " ":
        return 0.5; //pause less for spaces
      case ".":
        return 4; //pause longer for periods
      default:
        return 1;
    }
  };
  let totalTicksNeeded = letters.reduce((total, letter) => {
    return total + tickMap(letter);
  }, 0);
  let timePerTick = totalTime / totalTicksNeeded;
  letters.forEach((letter) => {
    delays.push(timePerTick * tickMap(letter));
  });
  return delays.map((x) => x | 0); //round the values
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TypedText(props: props) {
  const [text, setText] = useState("");
  const tick = useRef(0);

  useEffect(() => {
    const delays = getDelays(props.children, props.time, props.delayStart);
    if (tick.current !== null && tick.current < delays.length - 1) {
      const timer = setTimeout(() => {
        setText(props.children.slice(0, tick.current + 1));
        tick.current += 1;
      }, delays[tick.current]);

      return () => clearTimeout(timer);
    }
  }, [props.children, props.delayStart, props.time, tick, text]);
  return (
    <p
      onClick={() => {
        if (props.onClick) {
          props.onClick();
        }
      }}
      className={props.className}
    >
      {"" + text}
    </p>
  );
}
