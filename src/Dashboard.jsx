import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase.js';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc 
} from 'firebase/firestore';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(setUser);
    const q = query(collection(db, "groups"));
    const unsubGroups = onSnapshot(q, (snapshot) => {
      const loadedGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(loadedGroups);
    });
    return () => { unsubAuth(); unsubGroups(); };
  }, []);

  const createGroup = async () => {
    if (!groupName.trim()) return alert("Enter group name!");
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await addDoc(collection(db, "groups"), {
      name: groupName,
      code: code,
      creator: user.email,
      members: [user.email],
      createdAt: new Date()
    });
    setGroupName('');
    setShowCreate(false);
    alert(`Group created! Share code: ${code}`);
  };

const joinGroup = async () => {
  if (!joinCode.trim()) {
    alert("Please enter the code!");
    return;
  }

  try {
    const q = query(collection(db, "groups"), where("code", "==", joinCode.trim().toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Wrong code! No group found with this code.");
      return;
    }

    const groupDoc = snapshot.docs[0];
    const groupData = groupDoc.data();

    // Already a member?
    if (groupData.members.includes(user.email)) {
      alert("You are already in this group!");
      setShowJoin(false);
      return;
    }

    // Add user to group
    await updateDoc(groupDoc.ref, {
      members: [...groupData.members, user.email]
    });

    alert(`Successfully joined "${groupData.name}" !`);
    setJoinCode('');
    setShowJoin(false);
  } catch (error) {
    alert("Something went wrong. Try again.");
    console.error(error);
  }
};

  const handleLogout = () => signOut(auth).then(() => window.location.href = '/');

  const filtered = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', padding: '2rem', fontFamily: '"Poppins", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800 }}>StudySphere</h1>
          <p style={{ color: '#94a3b8' }}>Welcome, {user?.email?.split('@')[0]}!</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '12px 28px', background: '#ef4444', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <input placeholder="Search groups..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#1e293b', color: 'white' }} />
        <button onClick={() => setShowCreate(true)} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '16px', color: 'white', fontWeight: 'bold' }}>
          Create Group
        </button>
        <button onClick={() => setShowJoin(true)} style={{ padding: '16px 32px', background: '#334155', border: '2px dashed #64748b', borderRadius: '16px', color: 'white', fontWeight: 'bold' }}>
          Join Group
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '20px', width: '400px' }}>
            <h2>Create New Group</h2>
            <input placeholder="Group Name (e.g., Semester 6 AI)" value={groupName} onChange={e=>setGroupName(e.target.value)}
              style={{ width: '100%', padding: '14px', margin: '1rem 0', borderRadius: '10px', border: 'none', background: '#334155', color: 'white' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={createGroup} style={{ flex: 1, padding: '14px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white' }}>Create</button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '14px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '20px', width: '400px' }}>
            <h2>Join Group</h2>
            <input placeholder="Enter 6-digit code" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
              style={{ width: '100%', padding: '14px', margin: '1rem 0', borderRadius: '10px', border: 'none', background: '#334155', color: 'white' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={joinGroup} style={{ flex: 1, padding: '14px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: 'white' }}>Join</button>
              <button onClick={() => setShowJoin(false)} style={{ flex: 1, padding: '14px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Cards */}
            {/* Group Cards - NOW CLICKABLE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
        {filtered.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '1.4rem', color: '#94a3b8' }}>
            No groups yet. Create the first one!
          </p>
        ) : (
          filtered.map(g => (
            <div
              key={g.id}
              onClick={() => navigate(`/chat/${g.id}`)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '2rem',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-12px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h3 style={{ fontSize: '1.7rem', marginBottom: '0.8rem', fontWeight: '700' }}>
                {g.name}
              </h3>
              <p style={{ color: '#c4b5fd', margin: '0.5rem 0' }}>
                Code: <strong>{g.code}</strong>
              </p>
              <p style={{ color: '#93c5fd' }}>
                {g.members?.length || 1} members
              </p>
              <p style={{ color: '#86efac', marginTop: '1.2rem', fontSize: '1rem', fontWeight: '600' }}>
                Click to enter chat →
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}