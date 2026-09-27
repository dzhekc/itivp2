import { STATUSES } from '../data/mockArticles.js';

export default function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{STATUSES[status] ?? status}</span>;
}
