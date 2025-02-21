import React, { useEffect, useState } from 'react';
import DebaterCard from './DebaterCard';
import TopicBanner from './TopicBanner';
import LLMChatBubble from './LLMChatBubble';
import './DebateScreen.css';

const DebateScreen = ({ topic, models, setModels }) => {
  const [finalPositions, setFinalPositions] = useState({});
  const [currentChat, setCurrentChat] = useState(null);

  // Adjusted seat arrays (less overlap, more spread out)
  const demSeats = [
    { top: 55, left: 5 },
    { top: 60, left: 8 },
    { top: 65, left: 12 },
    { top: 57, left: 7 },
    { top: 63, left: 10 },
  ];
  const repSeats = [
    { top: 55, left: 90 },
    { top: 60, left: 88 },
    { top: 65, left: 86 },
    { top: 57, left: 89 },
    { top: 63, left: 87 },
  ];
  const indSeats = [
    { top: 60, left: 48 },
    { top: 63, left: 50 },
    { top: 63, left: 52 },
    { top: 66, left: 49 },
    { top: 66, left: 51 },
  ];

  // Small random offset (±1%)
  const randomOffset = () => Math.floor(Math.random() * 3) - 1;

  // Initially scatter debaters within a narrow range (40%-60% left)
  const scatteredPositions = models.reduce((acc, model) => {
    const randTop = Math.floor(Math.random() * 15 + 55);
    const randLeft = Math.floor(Math.random() * 20 + 40);
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

  // After roulette finalizes, ensure each party is represented and assign final positions.
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

      // Determine the starting speaker: choose from the party with the most members.
      const partyCounts = {
        Democrat: demModels.length,
        Republican: repModels.length,
        Independent: indModels.length,
      };
      const majorityParty = Object.keys(partyCounts).reduce((a, b) =>
        partyCounts[a] >= partyCounts[b] ? a : b
      );
      const majorityGroup = updatedModels.filter((m) => m.affiliation === majorityParty);
      const startingSpeaker = majorityGroup[0];

      // Use a relative URL for the API call to avoid CORS issues.
      fetch(`/api/llm?model=${startingSpeaker.name}`)
        .then((res) => res.json())
        .then((data) => {
          setCurrentChat({ model: startingSpeaker.name, message: data.response });
        })
        .catch((err) => {
          console.error(err);
          setCurrentChat({ model: startingSpeaker.name, message: 'Error fetching message.' });
        });
    }
  }, [models, setModels]);

  return (
    <div className="debate-screen">
      <div
        className="debate-background"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/GoldenCongress.png)`,
          backgroundSize: 'cover',
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
      {currentChat && <LLMChatBubble model={currentChat.model} message={currentChat.message} />}
    </div>
  );
};

export default DebateScreen;
