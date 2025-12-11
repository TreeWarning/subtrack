import React, { useState } from 'react';
import MonthlyDashboard from './components/MonthlyDashboard';
import SubscriptionManager from './components/SubscriptionManager';

const App = () => {
  // State to switch between the two views
  const [view, setView] = useState('dashboard');

  // Basic styling assumes a modern CSS framework like Tailwind (which your components use)
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="p-4 bg-gray-800 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Subscription Tracker</h1>
          <div>
            <button
              onClick={() => setView('dashboard')}
              className={`mr-4 px-4 py-2 rounded transition ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              Dashboard (Current Month)
            </button>
            <button
              onClick={() => setView('manager')}
              className={`px-4 py-2 rounded transition ${view === 'manager' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              Subscription Manager
            </button>
          </div>
        </div>
      </nav>

      <main className="py-8">
        {view === 'dashboard' ? (
          <MonthlyDashboard />
        ) : (
          <SubscriptionManager />
        )}
      </main>
    </div>
  );
};

export default App;