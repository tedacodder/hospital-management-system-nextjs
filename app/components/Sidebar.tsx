import React from 'react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: 'grid-fill', label: 'Dashboard' },
    { id: 'patients', icon: 'people-fill', label: 'Patients' },
    { id: 'appointments', icon: 'calendar-event', label: 'Appointments' }
  ];

  return (
    <div
      className={`sidebar bg-white border-end ${sidebarOpen ? 'show' : ''}`}
      style={{ width: '16rem', minHeight: '100vh' }}
    >
      <div className="sidebar-header bg-primary text-white text-center p-3">
        <h5 className="mb-0">🏥 MediCare</h5>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item btn w-100 text-start ${
              activeSection === item.id ? 'active text-white bg-primary' : ''
            }`}
            onClick={() => {
              setActiveSection(item.id);
              setSidebarOpen(false);
            }}
          >
            <i className={`bi bi-${item.icon} me-2`} />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
