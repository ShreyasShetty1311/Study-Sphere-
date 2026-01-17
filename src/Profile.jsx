// src/Profile.jsx - FINAL FIXED VERSION (with full error handling)
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, query, onSnapshot, collection ,setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Extract name from email (everything before @)
const userName = user?.email 
  ? user.email.split('@')[0] 
  : 'User';

  // Auth state
  useEffect(() => {
    console.log('[Profile] Waiting for auth...');
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log('[Profile] Auth resolved:', currentUser ? currentUser.email : 'NO USER');
      setUser(currentUser);
      setLoadingAuth(false);
    }, (err) => {
      console.error('[Profile] Auth error:', err);
      setError('Auth error: ' + err.message);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

// Replace your existing streak useEffect with this one
useEffect(() => {
  if (!user || loadingAuth) return;

  const updateStreakOnLoad = async () => {
    try {
      const userDoc = doc(db, "users", user.uid);
      const snap = await getDoc(userDoc);

      let currentStreak = 0;
      let lastActive = null;

      if (snap.exists()) {
        const data = snap.data();
        currentStreak = data.streak || 0;
        lastActive = data.lastActive?.toDate();
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      let newStreak = 1; // Default: today counts as active (start or continue streak)

      if (lastActive) {
        const last = new Date(lastActive);
        last.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today - last) / 86400000); // days difference

        if (diffDays === 0) {
          // Same day → keep current streak (don't increase again today)
          newStreak = currentStreak;
        } else if (diffDays === 1) {
          // Yesterday → increase
          newStreak = currentStreak + 1;
        } else {
          // Missed days → reset to 1 (today starts new streak)
          newStreak = 1;
        }
      }

      // Save if changed or first time
      if (newStreak !== currentStreak || !snap.exists()) {
        await setDoc(userDoc, {
          streak: newStreak,
          lastActive: new Date(),
          timeSpent: snap.exists() ? snap.data().timeSpent || 0 : 0
        }, { merge: true });

        console.log(`[Streak] Updated to ${newStreak} (was ${currentStreak})`);
      } else {
        console.log(`[Streak] No change needed (still ${currentStreak})`);
      }

      setStreak(newStreak);
    } catch (err) {
      console.error('[Streak] Error:', err);
    }
  };

  updateStreakOnLoad(); // Run immediately on profile load
}, [user, loadingAuth]);
  // Time tracking
 // 1. Time tracking (run always when logged in)
useEffect(() => {
  if (!user) return;

  console.log('[Time] Starting session timer');
  const interval = setInterval(() => {
    setSessionTime(prev => {
      const newTime = prev + 1;
      console.log('[Time] Session time now:', newTime); // debug log
      return newTime;
    });
  }, 1000);

  return () => {
    console.log('[Time] Stopping session timer');
    clearInterval(interval);
  };
}, [user]);

// 2. Save to Firestore every 10 seconds (instead of 30s - faster feedback)
useEffect(() => {
  if (!user || sessionTime < 5) return; // save only after at least 5s

  const saveTime = async () => {
    try {
      const userDoc = doc(db, "users", user.uid);
      const snap = await getDoc(userDoc);

      const currentTotal = snap.exists() ? snap.data().timeSpent || 0 : 0;
      const newTotal = currentTotal + sessionTime;

      await setDoc(userDoc, {
        timeSpent: newTotal,
        lastActive: new Date(),
        email: user.email
      }, { merge: true });

      console.log('[Time] Saved to Firestore:', newTotal, 'seconds total');
      setTotalTime(newTotal); // Update UI immediately
      setSessionTime(0);      // Reset session counter
    } catch (err) {
      console.error('[Time] Save failed:', err.code, err.message);
      setError('Time save error: ' + err.message);
    }
  };

  const timer = setInterval(saveTime, 10000); // every 10 seconds

  // Save immediately on unmount (good practice)
  return () => {
    clearInterval(timer);
    if (sessionTime > 0) saveTime(); // final save
  };
}, [user, sessionTime]);

  // Load profile data with try-catch
  useEffect(() => {
    if (!user) return;

    console.log('[Profile] Loading Firestore data for uid:', user.uid);
    setLoadingData(true);
    setError(null);

    const userDoc = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userDoc, (snap) => {
      console.log('[Profile] Firestore snapshot:', snap.exists() ? 'exists' : 'missing');
      if (snap.exists()) {
        const data = snap.data();
        setTotalTime(data.timeSpent || 0);
        setStreak(data.streak || 0);
      }
      setLoadingData(false);
    }, (err) => {
      console.error('[Profile] Firestore ERROR:', err.code, err.message);
      setError(`Firestore error: ${err.message} (${err.code})`);
      setLoadingData(false);
    });

    return () => {
      console.log('[Profile] Unsubscribing Firestore');
      unsubscribe();
    };
  }, [user]);

  // Groups loading
  useEffect(() => {
    if (!user) return;

    console.log('[Profile] Loading groups...');
    const q = query(collection(db, "groups"));
    const unsubscribe = onSnapshot(q, (snap) => {
      console.log('[Profile] Groups loaded:', snap.docs.length);
      const enrolled = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(g => g.members?.includes(user.email));
      setGroups(enrolled);
    }, (err) => {
      console.error('[Profile] Groups error:', err);
      setError('Groups loading error: ' + err.message);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Rendering logic
  if (loadingAuth) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>Loading authentication...</div>;
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
        Please login to view your profile
        <button 
          onClick={() => navigate('/')}
          style={{ marginTop: '1rem', padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer' }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: '#ef4444' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
          Most likely: Firestore permission issue. Try switching to test mode rules.
        </p>
      </div>
    );
  }

  if (loadingData) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>Loading your profile...</div>;
  }

  // Full UI
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      color: 'white',
      padding: '2rem',
      fontFamily: '"Poppins", sans-serif'
    }}>
      <button onClick={() => navigate('/dashboard')} style={{
        padding: '12px 24px',
        background: '#334155',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        cursor: 'pointer',
        marginBottom: '2rem'
      }}>
        ← Back to Dashboard
      </button>

      <h1 style={{ fontSize: '2.8rem', marginBottom: '2rem' }}>{userName}'s Profile</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div style={cardStyle}>
          <h2>Time Spent</h2>
          <p style={{ fontSize: '2.5rem', color: '#86efac' }}>
            {formatTime(totalTime + sessionTime)}
          </p>
        </div>

        <div style={cardStyle}>
          <h2>Streak</h2>
          <p style={{ fontSize: '3rem', color: '#fbbf24' }}>
            {streak} 🔥
          </p>
        </div>

        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h2>Enrolled Groups</h2>
          {groups.length === 0 ? (
            <p>No groups yet. Join some from Dashboard!</p>
          ) : (
            groups.map(g => (
              <div key={g.id} onClick={() => navigate(`/chat/${g.id}`)} style={groupCard}>
                <h3>{g.name}</h3>
                <p>Code: {g.code}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: 'rgba(255,255,255,0.08)',
  padding: '2rem',
  borderRadius: '20px',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.12)',
  textAlign: 'center'
};

const groupCard = {
  background: 'rgba(255,255,255,0.1)',
  padding: '1rem',
  borderRadius: '12px',
  margin: '1rem 0',
  cursor: 'pointer'
};