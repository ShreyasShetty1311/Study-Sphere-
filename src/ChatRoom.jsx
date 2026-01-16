// src/ChatRoom.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase.js';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc 
} from 'firebase/firestore';
import Whiteboard from './Whiteboard.jsx';

export default function ChatRoom() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupName, setGroupName] = useState('Loading...');
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const groupRef = doc(db, "groups", groupId);
    const unsubGroup = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) setGroupName(docSnap.data().name);
    });

    const q = query(collection(db, "groups", groupId, "messages"), orderBy("timestamp", "asc"));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubGroup();
      unsubMessages();
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, "groups", groupId, "messages"), {
      text: newMessage,
      sender: auth.currentUser.email,
      timestamp: serverTimestamp()
    });
    setNewMessage('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'  // Force full viewport height
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexShrink: 0  // Prevent header from shrinking
      }}>
        <button onClick={() => navigate('/dashboard')} style={{ 
          color: 'white', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' 
        }}>
          Back
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>{groupName}</h1>
      </div>

      {/* Tabs + Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0  // Allows child to scroll
      }}>
        {/* Tabs */}
        <div style={{
          padding: '0.8rem 2rem',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <button
            onClick={() => setShowWhiteboard(false)}
            style={{
              padding: '8px 20px',
              background: !showWhiteboard ? '#667eea' : 'transparent',
              border: '1px solid #667eea',
              color: 'white',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: !showWhiteboard ? 'bold' : 'normal'
            }}
          >
            Chat
          </button>
          <button
            onClick={() => setShowWhiteboard(true)}
            style={{
              padding: '8px 20px',
              background: showWhiteboard ? '#667eea' : 'transparent',
              border: '1px solid #667eea',
              color: 'white',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: showWhiteboard ? 'bold' : 'normal'
            }}
          >
            Whiteboard
          </button>
        </div>

        {/* Content - full height, scrollable when needed */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {showWhiteboard ? (
            <div style={{ flex: 1 }}>
              <Whiteboard groupId={groupId} />
            </div>
          ) : (
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem', margin: 'auto 0' }}>
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      margin: '1rem 0',
                      textAlign: msg.sender === auth.currentUser.email ? 'right' : 'left'
                    }}
                  >
                    <div style={{
                      display: 'inline-block',
                      maxWidth: '70%',
                      background: msg.sender === auth.currentUser.email ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.15)',
                      padding: '12px 18px',
                      borderRadius: '18px',
                      borderBottomRightRadius: msg.sender === auth.currentUser.email ? '4px' : '18px',
                      borderBottomLeftRadius: msg.sender === auth.currentUser.email ? '18px' : '4px',
                    }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', opacity: 0.8 }}>
                        {msg.sender.split('@')[0]}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.1rem' }}>{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input - only in chat */}
      {!showWhiteboard && (
        <form onSubmit={sendMessage} style={{
          padding: '1.5rem 2rem',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          gap: '1rem',
          flexShrink: 0
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: '50px',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: '16px'
            }}
          />
          <button type="submit" style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none',
            borderRadius: '50px',
            color: 'white',
            cursor: 'pointer'
          }}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}