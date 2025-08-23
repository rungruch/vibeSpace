// Custom hook to delay rendering - only show if loading takes longer than delay
import { useState, useEffect } from "react";

export function useDelayedRender(trigger: boolean, delay: number = 2000) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!trigger) {
      // Start timer when not ready (loading), show spinner after delay
      timeout = setTimeout(() => setShow(true), delay);
    } else {
      // Hide immediately when ready
      setShow(false);
    }
    return () => clearTimeout(timeout);
  }, [trigger, delay]);
  return show;
}