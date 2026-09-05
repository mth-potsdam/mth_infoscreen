import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../api/queries';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync(password);
      navigate('/admin');
    } catch {
      // surfaced via login.isError below
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__form" onSubmit={handleSubmit}>
        <h1>Infoscreen Admin</h1>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </label>
        {login.isError && <p className="admin-error">Invalid password</p>}
        <button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
