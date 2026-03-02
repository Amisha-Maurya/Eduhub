import React, { useState } from 'react';
import { Trophy, Medal, Crown, ArrowUp, ArrowDown, Search } from 'lucide-react';

const LeaderboardRow = ({ entry, rank }) => {
    const isTopThree = rank <= 3;
    const RankIcon = rank === 1 ? Crown : rank === 2 ? Medal : rank === 3 ? Medal : null;
    const rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : 'var(--text-muted)';

    return (
        <tr style={{
            borderBottom: '1px solid var(--border)',
            background: rank % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            transition: 'var(--transition)'
        }}>
            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {isTopThree ? <RankIcon size={20} color={rankColor} /> : <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{rank}</span>}
                </div>
            </td>
            <td style={{ padding: '1.25rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={entry.avatar} alt="" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: isTopThree ? `2px solid ${rankColor}` : 'none' }} />
                    <div>
                        <div style={{ fontWeight: 700 }}>{entry.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.username}</div>
                    </div>
                </div>
            </td>
            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: isTopThree ? rankColor : 'white' }}>{entry.xp.toLocaleString()} XP</div>
            </td>
            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem' }}>{entry.projects} Projects</div>
            </td>
            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                {entry.trend === 'up' ? <ArrowUp size={16} color="#10b981" /> : <ArrowDown size={16} color="#f43f5e" />}
            </td>
        </tr>
    );
};

const Leaderboard = () => {
    const [activeTab, setActiveTab] = useState('global');
    const [data] = useState([
        { id: '1', name: 'Sarah Miller', username: '@sarah_dev', xp: 15420, projects: 42, trend: 'up', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
        { id: '2', name: 'Emily Chen', username: '@emily_blocks', xp: 14200, projects: 38, trend: 'up', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
        { id: '3', name: 'Alex Coder', username: '@alex_code', xp: 12500, projects: 31, trend: 'down', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
        { id: '4', name: 'Marcus Wright', username: '@marcus_js', xp: 11800, projects: 29, trend: 'up', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
        { id: '5', name: 'Leo Gupta', username: '@leo_code', xp: 9500, projects: 24, trend: 'down', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
    ]);

    return (
        <div style={{ padding: '8rem 5% 4rem' }}>
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem' }}>Global Leaderboard</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Stand among the world's most talented young creators.</p>
            </header>

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Tabs & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '1rem' }}>
                        {['global', 'classroom', 'friends'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '0.6rem 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === tab ? 'var(--primary)' : 'transparent',
                                    color: 'white', fontWeight: 600, transition: 'var(--transition)'
                                }}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search rankings..." style={{
                            padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '0.75rem',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white'
                        }} />
                    </div>
                </div>

                {/* Board */}
                <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>RANK</th>
                                <th style={{ padding: '1rem' }}>STUDENT</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>TOTAL XP</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>PROJECTS</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>TREND</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((entry, index) => <LeaderboardRow key={entry.id} entry={entry} rank={index + 1} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
