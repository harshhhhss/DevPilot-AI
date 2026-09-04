import { useOutletContext } from 'react-router-dom';
import ChatPanel from '../../components/chat/ChatPanel';

export default function ProjectChat() {
  const { project } = useOutletContext();
  return <ChatPanel projectId={project._id} />;
}
