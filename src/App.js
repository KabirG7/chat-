import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

function App() {
  const [myPeerId, setMyPeerId] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(true);

  const peerInstance = useRef(null);
  const conn = useRef(null);

  useEffect(() => {
    // Use the free public PeerJS server with secure configuration
    const peer = new Peer(undefined, {
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      setMyPeerId(id);
      setConnecting(false);
      setError('');
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      setError(`Connection error: ${err.type}`);
      setConnecting(false);
    });

    peer.on('connection', (incomingConn) => {
      setupConnection(incomingConn);
    });

    peer.on('disconnected', () => {
      setError('Disconnected from server. Trying to reconnect...');
      peer.reconnect();
    });

    peerInstance.current = peer;

    return () => {
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  const setupConnection = (connection) => {
    conn.current = connection;
    setConnected(true);
    setError('');

    connection.on('data', (data) => {
      setMessages((prev) => [...prev, { sender: 'Them', text: data }]);
    });

    connection.on('close', () => {
      setConnected(false);
      setError('Connection closed');
    });

    connection.on('error', (err) => {
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });
  };

  const handleConnect = () => {
    if (!connectionId.trim()) {
      setError('Please enter a valid Peer ID');
      return;
    }

    try {
      const outgoingConn = peerInstance.current.connect(connectionId);
      outgoingConn.on('open', () => {
        setupConnection(outgoingConn);
      });
      
      outgoingConn.on('error', (err) => {
        setError(`Failed to connect: ${err.message}`);
      });
    } catch (err) {
      setError(`Failed to connect: ${err.message}`);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    if (conn.current && conn.current.open) {
      try {
        conn.current.send(newMessage);
        setMessages((prev) => [...prev, { sender: 'You', text: newMessage }]);
        setNewMessage('');
        setError('');
      } catch (err) {
        setError(`Failed to send message: ${err.message}`);
      }
    } else {
      setError('Connection is not open');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">P2P Chat App</h1>

      {connecting && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 mb-4 rounded">
          Connecting to server...
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-4 rounded">
          {error}
        </div>
      )}

      {!connected ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Your Peer ID:</h3>
            <p className="bg-gray-100 p-2 rounded break-all">
              {myPeerId || 'Generating...'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Enter Peer ID to Connect:</h3>
            <input
              type="text"
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              placeholder="Enter Peer ID"
              className="border p-2 rounded w-full mb-2"
            />
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              Connect
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Chat Room</h2>
          <div className="border rounded p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender === 'You' ? 'text-right' : 'text-left'
                }`}
              >
                <span className="font-semibold">{msg.sender}:</span> {msg.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message"
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;