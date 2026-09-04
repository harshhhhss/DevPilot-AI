import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/roles';
import Avatar from '../common/Avatar';
import { formatRelativeTime } from '../../utils/format';

// Chat is intentionally session-only (no persisted history): it rides the
// existing Socket.IO project room and gives the team a live channel without
// introducing a whole new persisted-message model for this pass.
export default function ChatPanel({ projectId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const canPost = user.role !== ROLES.STAKEHOLDER;

  useEffect(() => {
    if (!socket) return undefined;

    socket.emit('project:join', projectId);

    const handleMessage = (payload) => {
      if (payload.projectId !== projectId) return;
      setMessages((prev) => [...prev, payload]);
    };
    const handleTypingStart = ({ userId, name }) => {
      setTypingUsers((prev) => (prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, name }]));
    };
    const handleTypingStop = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on('chat:message', handleMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.emit('project:leave', projectId);
      socket.off('chat:message', handleMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !canPost) return;
    socket.emit('chat:message', { projectId, content: text.trim() });
    socket.emit('typing:stop', { projectId });
    setText('');
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (!socket || !canPost) return;
    socket.emit('typing:start', { projectId });
    clearTimeout(handleChange._t);
    handleChange._t = setTimeout(() => socket.emit('typing:stop', { projectId }), 1500);
  };

  if (!socket) {
    return <p className="text-sm text-slate-400">Connecting to chat...</p>;
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            No messages yet. Say hello to the team — messages are live for everyone currently viewing this project.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Avatar name={m.author?.name} size="sm" />
            <div>
              <p className="text-xs font-medium text-slate-700">
                {m.author?.name}
                <span className="ml-2 font-normal text-slate-400">{formatRelativeTime(m.createdAt)}</span>
              </p>
              <p className="text-sm text-slate-700">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 && (
        <p className="px-4 pb-1 text-xs italic text-slate-400">
          {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </p>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={handleChange}
          disabled={!canPost}
          placeholder={canPost ? 'Message the team...' : "Stakeholders have read-only access to chat"}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={!canPost || !text.trim()}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
