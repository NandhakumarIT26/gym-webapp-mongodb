import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, CreditCard, ClipboardCheck,
    Bell, DollarSign, TrendingUp, LogOut, X, PhoneCall
} from 'lucide-react';

const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Members', to: '/members', icon: Users },
    { label: 'Plans', to: '/plans', icon: CreditCard },
    { label: 'Attendance', to: '/attendance', icon: ClipboardCheck },
    { label: 'Enquiries', to: '/enquiries', icon: PhoneCall },
    { label: 'Reminders', to: '/reminders', icon: Bell },
    { label: 'Payments', to: '/payments', icon: DollarSign },
    { label: 'Finance', to: '/finance', icon: TrendingUp },
];

export default function Sidebar({ isOpen, onClose }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile overlay backdrop */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}
            <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon">🏋️</div>
                    <div style={{ flex: 1 }}>
                        <div className="logo-text">GymPro</div>
                        <div className="logo-sub">Management System</div>
                    </div>
                    {/* Close button only visible on mobile */}
                    <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Navigation</div>
                    {navItems.map(({ label, to, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={handleNavClick}
                        >
                            <Icon />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div style={{ padding: '8px 12px 10px', fontSize: 12, color: 'var(--text-dim)' }}>
                        Logged in as <strong style={{ color: 'var(--text-muted)' }}>{user?.username}</strong>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
