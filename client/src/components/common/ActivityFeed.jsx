import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import activityService from '../../services/activityService';
import Avatar from './Avatar';
import { formatRelativeTime, titleCase } from '../../utils/format';

const ACTION_LABELS = {
  PROJECT_CREATED: 'created the project',
  PROJECT_UPDATED: 'updated the project',
  TASK_CREATED: 'created a task',
  TASK_UPDATED: 'updated a task',
  BUG_REPORTED: 'reported a bug',
  BUG_UPDATED: 'updated a bug',
  SPRINT_CREATED: 'created a sprint',
  SPRINT_STATUS_CHANGED: 'changed a sprint status',
};

export default function ActivityFeed({ projectId, limit = 15 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService
      .listForProject(projectId, limit)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, limit]);

  if (loading) return <p className="text-xs text-slate-400">Loading activity...</p>;
  if (items.length === 0) return <p className="text-xs text-slate-400">No activity yet.</p>;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.04 }}
          className="flex items-start gap-2.5"
        >
          <Avatar name={item.user?.name} size="sm" />
          <div className="min-w-0">
            <p className="text-xs text-slate-600">
              <span className="font-medium text-slate-800">{item.user?.name}</span>{' '}
              {ACTION_LABELS[item.action] || titleCase(item.action)}
              {item.meta?.status && <span className="text-slate-500"> → {titleCase(item.meta.status)}</span>}
              {item.meta?.name && <span className="text-slate-500"> "{item.meta.name}"</span>}
            </p>
            <p className="text-[11px] text-slate-400">{formatRelativeTime(item.createdAt)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
