import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Card } from '../components/ui/index.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@biz.local');
  const [password, setPassword] = useState('owner12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl">💼</div>
          <h1 className="mt-2 text-xl font-bold">Фінанси бізнесу</h1>
          <p className="text-sm text-slate-500">Увійдіть у свій акаунт</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Вхід…' : 'Увійти'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Тестові акаунти створюються командою seed
        </p>
      </Card>
    </div>
  );
}
