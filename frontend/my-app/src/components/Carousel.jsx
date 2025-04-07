import React, { useState, useEffect, useCallback } from "react";
import "./Carousel.css";

// Import your images here
import image1 from "../images/carousel-1.jpg";
import image2 from "../images/carousel-2.jpg";
import image3 from "../images/carousel-3.jpg";

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: image1,
      alt: "Construction workers collaborating",
      caption: "Connect with skilled professionals",
    },
    {
      image: image2,
      alt: "Home renovation project",
      caption: "Quality work, on time and on budget",
    },
    {
      image: image3,
      alt: "Completed project",
      caption: "Bringing your vision to life",
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="carousel-container">
      <div className="carousel-inner">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-slide ${
              index === currentSlide ? "active" : ""
            }`}
          >
            <img src={slide.image} alt={slide.alt} />
            <div className="carousel-caption">
              <h3>{slide.caption}</h3>
            </div>
          </div>
        ))}
      </div>

      <button
        className="carousel-control prev"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <button
        className="carousel-control next"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <i className="fas fa-chevron-right"></i>
      </button>

      <div className="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
