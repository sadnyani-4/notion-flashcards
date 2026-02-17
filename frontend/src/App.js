import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // State for user credentials
  const [notionKey, setNotionKey] = useState(localStorage.getItem('notion_key') || '');
  const [dbId, setDbId] = useState(localStorage.getItem('db_id') || '');
  const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('notion_key'));
  const [isLoading, setIsLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!notionKey || !dbId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/cards', {
        headers: {
          'x-notion-key': notionKey,
          'x-notion-db-id': dbId
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCards(data);
      } else {
        alert("Error: " + data.error);
        setIsConfigured(false); // Force back to login if keys are wrong
      }
    } catch (err) {
      console.error("Error loading cards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [notionKey, dbId]);

  useEffect(() => {
    if (isConfigured) {
      fetchCards();
    }
  }, [isConfigured, fetchCards]);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (notionKey && dbId) {
      localStorage.setItem('notion_key', notionKey);
      localStorage.setItem('db_id', dbId);
      setIsConfigured(true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setNotionKey('');
    setDbId('');
    setIsConfigured(false);
    setCards([]);
  };

  const handleStudy = async (level) => {
    const card = cards[currentIndex];
    
    await fetch('/api/update-card', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-notion-key': notionKey,
        'x-notion-db-id': dbId
      },
      body: JSON.stringify({
        pageId: card.id,
        level: level,
        currentTimesStudied: card.timesStudied
      })
    });

    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        alert("Deck finished! Refresh to see updated intervals.");
        setCurrentIndex(0);
      }
    }, 150);
  };

  // --- RENDER CONFIG SCREEN ---
  if (!isConfigured) {
    return (
      <div className="App config-container">
        <div className="config-card">
          <h2>Connect Notion</h2>
          <p>Enter your integration details to start studying.</p>
          <form onSubmit={handleSaveConfig}>
            <input 
              type="password"
              placeholder="Internal Integration Secret" 
              value={notionKey} 
              onChange={(e) => setNotionKey(e.target.value)} 
              required
            />
            <input 
              type="text"
              placeholder="Database ID" 
              value={dbId} 
              onChange={(e) => setDbId(e.target.value)} 
              required
            />
            <button type="submit" className="study-btn good">Connect & Fetch</button>
          </form>
          <p className="help-text">Keys are stored locally in your browser.</p>
        </div>
      </div>
    );
  }

  // --- RENDER LOADING ---
  if (isLoading) return <div className="App">Fetching cards from Notion...</div>;
  if (cards.length === 0) return (
    <div className="App">
      <p>No cards found or database empty.</p>
      <button onClick={handleLogout} className="study-btn">Back to Setup</button>
    </div>
  );

  // --- RENDER FLASHCARDS ---
  const currentCard = cards[currentIndex];

  return (
    <div className="App">
      <div className="nav-header">
        <button className="logout-link" onClick={handleLogout}>← Change Database</button>
      </div>
      
      <h1>Flashcards</h1>
      
      <div className="card-container" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="card-front">{currentCard.question}</div>
          <div className={`card-back ${isFlipped ? 'show' : ''}`}>{currentCard.answer}</div>
        </div>
      </div>

      {isFlipped && (
        <div className="button-group">
          <button className="study-btn again" onClick={() => handleStudy('Again')}>Again</button>
          <button className="study-btn hard" onClick={() => handleStudy('Hard')}>Hard</button>
          <button className="study-btn good" onClick={() => handleStudy('Good')}>Good</button>
          <button className="study-btn easy" onClick={() => handleStudy('Easy')}>Easy</button>
        </div>
      )}
      
      {!isFlipped && <p className="hint">Click the card to see the answer</p>}
    </div>
  );
}

export default App;