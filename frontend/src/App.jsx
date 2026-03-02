import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
    Code2,
    Cpu,
    BrainCircuit,
    ChevronRight,
    Users,
    ShieldCheck,
    Rocket,
    Terminal,
    Layers,
    Sparkles
} from 'lucide-react';
import './index.css';

// --- Components ---

const Navbar = () => (
    <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 5%',
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 100,
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                padding: '0.5rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Code2 size={24} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                Edu<span style={{ color: '#6366f1' }}>Code</span>
            </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
            <Link to="/badges" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Badges</Link>
            <Link to="/leaderboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Leaderboard</Link>
            <Link to="/analytics" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Analytics</Link>
            <Link to="/login" className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>Login</Link>
        </div>
    </nav>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
        }}>
            <Icon size={24} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{desc}</p>
    </div>
);

// --- Pages ---

const LandingPage = () => (
    <main style={{ paddingTop: '8rem', position: 'relative' }}>
        <div className="bg-grid"></div>
        <div className="hero-gradient"></div>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', padding: '0 5% 4rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '100px',
                color: 'var(--primary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '2rem'
            }}>
                <Sparkles size={16} /> Now with AI Tutoring v2.0
            </div>
            <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                Empower the Next <br />
                <span style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7, #f43f5e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Generation</span> of Creators
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
                The complete K-12 platform for block-based coding, real-time Python sync,
                hardware IoT integration, and AI-powered learning.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/editor" className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                    Explore the Editor <ChevronRight size={20} />
                </Link>
                <button style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}>
                    Book a Demo
                </button>
            </div>
        </section>

        {/* Stats / Proof */}
        <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            padding: '4rem 5%',
            background: 'rgba(255,255,255,0.02)',
            borderY: '1px solid var(--border)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 800 }}>500K+</h4>
                <p style={{ color: 'var(--text-muted)' }}>Students Learning</p>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 800 }}>12K+</h4>
                <p style={{ color: 'var(--text-muted)' }}>Schools Registered</p>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 800 }}>50M+</h4>
                <p style={{ color: 'var(--text-muted)' }}>Lines of Code Written</p>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 800 }}>99.9%</h4>
                <p style={{ color: 'var(--text-muted)' }}>Platform Uptime</p>
            </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '8rem 5%' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Smarter Coding for Every Age</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>From Drag-and-Drop to Embedded C++, we guide students through every step of their journey.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <FeatureCard
                    icon={BrainCircuit}
                    title="AI-Guided Learning"
                    desc="EduBot provides age-appropriate hints and Socratic guidance, ensuring students think through problems themselves."
                />
                <FeatureCard
                    icon={Layers}
                    title="Block-to-Code Sync"
                    desc="Watch your blocks transform into professional Python code in real-time. Learn syntax by doing."
                />
                <FeatureCard
                    icon={Cpu}
                    title="Hardware Integration"
                    desc="Program ESP32, Arduino, and micro:bit directly from your browser. No extra software needed."
                />
                <FeatureCard
                    icon={Users}
                    title="Classroom Management"
                    desc="Teachers can monitor progress, lock screens, and push assignments with a single click."
                />
                <FeatureCard
                    icon={ShieldCheck}
                    title="COPPA/FERPA Secure"
                    desc="Built with privacy first. Encrypted data, no trackers, and dedicated student safety filters."
                />
                <FeatureCard
                    icon={Terminal}
                    title="Real-time Collab"
                    desc="Multiple students can work together on the same project, just like a professional dev team."
                />
            </div>
        </section>
    </main>
);

import Dashboard from './pages/Dashboard';
import Badges from './pages/Badges';
import TeacherAnalytics from './pages/TeacherAnalytics';
import Leaderboard from './pages/Leaderboard';
import ClassroomChat from './components/Classroom/ClassroomChat';
import { useSocket } from './hooks/useSocket';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    return (
        <div style={{ padding: '10rem 5%', display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                    {isLogin ? 'Ready to continue your coding journey?' : 'Join thousands of students building the future.'}
                </p>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isLogin && (
                        <input type="text" placeholder="Full Name" style={{
                            padding: '0.75rem 1rem', borderRadius: '0.75rem',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white'
                        }} />
                    )}
                    <input type="email" placeholder="Email Address" style={{
                        padding: '0.75rem 1rem', borderRadius: '0.75rem',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white'
                    }} />
                    <input type="password" placeholder="Password" style={{
                        padding: '0.75rem 1rem', borderRadius: '0.75rem',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white'
                    }} />
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const socket = useSocket();

    return (
        <Router>
            <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/badges" element={<Badges />} />
                    <Route path="/analytics" element={<TeacherAnalytics />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/editor" element={<div style={{ padding: '10rem 5%', textAlign: 'center' }}>Editor UI Coming Soon</div>} />
                    <Route path="/editor/:projectId" element={<div style={{ padding: '10rem 5%', textAlign: 'center' }}>Editor UI Coming Soon</div>} />
                </Routes>

                <ClassroomChat socket={socket} roomId="global-class" />
                <footer style={{
                    marginTop: 'auto',
                    padding: '4rem 5%',
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(2, 6, 23, 0.5)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ maxWidth: '300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Code2 size={20} color="#6366f1" />
                                <span style={{ fontWeight: 800 }}>EduCode</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Empowering every student with the tools to build the future through code, robotics, and AI.
                            </p>
                        </div>
                        {/* Footer Links (stubs) */}
                        <div style={{ display: 'flex', gap: '4rem' }}>
                            <div>
                                <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>Product</h5>
                                <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>Block Editor</li>
                                    <li>Python Studio</li>
                                    <li>IoT Gateway</li>
                                </ul>
                            </div>
                            <div>
                                <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>Resources</h5>
                                <ul style={{ listStyle: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>Curriculum</li>
                                    <li>Teacher PD</li>
                                    <li>Documentation</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '4rem', paddingBottom: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        © 2026 EduCode Platform. All rights reserved. Built for K-12 excellence.
                    </div>
                </footer>
            </div>
        </Router>
    );
};

export default App;
