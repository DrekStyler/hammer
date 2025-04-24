import React from "react";
import { Link } from "react-router-dom";

function Story() {
  return (
    <div className="story-container">
      <div className="story-content">
        <h2>Connect with Skilled Professionals</h2>
        <p>
          Hammer Services connects project leaders with skilled contractors to
          get your projects done right. Whether you're looking to hire talent or
          offer your services, we make the process simple and efficient.
        </p>
        <p>
          Our platform helps you find the perfect match based on skills,
          availability, and project requirements - saving you time and ensuring
          quality results.
        </p>

        <div className="cta-container">
          <Link to="/contractor-search" className="cta-button">
            Find a Subcontractor
          </Link>
          <Link to="/project-leader-registration" className="secondary-button">
            Become a Prime
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Story;
