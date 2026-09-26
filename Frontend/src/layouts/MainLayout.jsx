import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ activePage, setActivePage, children, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-container flex min-h-screen w-full bg-[#080c15]">
      {/* Desktop Sidebar (visible on md+, hidden on mobile) */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
            setMobileOpen(false);
          }}
          collapsed={false}
          setCollapsed={() => setMobileOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="main-content-wrapper flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#080c15]">
        <Topbar
          activePage={activePage}
          onNavigate={setActivePage}
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
          onRefresh={onRefresh}
        />

        <main className="page-container flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
