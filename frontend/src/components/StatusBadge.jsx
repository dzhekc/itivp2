import { STATUSES } from '../constants.js';

export default function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{STATUSES[status] ?? status}</span>;
}
