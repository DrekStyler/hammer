import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './ProjectImages.css';

const ProjectImages = ({ projectId, images: providedImages }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);

        if (providedImages) {
          setImages(providedImages);
          setLoading(false);
          return;
        }

        if (!projectId) {
          throw new Error('Project ID is required');
        }

        const imagesQuery = query(
          collection(db, 'projectImages'),
          where('projectId', '==', projectId)
        );

        const querySnapshot = await getDocs(imagesQuery);
        const fetchedImages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setImages(fetchedImages);
      } catch (err) {
        console.error('Error fetching project images:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [projectId, providedImages]);

  const handleImageClick = (index) => {
    setActiveImageIndex(index);
    setShowLightbox(true);
  };

  const handleCloseLightbox = () => {
    setShowLightbox(false);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="project-images-container loading">
        <i className="fas fa-spinner fa-spin loading-spinner"></i>
        <p>Loading images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-images-container error">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="project-images-container empty">
        <i className="fas fa-images"></i>
        <p>No images available for this project</p>
      </div>
    );
  }

  return (
    <div className="project-images-container">
      <h3 className="section-title">Project Images</h3>
      <div className="images-grid">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="image-item"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={image.url}
              alt={`Project image ${index + 1}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {showLightbox && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={handleCloseLightbox}>
              <i className="fas fa-times"></i>
            </button>
            <img
              src={images[activeImageIndex].url}
              alt={`Project image ${activeImageIndex + 1}`}
            />
            <div className="lightbox-counter">
              {activeImageIndex + 1} / {images.length}
            </div>
            <button className="lightbox-prev" onClick={handlePrevImage}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="lightbox-next" onClick={handleNextImage}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectImages; 