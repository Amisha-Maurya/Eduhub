import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Users, Smile } from 'lucide-react';

const ChatMessage = ({ msg, isMe }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
        maxWidth: '100%'
    }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', padding: '0 0.5rem' }}>
            {isMe ? 'You' : msg.displayName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{
            padding: '0.75rem 1rem',
            borderRadius: isMe ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
            background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '0.9rem',
            boxShadow: isMe ? '0 4px 15px var(--primary-glow)' : 'none',
            wordBreak: 'break-word',
            maxWidth: '85%'
        }}>
            {msg.message}
        </div>
    </div>
);

const ClassroomChat = ({ socket, roomId, roomType = 'classroom' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { userId: 'system', displayName: 'EduBot', message: 'Welcome to the classroom chat! Remember to be kind and helpful. 🤖', timestamp: Date.now() }
    ]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket || !roomId) return;

        const handleMessage = (newMsg) => {
            setMessages(prev => [...prev, newMsg]);
        };

        socket.on('collab:message', handleMessage);

        return () => {
            socket.off('collab:message', handleMessage);
        };
    }, [socket, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || !socket) return;

        socket.emit('collab:chat', {
            roomType,
            roomId,
            message: message.trim()
        });

        setMessage('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '4rem', height: '4rem', borderRadius: '50%',
                    background: 'var(--primary)', color: 'white', border: 'none',
                    boxShadow: '0 8px 32px var(--primary-glow)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, transition: 'var(--transition)'
                }}
            >
                <MessageSquare size={24} />
            </button>
        );
    }

    return (
        <div className="glass-card" style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            width: '350px', height: '500px', zIndex: 1000,
            display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span style={{ fontWeight: 700 }}>Classroom Hub</span>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                {messages.map((msg, idx) => (
                    <ChatMessage key={idx} msg={msg} isMe={msg.userId === socket?.id} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{
                padding: '1rem', borderTop: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '0.5rem'
            }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question..."
                    style={{
                        flex: 1, padding: '0.6rem 1rem', borderRadius: '0.75rem',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white'
                    }}
                />
                <button type="submit" style={{
                    background: 'var(--primary)', color: 'white', border: 'none',
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ClassroomChat;
