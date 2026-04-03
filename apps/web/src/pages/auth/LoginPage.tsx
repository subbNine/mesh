import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/workspaces', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-900 text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6 bg-zinc-800 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <div className="p-2 bg-red-900/50 text-red-200 border border-red-500 rounded">{error}</div>}
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Email" 
          className="p-2 rounded bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          required 
        />
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Password" 
          className="p-2 rounded bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          required 
        />
        <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">
          Sign In
        </button>
        <p className="text-sm mt-4 text-center">
          Don't have an account? <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/register')}>Sign Up</span>
        </p>
      </form>
    </div>
  );
}
