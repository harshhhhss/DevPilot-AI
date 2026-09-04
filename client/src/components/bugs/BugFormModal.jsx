import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import bugService from '../../services/bugService';
import { getErrorMessage } from '../../services/api';
import { BUG_SEVERITIES } from '../../utils/constants';

const EMPTY = { title: '', description: '', severity: 'MEDIUM', stepsToReproduce: '', expectedResult: '', actualResult: '' };

export default function BugFormModal({ open, onClose, projectId, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bug = await bugService.create(projectId, form);
      toast.success('Bug reported');
      onCreated(bug);
      setForm(EMPTY);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report Bug"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            Report Bug
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Severity</label>
          <Select value={form.severity} onChange={(severity) => setForm({ ...form, severity })} options={BUG_SEVERITIES} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Steps to reproduce</label>
          <textarea
            rows={3}
            value={form.stepsToReproduce}
            onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder={'1. ...\n2. ...'}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expected result</label>
            <textarea
              rows={2}
              value={form.expectedResult}
              onChange={(e) => setForm({ ...form, expectedResult: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Actual result</label>
            <textarea
              rows={2}
              value={form.actualResult}
              onChange={(e) => setForm({ ...form, actualResult: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
