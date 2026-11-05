import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => (
  <div className="notfound-page">
    <div className="notfound-content">
      <div className="notfound-code">404</div>
      <h1>Page Not Found</h1>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <div className="notfound-actions">
        <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
        <Link to="/services" className="btn btn-secondary btn-lg">Browse Services</Link>
      </div>
    </div>
  </div>
);

export default NotFound;
