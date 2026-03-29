import React, { useEffect } from 'react'
import './FeatureModal.css'

const FeatureModal = ({ isOpen, onClose, feature }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="feature-modal-overlay" onClick={onClose}>
            <div className="feature-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="feature-modal-close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>

                <div className="feature-modal-header">
                    <div className="feature-modal-icon" style={{ background: feature.gradient }}>
                        {feature.icon}
                    </div>
                    <h2>{feature.title}</h2>
                </div>

                <div className="feature-modal-body">
                    <p className="feature-modal-description">{feature.longDescription}</p>

                    <div className="feature-modal-benefits">
                        <h3>Key Benefits:</h3>
                        <ul>
                            {feature.benefits.map((benefit, index) => (
                                <li key={index}>
                                    <svg className="benefit-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="feature-modal-footer">
                    <button className="feature-modal-btn" onClick={onClose}>
                        Got it
                    </button>
                </div>
            </div>
        </div>
    )
}

export default FeatureModal