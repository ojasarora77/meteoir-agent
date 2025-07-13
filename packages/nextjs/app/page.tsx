"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CpuChipIcon } from "@heroicons/react/24/outline";
import ErrorBoundary from "~~/components/ErrorBoundary";
import { Address } from "~~/components/scaffold-eth";
import { DemoSection } from "~~/components/DemoSection";

const UnifySection = () => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [shouldBeSticky, setShouldBeSticky] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Throttle scroll events for better performance
  const throttledScrollHandler = useCallback(() => {
    let ticking = false;

    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const sectionOffsetTop = sectionRef.current.offsetTop;

        // Only be sticky when we're actually scrolling through the Unify section
        const isInSectionArea =
          scrollY >= sectionOffsetTop - windowHeight && scrollY <= sectionOffsetTop + sectionHeight;
        setShouldBeSticky(isInSectionArea);

        // Start animation much earlier when section becomes visible
        if (sectionTop <= windowHeight * 0.5 && sectionTop + sectionHeight >= 0) {
          // Calculate how much of the section is visible
          const visibleStart = Math.max(0, windowHeight * 0.5 - sectionTop);
          const visibleProgress = visibleStart / (windowHeight * 0.5);

          // Animation starts immediately when section becomes 50% visible
          const progress = Math.max(0, Math.min(1, visibleProgress));
          setAnimationProgress(progress);
        } else {
          setAnimationProgress(0);
        }
      }
      ticking = false;
    };

    return () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };
  }, []);

  useEffect(() => {
    const scrollHandler = throttledScrollHandler();
    window.addEventListener("scroll", scrollHandler, { passive: true });
    scrollHandler(); // Initial call

    return () => window.removeEventListener("scroll", scrollHandler);
  }, [throttledScrollHandler]);

  // Images: 3 from left at different angles, 2 from right at different angles
  const images = useMemo(
    () => [
      { src: "/coffee.png", alt: "Coffee payment illustration", side: "left", angle: 0 }, // top-left diagonal
      { src: "/eur.png", alt: "Euro currency symbol", side: "left", angle: 1 }, // center-left horizontal
      { src: "/exchange.png", alt: "Currency exchange interface", side: "left", angle: 2 }, // bottom-left diagonal
      { src: "/jane.png", alt: "User profile interface", side: "right", angle: 0 }, // top-right diagonal
      { src: "/person.png", alt: "Person making payment", side: "right", angle: 1 }, // bottom-right diagonal
    ],
    [],
  );

  const getImagePosition = useCallback(
    (side: string, angle: number) => {
      // Images start appearing only when animation starts
      const moveProgress = animationProgress;

      if (moveProgress === 0) {
        return { opacity: 0, transform: "scale(0)" };
      }

      if (side === "left") {
        // 3 images from left at LARGER angles - with staggered final positions
        let startX, startY, finalX, finalY;

        switch (angle) {
          case 0: // Top-left diagonal (larger angle)
            startX = -40; // Start from much farther left
            startY = 5; // Start from higher up
            finalX = 45; // Staggered final position (not exact center)
            finalY = 40; // Staggered final position
            break;
          case 1: // Center-left horizontal
            startX = -40; // Start from much farther left
            startY = 50; // Start from middle
            finalX = 42; // Staggered final position
            finalY = 50; // Keep middle
            break;
          case 2: // Bottom-left diagonal (larger angle)
            startX = -40; // Start from much farther left
            startY = 95; // Start from lower down
            finalX = 45; // Staggered final position
            finalY = 60; // Staggered final position
            break;
          default:
            startX = -40;
            startY = 50;
            finalX = 45;
            finalY = 50;
        }

        // Interpolate from start position to staggered final position
        const currentX = startX + moveProgress * (finalX - startX);
        const currentY = startY + moveProgress * (finalY - startY);

        return {
          top: `${currentY}%`,
          left: `${currentX}%`,
          transform: "translate(-50%, -50%)",
          opacity: 1,
          zIndex: 30 + angle, // Different z-index for staggering
        };
      } else {
        // 2 images from right at LARGER angles - with staggered final positions
        let startX, startY, finalX, finalY;

        switch (angle) {
          case 0: // Top-right diagonal (larger angle)
            startX = 140; // Start from much farther right
            startY = 10; // Start from higher up
            finalX = 55; // Staggered final position
            finalY = 45; // Staggered final position
            break;
          case 1: // Bottom-right diagonal (larger angle)
            startX = 140; // Start from much farther right
            startY = 90; // Start from lower down
            finalX = 58; // Staggered final position
            finalY = 55; // Staggered final position
            break;
          default:
            startX = 140;
            startY = 50;
            finalX = 55;
            finalY = 50;
        }

        // Interpolate from start position to staggered final position
        const currentX = startX + moveProgress * (finalX - startX);
        const currentY = startY + moveProgress * (finalY - startY);

        return {
          top: `${currentY}%`,
          left: `${currentX}%`,
          transform: "translate(-50%, -50%)",
          opacity: 1,
          zIndex: 30 + angle + 3, // Different z-index for staggering
        };
      }
    },
    [animationProgress],
  );

  // Calculate text scale - starts shrinking later in the animation
  const textScale = useMemo(() => {
    const textShrinkStart = 0.3; // Text starts shrinking when animation is 30% complete
    const textProgress = Math.max(0, (animationProgress - textShrinkStart) / (1 - textShrinkStart));
    return Math.max(0.4, 1 - textProgress * 0.6); // Shrinks from 100% to 40% (smaller)
  }, [animationProgress]);

  // Keep section sticky only when in section area and animation not complete
  const isAnimationComplete = animationProgress >= 1;
  const stickyClass = shouldBeSticky && !isAnimationComplete ? "sticky top-0" : "relative";

  return (
    <section
      ref={sectionRef}
      className={`h-screen bg-white relative flex items-center justify-center overflow-hidden ${stickyClass}`}
    >
      {/* Central Text - 2 lines, bigger size, gradually shrinking */}
      <div className="text-center z-10 relative">
        <h2
          className="text-7xl md:text-9xl lg:text-[12rem] font-bold text-orange-500 leading-[0.9]"
          style={{
            transform: `scale(${textScale})`,
            transition: "transform 0.3s ease-out",
          }}
          aria-label="Unify Your Payments - Main heading"
        >
          <div>Unify Your</div>
          <div>Payments</div>
        </h2>
      </div>

      {/* Animated Images */}
      {images.map((image, index) => (
        <div
          key={`${image.src}-${index}`}
          className="absolute w-48 h-48 md:w-56 md:h-56"
          style={{
            ...getImagePosition(image.side, image.angle),
            transition: "all 0.4s ease-out",
            willChange: "transform, opacity",
          }}
          role="img"
          aria-label={image.alt}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 192px, 224px"
            loading="eager"
          />
        </div>
      ))}
    </section>
  );
};

const ThreeTextsSection = () => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const windowHeight = window.innerHeight;

        // Start animation when section enters viewport
        if (sectionTop <= windowHeight && sectionTop + sectionHeight >= 0) {
          // Calculate how much of the section is visible
          const visibleHeight = Math.min(windowHeight - Math.max(sectionTop, 0), sectionHeight);
          const progress = Math.max(0, Math.min(1, visibleHeight / windowHeight));
          setAnimationProgress(progress);
        } else {
          setAnimationProgress(0);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate positions for each text based on scroll progress
  const getTextPosition = useCallback(
    (textIndex: number) => {
      // Text appears at different stages: 0.1, 0.4, 0.7
      const triggers = [0.1, 0.4, 0.7];
      const trigger = triggers[textIndex];

      if (animationProgress < trigger) {
        // Text is below screen (not visible)
        return {
          transform: "translateY(200px)",
          opacity: 0,
          transition: "all 0.5s ease-out",
        };
      } else {
        // Text is visible and moving to final position
        const textProgress = Math.min(1, (animationProgress - trigger) / 0.3);

        // Start positions (spread out) to end positions (with larger gaps)
        const startY = 200 + textIndex * 100; // Start spread out: 200px, 300px, 400px
        const endY = textIndex * 100; // End with larger gaps: 0px, 100px, 200px

        const currentY = startY - textProgress * (startY - endY);

        return {
          transform: `translateY(${currentY}px)`,
          opacity: 1,
          transition: "all 0.5s ease-out",
        };
      }
    },
    [animationProgress],
  );

  return (
    <>
      {/* Main section that holds the animation */}
      <section
        ref={sectionRef}
        className="h-screen bg-white relative flex flex-col items-center justify-start pt-32 overflow-hidden"
      >
        {/* Add Text - Green */}
        <div className="absolute text-center z-10 left-1/2 transform -translate-x-1/2" style={getTextPosition(0)}>
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-green-500 leading-[0.9]">Add</h2>
        </div>

        {/* Send Text - Blue */}
        <div className="absolute text-center z-10 left-1/2 transform -translate-x-1/2" style={getTextPosition(1)}>
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-blue-500 leading-[0.9]">Send</h2>
        </div>

        {/* Exchange Text - Reddish Pink */}
        <div className="absolute text-center z-10 left-1/2 transform -translate-x-1/2" style={getTextPosition(2)}>
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-pink-500 leading-[0.9]">Exchange</h2>
        </div>
      </section>
    </>
  );
};

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <ErrorBoundary>
      {/* Hero Section with Background Video */}
      <section className="min-h-screen relative overflow-hidden flex flex-col">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
          {/* White background to fill empty spaces */}
          <div className="absolute inset-0 bg-white"></div>

          <video
            autoPlay
            loop
            muted
            playsInline
            className="relative z-10 transform scale-75 rounded-2xl"
            poster="/thumbnail.jpg"
            onError={e => {
              console.error("Video failed to load:", e);
              // Fallback behavior could be implemented here
            }}
            onLoadStart={() => console.log("Video loading started")}
            aria-label="Background video showing payment interface"
          >
            <source src="/hero2.mp4" type="video/mp4" />
            <p>Your browser does not support the video tag. Please update your browser to view this content.</p>
          </video>
          {/* Ultra light overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-transparent z-20"></div>
        </div>

        {/* Transparent Navigation Overlay */}
        <nav className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-orange-500">MeteoirAgent</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                Home
              </Link>
              <Link href="/dashboard" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/debug" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                Debug
              </Link>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center gap-4">
              {connectedAddress ? (
                <div className="hidden sm:flex items-center gap-2 glass-card px-4 py-2 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-orange-400 text-sm font-medium">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm px-6 rounded-xl">Connect Wallet</button>
              )}

              {/* Mobile Menu Button */}
              <button className="md:hidden text-orange-400 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-end pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-end w-full">
            {/* Left column - Main Heading */}
            <div className="space-y-8" style={{ animation: "slideUp 0.8s ease-out" }}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-white drop-shadow-lg">
                  One agent
                  <br />
                  for all payments
                </span>
              </h1>

              {/* Connected wallet display */}
              {connectedAddress && (
                <div
                  className="glass-card p-6 max-w-md backdrop-blur-lg bg-white/10 border border-white/20"
                  style={{ animation: "fadeIn 1s ease-out 0.3s both" }}
                >
                  <p className="text-sm text-white/70 mb-2">Connected Wallet</p>
                  <div className="text-white">
                    <Address address={connectedAddress} />
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Description */}
            <div className="space-y-6 lg:text-right" style={{ animation: "slideUp 0.8s ease-out 0.2s both" }}>
              <p className="text-xl md:text-2xl text-white/95 leading-relaxed drop-shadow-md">
                Autonomous AI-powered cross-chain payments with intelligent optimization.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Unify Section */}
      <UnifySection />

      {/* Three Texts Section - Add, Send, Exchange */}
      <ThreeTextsSection />

      {/* New Video Section */}
      <section className="h-screen relative flex items-center justify-center">
        <div className="absolute inset-0 bg-white"></div>
        <div
          className="relative z-10 rounded-2xl overflow-hidden"
          style={{
            width: "calc(100% - 4rem)",
            height: "calc(100% - 4rem)",
            maxWidth: "1200px",
            maxHeight: "800px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="/thumbnail.jpg"
            onError={e => {
              console.error("Video failed to load:", e);
            }}
            onLoadStart={() => console.log("Video loading started")}
            aria-label="Background video showing payment interface"
          >
            <source src="/hero.mp4" type="video/mp4" />
            <p>Your browser does not support the video tag. Please update your browser to view this content.</p>
          </video>
          <div className="absolute top-1/2 left-24 -translate-y-1/2 z-20 text-white">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              All your finances,
              <br />
              in one app.
            </h2>
            <button className="btn btn-primary bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg mt-4 text-lg shadow-none">
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <DemoSection />

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-orange-500 text-white p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Autonomous Payments</h3>
              <p>
                Connects to service APIs and executes payments instantly via crypto. Schedules, negotiates, and
                optimizes microtransactions.
              </p>
            </div>
            <div className="bg-orange-500 text-white p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Programmable Rules</h3>
              <p>
                Supports programmable rules (e.g., daily budget, approval thresholds) for granular control over
                spending.
              </p>
            </div>
            <div className="bg-orange-500 text-white p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">M2M Commerce</h3>
              <p>Enables machine-to-machine commerce, IoT, or SaaS automation without human intervention.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Extended blank space for scrolling */}
      <section className="h-[200vh] bg-white"></section>
    </ErrorBoundary>
  );
};

export default Home;
