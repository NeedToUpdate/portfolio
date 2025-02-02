import { useEffect } from "react";

/**
 * Triggers a function when a mousedown event is detected outside the supplied ref.
 * @param ref the object to be clicked
 * @param callback the function that should trigger when you click outside the ref
 */
export const useOutsideClick = (ref: React.RefObject<any>, callback: (arg0?: MouseEvent) => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(event);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
};
