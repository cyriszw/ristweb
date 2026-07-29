import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollReveal() {
  const [visible, setVisible] = useState(false);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (nodeRef.current) {
      observerRef.current.observe(nodeRef.current);
    }
    return () => observerRef.current?.disconnect();
  }, []);

  const ref = useCallback((el: HTMLDivElement | null) => {
    nodeRef.current = el;
    if (el && observerRef.current) {
      observerRef.current.observe(el);
    }
  }, []);

  return { ref, visible };
}
