import { useState } from 'react';
import AppointmentsPage from '../../appointments/pages/AppointmentsPage';
import WeightPage from '../../weight/pages/WeightPage';
import './HealthPage.css';

const TABS = [
  { id: 'appointments', label: 'Citas' },
  { id: 'weight', label: 'Peso' },
];

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState('appointments');

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Salud</h1>
      </div>

      {/* Segmented tabs */}
      <div className="health-tabs">
        <div className="health-tabs-bg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`health-tab ${activeTab === tab.id ? 'health-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div
            className="health-tab-pill"
            style={{
              left: activeTab === 'appointments' ? '3px' : 'calc(50% + 1.5px)',
              width: 'calc(50% - 4.5px)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="health-content">
        {activeTab === 'appointments' && <AppointmentsPage />}
        {activeTab === 'weight' && <WeightPage />}
      </div>
    </div>
  );
}
