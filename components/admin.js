import { renderHeader } from './header.js';
import { supabase } from '../utils/supabaseClient.js';

async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('email,is_premium,stripe_customer_id');
  if (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
  return data || [];
}

async function cancelSubscription(email) {
  const res = await fetch('/api/cancel-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const result = await res.json();
  alert(result.message || result.error);
}

export async function renderAdminScreen() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  renderHeader(app, renderAdminScreen);

  const container = document.createElement('div');
  container.className = 'screen active admin-screen';
  app.appendChild(container);

  const title = document.createElement('h2');
  title.textContent = 'ユーザー一覧';
  container.appendChild(title);

  const table = document.createElement('table');
  table.className = 'admin-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Email</th>
        <th>is_premium</th>
        <th>customer_id</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  container.appendChild(table);

  async function load() {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    const users = await fetchUsers();
    users.forEach((u) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.email || ''}</td>
        <td>${u.is_premium ? 'true' : 'false'}</td>
        <td>${u.stripe_customer_id || ''}</td>
        <td></td>
      `;
      if (u.is_premium) {
        const btn = document.createElement('button');
        btn.textContent = 'キャンセル';
        btn.onclick = async () => {
          await cancelSubscription(u.email);
          await load();
        };
        tr.lastElementChild.appendChild(btn);
      }
      tbody.appendChild(tr);
    });
  }

  load();
}
