export const apiFetch = async (url, options = {}) => {
  const user = JSON.parse(localStorage.getItem('gymflow_user'));
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (user && user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expiré ou invalide
    localStorage.removeItem('gymflow_user');
    window.location.href = '/login';
  }

  return response;
};
