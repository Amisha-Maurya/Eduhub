import React from 'react';
import { Trophy, Award, Star, Zap, Target, Book, Shield, Code, Rocket, Heart } from 'lucide-react';

const badgeList = [
    { id: 'coding_novice', name: 'Coding Novice', desc: 'Wrote your first 100 lines of code.', icon: Code, color: '#6366f1', xp: 100, earned: true },
    { id: 'logic_master', name: 'Logic Master', desc: 'Used 50 control flow blocks correctly.', icon: Zap, color: '#fbbf24', xp: 500, earned: true },
    { id: 'iot_pioneer', name: 'IoT Pioneer', desc: 'Successfully flashed your first hardware device.', icon: Target, color: '#f43f5e', xp: 1000, earned: false },
    { id: 'bug_hunter', name: 'Bug Hunter', desc: 'Fixed 10 logical errors with EduBot.', icon: Shield, color: '#10b981', xp: 300, earned: true },
    { id: 'speed_coder', name: 'Speed Coder', desc: 'Completed a lesson in under 5 minutes.', icon: Rocket, color: '#a855f7', xp: 400, earned: false },
    { id: 'helper', name: 'Helpful Peer', desc: 'Your comments were marked helpful by a teacher.', icon: Heart, color: '#ec4899', xp: 600, earned: false },
];

const BadgeCard = ({ badge }) => {
    const Icon = badge.icon;
    return (
        <div className={`glass-card ${!badge.earned ? 'locked-badge' : ''}`} style={{
            padding: '2rem',
            textAlign: 'center',
            opacity: badge.earned ? 1 : 0.5,
            filter: badge.earned ? 'none' : 'grayscale(1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {!badge.earned && (
                <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem',
                    borderRadius: '100px', fontSize: '0.7rem'
                }}>
                    LOCKED
                </div>
            )}
            <div style={{
                width: '4rem', height: '4rem', borderRadius: '50%',
                background: `rgba(${badge.color === '#6366f1' ? '99, 102, 241' : '251, 191, 36'}, 0.1)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: badge.color, margin: '0 auto 1.5rem',
                boxShadow: badge.earned ? `0 0 20px ${badge.color}44` : 'none'
            }}>
                <Icon size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{badge.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{badge.desc}</p>
            <div style={{ fontWeight: 700, color: badge.earned ? badge.color : 'white' }}>
                {badge.earned ? '✓ ACHIEVED' : `+${badge.xp} XP`}
            </div>
        </div>
    );
};

const Badges = () => {
    return (
        <div style={{ padding: '8rem 5% 4rem' }}>
            <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Your Achievements</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    Every block placed and every line written brings you closer to mastery.
                    Collect them all to become a Certified Tech Leader!
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {badgeList.map(b => <BadgeCard key={b.id} badge={b} />)}
            </div>
        </div>
    );
};

export default Badges;
