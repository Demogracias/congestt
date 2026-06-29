import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const originalFetch = window.fetch;
window.fetch = function(input, init) {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.token) {
        init = init || {};
        init.headers = init.headers || {};
        init.headers['Authorization'] = 'Bearer ' + user.token;
      }
    }
  } catch {}
  return originalFetch.call(this, input, init).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      window.location.reload();
    }
    return res;
  });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
