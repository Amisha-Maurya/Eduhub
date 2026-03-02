import React, { useState } from 'react';
import {
    Users,
    TrendingUp,
    AlertCircle,
    BarChart3,
    Search,
    Filter,
    Download,
    MoreVertical,
    CheckCircle2,
    Clock
} from 'lucide-react';

const StudentRow = ({ student }) => (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={student.avatar} alt="" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }} />
            <div>
                <div style={{ fontWeight: 600 }}>{student.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.username}</div>
            </div>
        </td>
        <td style={{ padding: '1rem' }}>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ width: `${student.progress}%`, height: '100%', background: 'var(--primary)' }}></div>
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{student.progress}% complete</div>
        </td>
        <td style={{ padding: '1rem', fontWeight: 700 }}>{student.xp} XP</td>
        <td style={{ padding: '1rem' }}>
            <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem',
                background: student.status === 'stuck' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: student.status === 'stuck' ? '#f43f5e' : '#10b981'
            }}>
                {student.status.toUpperCase()}
            </span>
        </td>
        <td style={{ padding: '1rem' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreVertical size={20} /></button>
        </td>
    </tr>
);

const TeacherAnalytics = () => {
    const [students] = useState([
        { id: '1', name: 'Emily Chen', username: '@emily_blocks', progress: 85, xp: 2450, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
        { id: '2', name: 'Marcus Wright', username: '@marcus_js', progress: 42, xp: 1200, status: 'stuck', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
        { id: '3', name: 'Sarah Miller', username: '@sarah_dev', progress: 95, xp: 3100, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
        { id: '4', name: 'Leo Gupta', username: '@leo_code', progress: 67, xp: 1850, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
    ]);

    return (
        <div style={{ padding: '8rem 5% 4rem' }}>
            {/* Header Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <Users size={20} /> Total Students
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>32</div>
                    <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem' }}>+4 this month</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <TrendingUp size={20} /> Avg. Progress
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>64%</div>
                    <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem' }}>↑ 12% from last week</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <AlertCircle size={20} /> Students Stuck
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e' }}>5</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Need attention</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <CheckCircle2 size={20} /> Submissions
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>128</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>8 pending grading</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="glass-card" style={{ padding: '2rem', minHeight: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Classroom Roster - AP Computer Science</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Search students..." style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '0.75rem',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', width: '250px'
                            }} />
                        </div>
                        <button className="btn-primary" style={{ padding: '0.6rem 1rem' }}><Download size={18} /> Export</button>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem' }}>STUDENT</th>
                            <th style={{ padding: '1rem' }}>CURRICULUM PROGRESS</th>
                            <th style={{ padding: '1rem' }}>LEVEL / XP</th>
                            <th style={{ padding: '1rem' }}>STATUS</th>
                            <th style={{ padding: '1rem' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => <StudentRow key={s.id} student={s} />)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherAnalytics;
