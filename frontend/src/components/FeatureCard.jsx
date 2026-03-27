import React from 'react'
import './FeatureCard.css'

const FeatureCard = ({ icon, title, description, color }) => {
    return (
        <div className="feature-card">
            <div className="feature-icon" style={{ background: color }}>
                {icon}
            </div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{description}</p>
        </div>
    )
}

export default FeatureCard