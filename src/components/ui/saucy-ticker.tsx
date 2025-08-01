import React from 'react';
import Marquee from 'react-fast-marquee';

const SaucyTicker: React.FC = () => {
    const phrases = [
        "Posin'",
        "That's my angle",
        "Just for the gram",
        "Actin' brand new",
        "Cappin'",
        "Lookin' Fab",
        "Glow Up Suspiciously",
        "Fake it 'til you make it",
    ];

    return (
        <div className="ticker-container">
            <Marquee
                speed={50}
                gradient={false}
                pauseOnHover={true}
                direction="right"
                delay={0}
                loop={0} // 0 = infinite
            >
                {phrases.map((phrase, index) => (
                    <span key={index} className="ticker-item">
                  {phrase}
                        {/* Add separator between items */}
                        {index < phrases.length - 1 && <span className="separator"> • </span>}
          </span>
                ))}
            </Marquee>
        </div>
    );
};

export {SaucyTicker};
