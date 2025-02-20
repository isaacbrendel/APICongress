import React, { useEffect, useState } from 'react';
import DebaterCard from './DebaterCard';
import TopicBanner from './TopicBanner';
import './DebateScreen.css';

const DebateScreen = ({ topic, models, setModels }) => {
  const [finalPositions, setFinalPositions] = useState({});

  // Updated seat arrays:
  // Democrats now land more left.
  const demSeats = [
    { top: 55, left: 5 },
    { top: 60, left: 8 },
    { top: 65, left: 12 },
    { top: 57, left: 7 },
    { top: 63, left: 10 },
  ];
  const repSeats = [
    { top: 55, left: 90 },
    { top: 60, left: 82 },
    { top: 65, left: 84 },
    { top: 57, left: 85 },
    { top: 63, left: 75 },
  ];
  const indSeats = [
    { top: 60, left: 48 },
    { top: 65, left: 50 },
    { top: 65, left: 55 },
    { top: 66, left: 49 },
    { top: 66, left: 52 },
  ];

  // Use a small random offset (±1%) for slight variation.
  const randomOffset = () => Math.floor(Math.random() * 3) - 1;

  // Initially scatter debaters within a defined band.
  const scatteredPositions = models.reduce((acc, model) => {
    const randTop = Math.floor(Math.random() * 15 + 55);
    const randLeft = Math.floor(Math.random() * 40 + 30); // narrower range (30-70)
    acc[model.id] = { top: randTop, left: randLeft };
    return acc;
  }, {});

  useEffect(() => {
    setFinalPositions(scatteredPositions);
  }, [models]);

  // Roulette effect: randomize affiliation every 100ms for 3 seconds.
  useEffect(() => {
    const affiliations = ['Republican', 'Democrat', 'Independent'];
    const getRandomAffiliation = () =>
      affiliations[Math.floor(Math.random() * affiliations.length)];

    const interval = setInterval(() => {
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: false,
        }))
      );
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: true,
        }))
      );
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [setModels]);

  // After roulette, ensure each party has at least one member, then assign positions.
  useEffect(() => {
    if (models.length > 0 && models.every((m) => m.isFinalized)) {
      let updatedModels = [...models];
      const count = {
        Democrat: updatedModels.filter((m) => m.affiliation === 'Democrat').length,
        Republican: updatedModels.filter((m) => m.affiliation === 'Republican').length,
        Independent: updatedModels.filter((m) => m.affiliation === 'Independent').length,
      };
      const parties = ['Democrat', 'Republican', 'Independent'];
      parties.forEach((party) => {
        if (count[party] === 0) {
          let donor = parties.reduce((max, cur) =>
            count[cur] > count[max] ? cur : max,
            parties[0]
          );
          if (count[donor] > 1) {
            for (let i = 0; i < updatedModels.length; i++) {
              if (updatedModels[i].affiliation === donor) {
                updatedModels[i].affiliation = party;
                count[donor]--;
                count[party]++;
                break;
              }
            }
          }
        }
      });

      let newPositions = {};
      const demModels = updatedModels.filter((m) => m.affiliation === 'Democrat');
      const repModels = updatedModels.filter((m) => m.affiliation === 'Republican');
      const indModels = updatedModels.filter((m) => m.affiliation === 'Independent');

      demModels.forEach((m, i) => {
        let seat = demSeats[i] || demSeats[0];
        newPositions[m.id] = {
          top: seat.top + randomOffset(),
          left: seat.left + randomOffset(),
        };
      });
      repModels.forEach((m, i) => {
        let seat = repSeats[i] || repSeats[0];
        newPositions[m.id] = {
          top: seat.top + randomOffset(),
          left: seat.left + randomOffset(),
        };
      });
      indModels.forEach((m, i) => {
        let seat = indSeats[i] || indSeats[0];
        newPositions[m.id] = {
          top: seat.top + randomOffset(),
          left: seat.left + randomOffset(),
        };
      });
      setFinalPositions(newPositions);
    }
  }, [models, setModels]);

  return (
    <div className="debate-screen">
      <div
        className="debate-background"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/GoldenCongress.png)`,
          backgroundSize: 'cover', // ensures full coverage
        }}
      ></div>
      <TopicBanner topic={topic} />
      <button
        className="reassign-button"
        onClick={() => {
          const affiliations = ['Republican', 'Democrat', 'Independent'];
          const getRandomAffiliation = () =>
            affiliations[Math.floor(Math.random() * affiliations.length)];
          const interval = setInterval(() => {
            setModels((prev) =>
              prev.map((m) => ({
                ...m,
                affiliation: getRandomAffiliation(),
                isFinalized: false,
              }))
            );
          }, 100);
          setTimeout(() => {
            clearInterval(interval);
            setModels((prev) =>
              prev.map((m) => ({
                ...m,
                affiliation: getRandomAffiliation(),
                isFinalized: true,
              }))
            );
          }, 3000);
        }}
      >
        Reassign Affiliations
      </button>
      <div className="debaters-container">
        {models.map((m) => {
          const pos = finalPositions[m.id] || { top: 60, left: 50 };
          return (
            <div
              key={m.id}
              className="debater-position"
              style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
            >
              <DebaterCard name={m.name} logo={m.logo} affiliation={m.affiliation} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DebateScreen;
