import React, { useState } from 'react';
import './EasterEggPopup.css';
import easterEggIcon from '../assets/easter-egg.jpg';
import comoaraImage from '../assets/comoara-cu-clatite.jpg';

const EasterEggPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [giftVisible, setGiftVisible] = useState(true);

  const openModal = () => setIsOpen(true);

  const closeModalAndHideGift = () => {
    setIsOpen(false);
    setGiftVisible(false);
  };

  const closeModalOnly = () => {
    setIsOpen(false);
  };

  if (!giftVisible) return null;

  return (
    <>
      <div className="gift-icon" onClick={openModal}>
        <img src={easterEggIcon} alt="Easter egg" className="egg-trigger" />
      </div>

      {isOpen && (
        <div className="easter-egg-overlay" onClick={closeModalOnly}>
          <div className="easter-egg-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModalAndHideGift}>×</button>
            <img src={comoaraImage} alt="Comoară cu clătite" className="easter-egg-image" />
            <h2>🎉 Felicitări! 🎉</h2>
            <p>
              <strong>Ai găsit easter egg-ul nostru!</strong><br /><br />
              Îți mulțumim că ai avut încredere să apelezi la serviciile noastre.<br />
              Ca semn de apreciere, primești acest <strong>tichet special</strong>!
            </p>
            <button className="claim-button" onClick={closeModalAndHideGift}>
              Închide
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EasterEggPopup;