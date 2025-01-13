import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

function App() {
  const [myPeerId, setMyPeerId] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);

  const peerInstance = useRef(null);
  const conn = useRef(null);

  // Initialize PeerJS
  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => {
      setMyPeerId(id); // Save the generated Peer ID
    });

    // Listen for incoming connections
    peer.on('connection', (incomingConn) => {
      conn.current = incomingConn;
      setConnected(true);

      incomingConn.on('data', (data) => {
        setMessages((prev) => [...prev, { sender: 'Them', text: data }]);
      });
    });

    peerInstance.current = peer;

    return () => peer.destroy();
  }, []);

  // Handle connection to another user
  const handleConnect = () => {
    const outgoingConn = peerInstance.current.connect(connectionId);
    outgoingConn.on('open', () => {
      conn.current = outgoingConn;
      setConnected(true);
    });

    outgoingConn.on('data', (data) => {
      setMessages((prev) => [...prev, { sender: 'Them', text: data }]);
    });
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (conn.current && conn.current.open) {
      conn.current.send(newMessage);
      setMessages((prev) => [...prev, { sender: 'You', text: newMessage }]);
      setNewMessage('');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>******</h1>

      {!connected ? (
        <div>
          <h3>Your Peer ID:</h3>
          <p>{myPeerId}</p>

          <h3>Enter Peer ID to Connect:</h3>
          <input
            type="text"
            value={connectionId}
            onChange={(e) => setConnectionId(e.target.value)}
            placeholder="Enter Peer ID"
          />
          <button onClick={handleConnect}>Connect</button>
        </div>
      ) : (
        <div>
          <h2>Chat Room</h2>
          <div
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '10px',
            }}
          >
            {messages.map((msg, index) => (
              <p key={index}>
                <strong>{msg.sender}:</strong> {msg.text}
              </p>
            ))}
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message"
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;
