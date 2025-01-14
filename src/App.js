import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import './App.css';  

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
    const peer = new Peer(undefined, {
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
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
    <div className="container mx-auto py-6">
      <h1 className="heading text-center mb-6">******</h1>

      {connecting && (
        <div className="alert alert-info mb-4">
          Connecting to server...
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          {error}
        </div>
      )}

      {!connected ? (
        <div className="connection-setup">
          <div>
            <h3 className="subheading">Your Peer ID:</h3>
            <p className="peer-id-box">
              {myPeerId || 'Generating...'}
            </p>
          </div>

          <div>
            <h3 className="subheading">Enter Peer ID to Connect:</h3>
            <input
              type="text"
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              placeholder="Enter Peer ID"
              className="input-box mb-2"
            />
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="btn btn-primary"
            >
              Connect
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-room">
          <h2 className="chat-heading mb-4">Chat Room</h2>
          <div className="chat-messages mb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.sender === 'You' ? 'message-outgoing' : 'message-incoming'
                }`}
              >
                <span className="message-sender">{msg.sender}:</span> {msg.text}
              </div>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message"
              className="input-box"
            />
            <button
              onClick={handleSendMessage}
              className="btn btn-send"
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
