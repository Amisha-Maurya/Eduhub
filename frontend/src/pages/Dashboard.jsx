import React, { useState, useEffect } from 'react';
import {
    Trophy,
    BookOpen,
    Code,
    Users,
    Star,
    Clock,
    ChevronRight,
    Plus,
    ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const UserStats = ({ xp, level, badges, streak }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ color: '#fbbf24', marginBottom: '0.5rem' }}><Trophy size={32} /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{xp}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total XP</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ color: '#6366f1', marginBottom: '0.5rem' }}><Star size={32} /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{level}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Level</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ color: '#f43f5e', marginBottom: '0.5rem' }}><Clock size={32} /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{streak}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Day Streak</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ color: '#a855f7', marginBottom: '0.5rem' }}><BookOpen size={32} /></div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{badges}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Badges</div>
        </div>
    </div>
);

const ProjectCard = ({ project }) => (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
                width: '3rem', height: '3rem', borderRadius: '0.5rem',
                background: 'rgba(99, 102, 241, 0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#6366f1'
            }}>
                <Code size={24} />
            </div>
            <div>
                <h4 style={{ fontWeight: 700 }}>{project.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last edited {project.lastEdited}</p>
            </div>
        </div>
        <Link to={`/editor/${project.id}`} style={{ color: '#6366f1' }}><ArrowUpRight /></Link>
    </div>
);

const ClassroomCard = ({ classroom }) => (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: 700 }}>{classroom.name}</h4>
            <span style={{
                padding: '0.25rem 0.5rem', borderRadius: '100px',
                fontSize: '0.7rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7'
            }}>
                {classroom.subject.toUpperCase()}
            </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>{classroom.studentCount} Students</span>
            <span>By {classroom.teacherName}</span>
        </div>
        <Link to={`/classroom/${classroom.id}`} className="btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
            Enter Class
        </Link>
    </div>
);

const Dashboard = () => {
    const [user, setUser] = useState({
        displayName: 'Alex Coder',
        role: 'student',
        xp: 1250,
        level: 12,
        streak: 5,
        badges: 8
    });

    const [recentProjects, setRecentProjects] = useState([
        { id: '1', title: 'Traffic Lights Simulator', lastEdited: '2h ago' },
        { id: '2', title: 'Weather Station App', lastEdited: 'Yesterday' },
        { id: '3', title: 'Space Invaders Clone', lastEdited: '3 days ago' },
    ]);

    const [classrooms, setClassrooms] = useState([
        { id: '1', name: 'AP Computer Science A', subject: 'cs', studentCount: 28, teacherName: 'Ms. Smith' },
        { id: '2', name: 'Intro to Robotics', subject: 'robotics', studentCount: 15, teacherName: 'Mr. Jones' },
    ]);

    return (
        <div style={{ padding: '8rem 5% 4rem' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Welcome back, {user.displayName}! 👋</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Here's what's happening in your coding journey.</p>
                </div>
                <Link to="/editor" className="btn-primary">
                    <Plus size={20} /> New Project
                </Link>
            </header>

            <UserStats
                xp={user.xp}
                level={user.level}
                streak={user.streak}
                badges={user.badges}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Left Column: Recent Projects */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Projects</h3>
                        <Link to="/projects" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none' }}>View All</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                    </div>
                </section>

                {/* Right Column: Classrooms */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Classrooms</h3>
                        <button style={{
                            background: 'none', border: 'none', color: '#a855f7',
                            fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}>
                            <Plus size={16} /> Join Class
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {classrooms.map(c => <ClassroomCard key={c.id} classroom={c} />)}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
