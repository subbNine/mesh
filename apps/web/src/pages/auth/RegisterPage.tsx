import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ firstName, lastName, userName, email, password });
      navigate('/workspaces', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-900 text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6 bg-zinc-800 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        {error && <div className="p-2 bg-red-900/50 text-red-200 border border-red-500 rounded">{error}</div>}
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={firstName} 
            onChange={e => setFirstName(e.target.value)} 
            placeholder="First Name" 
            className="p-2 w-full rounded bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
          <input 
            type="text" 
            value={lastName} 
            onChange={e => setLastName(e.target.value)} 
            placeholder="Last Name" 
            className="p-2 w-full rounded bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
        </div>
        <input 
          type="text" 
          value={userName} 
          onChange={e => setUserName(e.target.value)} 
          placeholder="Username" 
          className="p-2 rounded bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          required 
        />
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Email address" 
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
          minLength={8}
        />
        <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">
          Create Account
        </button>
        <p className="text-sm mt-4 text-center">
          Already have an account? <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/login')}>Sign In</span>
        </p>
      </form>
    </div>
  );
}
