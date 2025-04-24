import React from "react";
import { Link } from "react-router-dom";

function Story() {
  return (
    <div style={{
      padding: '60px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          marginBottom: '20px',
          color: '#333'
        }}>Connect with Skilled Professionals</h2>
        <p style={{
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '20px',
          color: '#555'
        }}>
          Hammer Services connects project leaders with skilled contractors to
          get your projects done right. Whether you're looking to hire talent or
          offer your services, we make the process simple and efficient.
        </p>
        <p style={{
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '30px',
          color: '#555'
        }}>
          Our platform helps you find the perfect match based on skills,
          availability, and project requirements - saving you time and ensuring
          quality results.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <Link to="/contractor-search" style={{
            display: 'inline-block',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s ease'
          }}>
            Find a Subcontractor
          </Link>
          <Link to="/project-leader-registration" style={{
            display: 'inline-block',
            backgroundColor: 'white',
            color: '#007bff',
            border: '1px solid #007bff',
            padding: '12px 24px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}>
            Become a Prime
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Story;
