import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Utensils,
  Building2,
  Sparkles,
  MapPin,
  History,
  BarChart3,
  Binary,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  Bell,
  Cpu
} from 'lucide-react';

interface AppLayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onPageChange,
  children
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'donations', label: 'Food Donations', icon: Utensils },
    { id: 'recipients', label: 'Recipient Orgs', icon: Building2 },
    { id: 'matching', label: 'Smart Matching', icon: Sparkles, highlight: true },
    { id: 'routes', label: 'Route Planner', icon: MapPin },
    { id: 'history', label: 'Allocation History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'visualizer', label: 'Algorithm Visualizer', icon: Binary },
    { id: 'settings', label: 'Settings / About', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#FBFBFA] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 shadow-sm ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {!collapsed ? (
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 tracking-tight leading-none text-base">
                    FOOD RESCUE
                  </h1>
                  <p className="text-[10px] text-emerald-800 font-medium tracking-wide">
                    Smart Redistribution
                  </p>
                </div>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                <Cpu className="w-2.5 h-2.5 text-emerald-700" />
                <span>DSA-Powered Sustainability</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    active ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500 group-hover:text-emerald-700'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 text-left flex items-center justify-between">
                    {item.label}
                    {item.highlight && !active && (
                      <span className="ml-2 px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded">
                        DSA
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!collapsed ? (
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SAKEC AIDS Dept</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Shah & Anchor Kutchhi Engg.
              </p>
              <div className="mt-2 text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Backend: C++17 Core
              </div>
            </div>
          ) : (
            <div className="text-center" title="SAKEC AIDS Project">
              <ShieldCheck className="w-5 h-5 text-emerald-700 mx-auto" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 capitalize tracking-tight">
                {navItems.find((n) => n.id === currentPage)?.label || 'Overview'}
              </h2>
              <p className="text-xs text-slate-500">
                Food Rescue Expiry-Time Redistribution Network • Mumbai Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-mono font-medium">{currentTime || '--:--:--'} IST</span>
            </div>

            {/* Backend Engine Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>C++ Engine Active</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative transition-colors"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">System Notifications</span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Live
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                      <p className="font-semibold text-emerald-900">Dijkstra Routing Loaded</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Connected road network initialized with 11 Mumbai vertices.
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="font-semibold text-slate-800">Min-Heap Determinism</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Earliest expiry priority queue active for surplus allocations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                SK
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">SAKEC AIDS</p>
                <p className="text-[10px] text-slate-500 leading-tight">SY Microproject</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#FBFBFA]">
          {children}
        </main>
      </div>
    </div>
  );
};
