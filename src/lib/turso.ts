import { createClient } from '@libsql/client';

// التحقق من المتغيرات البيئية المطلوبة
const getDatabaseUrl = (): string => {
  const url = import.meta.env.VITE_TURSO_DATABASE_URL;
  if (!url) {
    throw new Error('Missing Turso env vars');
  }
  return url;
};

const getAuthToken = (): string => {
  const token = import.meta.env.VITE_TURSO_AUTH_TOKEN;
  if (!token) {
    throw new Error('Missing Turso env vars');
  }
  return token;
};

// إنشاء عميل Turso
export const turso = createClient({
  url: getDatabaseUrl(),
  authToken: getAuthToken(),
});

// مثال للاستخدام مع React useEffect
export const useTursoQuery = (query: string) => {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await turso.execute(query);
        setData(result.rows);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  return { data, loading, error };
};
