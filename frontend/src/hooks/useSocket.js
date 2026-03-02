import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const newSocket = io(window.location.origin, {
            auth: { token }
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return socket;
};
