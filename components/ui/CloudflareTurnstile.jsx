"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

const CloudflareTurnstile = forwardRef(function CloudflareTurnstile(
  { onVerify, onError, onExpire, className = "" },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState("");

  const callbacksRef = useRef({ onVerify, onError, onExpire });
  callbacksRef.current = { onVerify, onError, onExpire };

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAF9-oY4f9sZRa6Ta";

  // Expose reset method to parent components
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (
        widgetIdRef.current !== null &&
        typeof window !== "undefined" &&
        window.turnstile?.reset
      ) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {
          console.warn("Turnstile reset warning:", e);
        }
      }
    },
  }));

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile?.render) {
        return false;
      }

      if (widgetIdRef.current !== null) {
        return true;
      }

      try {
        containerRef.current.innerHTML = "";

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (callbacksRef.current.onVerify) {
              callbacksRef.current.onVerify(token);
            }
          },
          "error-callback": (errorCode) => {
            console.warn("Cloudflare Turnstile error code:", errorCode);
            if (callbacksRef.current.onError) {
              callbacksRef.current.onError(errorCode);
            }
          },
          "expired-callback": () => {
            if (callbacksRef.current.onExpire) {
              callbacksRef.current.onExpire();
            }
          },
          theme: "light",
          size: "normal",
          appearance: "always",
          "response-field": true,
          "response-field-name": "cf-turnstile-response",
        });

        widgetIdRef.current = id;
        setIsRendered(true);
        setRenderError("");
        return true;
      } catch (err) {
        console.error("Turnstile render error:", err);
        return false;
      }
    };

    window.__cfTurnstileLoaded = () => {
      if (isMounted) {
        renderWidget();
      }
    };

    if (typeof window !== "undefined" && window.turnstile?.render) {
      renderWidget();
    } else {
      const scriptId = "cf-turnstile-script";
      let script = document.getElementById(scriptId);

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__cfTurnstileLoaded&render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      let attempts = 0;
      intervalId = setInterval(() => {
        attempts++;
        if (typeof window !== "undefined" && window.turnstile?.render) {
          if (renderWidget()) {
            clearInterval(intervalId);
          }
        }
        if (attempts > 40) {
          clearInterval(intervalId);
          if (isMounted && widgetIdRef.current === null) {
            setRenderError(
              "Security check took too long to load. Please refresh the page."
            );
          }
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);

      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-start overflow-hidden"
      />
      {renderError && (
        <p className="mt-1 text-xs text-red-500">{renderError}</p>
      )}
    </div>
  );
});

export default CloudflareTurnstile;
