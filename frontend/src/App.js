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

  const handleUseDemo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/demo-credentials');
      const data = await res.json();
      if (data.notionKey && data.dbId) {
        setNotionKey(data.notionKey);
        setDbId(data.dbId);
        // Optional: Automatically trigger the connection
        localStorage.setItem('notion_key', data.notionKey);
        localStorage.setItem('db_id', data.dbId);
        setIsConfigured(true);
      }
    } catch (err) {
      alert("Could not load demo credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER CONFIG SCREEN ---
  if (!isConfigured) {
    return (
      <div className="App config-container">
        <div className="config-card">
          <h2>Connect Notion</h2>
          <p style={{fontSize: '14px', marginBottom: '20px'}}>
            1. <a href="https://www.notion.so/30962270a2cc809c9cd7e8383f522e4e?v=30962270a2cc803bbdbd000ce73dd7c4&source=copy_link" target="_blank" rel="noreferrer" style={{color: '#2eaadc', fontWeight: '600'}}>Duplicate the Notion Template</a><br/>
            2. Enter your credentials to start studying.
          </p>

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
            <button type="submit" className="study-btn good" style={{width: '100%', marginTop: '10px'}}>Connect & Fetch</button>
          </form>

          {/* This is the "Magic" button for HQ employees */}
          <button 
            type="button" // Important: set to type="button" so it doesn't trigger the form submit
            onClick={handleUseDemo}
            style={{
              background: 'none', 
              border: 'none', 
              color: '#adaba7', 
              fontSize: '12px', 
              cursor: 'pointer', 
              marginTop: '15px',
              textDecoration: 'underline'
            }}
          >
            Or click here to use Demo Credentials
          </button>

          <p className="help-text" style={{marginTop: '20px'}}>Keys are stored locally in your browser.</p>
        </div>

        <div className="footer">
          <p className="help-text">
            Built by Sadnyani • ☕  
            <a 
              href="https://buymeacoffee.com/sadnyani" 
              target="_blank" 
              rel="noreferrer"
              className="support-link"
            >Support this project</a>
          </p>
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

      <div className="footer">
        <p className="help-text">
          Built by Sadnyani • ☕  
          <a 
            href="https://buymeacoffee.com/sadnyani" 
            target="_blank" 
            rel="noreferrer"
            className="support-link"
          >Support this project
          </a>
        </p>
      </div>
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

      <div className="footer">
        <p className="help-text">
          Built by Sadnyani • ☕  
          <a 
            href="https://buymeacoffee.com/sadnyani" 
            target="_blank" 
            rel="noreferrer"
            className="support-link"
          >Support this project
          </a>
        </p>
      </div>
    </div>
  );
}

export default App;