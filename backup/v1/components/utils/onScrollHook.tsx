import { useState } from "react";

export function useScroll(percentage: number, axis: "vert" | "horiz" = "vert"): [Boolean, Object] {
  const [triggered, setTriggered] = useState(false);
  const onScrollProps = {
    onScroll: (ev: React.UIEvent<HTMLElement>) => {
      if (axis == "vert") {
        const height = ev.currentTarget.scrollHeight - ev.currentTarget.clientHeight;

        setTriggered(Math.abs(ev.currentTarget.scrollTop - height) / height < (100 - percentage) / 100);
      } else {
        const width = ev.currentTarget.scrollWidth - ev.currentTarget.clientWidth;

        setTriggered(Math.abs(ev.currentTarget.scrollLeft - width) / width < (100 - percentage) / 100);
      }
    },
  };
  return [triggered, onScrollProps];
}
