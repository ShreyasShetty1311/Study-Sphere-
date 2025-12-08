import { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from './firebase.js';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

const handleSubmit = (e) => {
  e.preventDefault();
  if (!email.endsWith('@bmsce.ac.in')) return alert('Only @bmsce.ac.in emails allowed!');

  if (isLogin) {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = '/dashboard'; // redirects to dashboard
      })
      .catch(() => alert('Wrong password or email'));
  } else {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert('Registered successfully!');
        window.location.href = '/dashboard';
      })
      .catch(err => alert(err.message));
  }
};

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.75)), url("https://imgs.search.brave.com/yucg4YadZHPKzVsH5BPLLgyFUIxlsevZBXmtvWrKAHo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTE2/NzE1OTQxMi92ZWN0/b3IvYmFjay10by1z/Y2hvb2wtc2tldGNo/LWRvb2RsZS1zZXQt/dmVjdG9yLWlsbHVz/dHJhdGlvbi5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9N0Jy/WGtZYTEydXhFYjhj/RkZQWDlET2twMVlm/QUFfUDdmZDRHaV9X/VllmZz0") center/cover no-repeat fixed',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '"Poppins", sans-serif'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.18)',
        padding: '70px 60px',
        width: '720px',
        maxWidth: '94vw',
        borderRadius: '38px',
        boxShadow: '0 35px 80px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(26px)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'white', fontSize: '36px', fontWeight: '800', marginBottom: '30px' }}>
          {isLogin ? 'Study Sphere Login' : 'Study Sphere Register'}
        </h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && <input type="text" placeholder="Full Name" required onChange={e=>setName(e.target.value)} style={{width:'100%',padding:'16px',margin:'12px 0',border:'none',borderRadius:'12px',background:'rgba(255,255,255,0.9)',fontSize:'16px'}} />}
          <input type="email" placeholder="Email (user@bmsce.ac.in)" required value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:'16px',margin:'12px 0',border:'none',borderRadius:'12px',background:'rgba(255,255,255,0.9)',fontSize:'16px'}} />
          <input type="password" placeholder={isLogin?"Password":"Create Password"} required value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:'16px',margin:'12px 0',border:'none',borderRadius:'12px',background:'rgba(255,255,255,0.9)',fontSize:'16px'}} />
          <button type="submit" style={{width:'100%',padding:'16px',marginTop:'20px',border:'none',background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',borderRadius:'14px',fontSize:'18px',fontWeight:'700',cursor:'pointer'}}>
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div style={{marginTop:'25px',color:'#e0e0e0',fontSize:'14px'}}>
          Only <strong>@bmsce.ac.in</strong> emails allowed
        </div>
        <div onClick={()=>setIsLogin(!isLogin)} style={{marginTop:'25px',color:'#a0c4ff',fontSize:'17px',cursor:'pointer',fontWeight:'600'}}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </div>
      </div>
    </div>
  );
}