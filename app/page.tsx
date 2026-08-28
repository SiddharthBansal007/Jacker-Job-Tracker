'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type JobStatus =
  | 'Applied'
  | 'Followed Up'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Closed';

type Job = {
  id: string;
  companyName: string;
  role: string;
  appliedOn: string;
  link: string;
  lastFollowUp: string;
  status: JobStatus;
  referral: string;
};

type SortField = 'appliedOn' | 'lastFollowUp' | 'status';

type SortConfig = {
  field: SortField;
  direction: 'asc' | 'desc';
};

const storageKey = 'job-tracker.jobs.v1';
const themeStorageKey = 'job-tracker.theme.v1';

const statuses: JobStatus[] = [
  'Applied',
  'Followed Up',
  'Interview',
  'Offer',
  'Rejected',
  'Closed',
];

const emptyJob: Omit<Job, 'id'> = {
  companyName: '',
  role: '',
  appliedOn: '',
  link: '',
  lastFollowUp: '',
  status: 'Applied',
  referral: '',
};

const statusRank: Record<JobStatus, number> = {
  Applied: 0,
  'Followed Up': 1,
  Interview: 2,
  Offer: 3,
  Rejected: 4,
  Closed: 5,
};

const autoCloseThresholdDays = 30;

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [draft, setDraft] = useState(emptyJob);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'white' | 'black'>('white');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'appliedOn',
    direction: 'desc',
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const savedJobs = window.localStorage.getItem(storageKey);
    const savedTheme = window.localStorage.getItem(themeStorageKey);

    if (savedJobs) {
      try {
        setJobs(normalizeJobs(JSON.parse(savedJobs) as Job[]));
      } catch {
        window.localStorage.removeItem(storageKey);
        setJobs([]);
      }
    } else {
      setJobs([]);
    }

    if (savedTheme === 'black' || savedTheme === 'white') {
      setTheme(savedTheme);
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(storageKey, JSON.stringify(jobs));
    }
  }, [hasLoaded, jobs]);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(themeStorageKey, theme);
      document.documentElement.dataset.theme = theme;
    }
  }, [hasLoaded, theme]);

  const sortedJobs = useMemo(
    () => [...jobs].sort((firstJob, secondJob) => compareJobs(firstJob, secondJob, sortConfig)),
    [jobs, sortConfig],
  );

  function updateDraft<Key extends keyof typeof emptyJob>(
    key: Key,
    value: (typeof emptyJob)[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextJob: Job = {
      ...draft,
      id: editingId ?? crypto.randomUUID(),
      companyName: draft.companyName.trim(),
      role: draft.role.trim(),
      link: draft.link.trim(),
      referral: draft.referral.trim(),
    };

    if (!nextJob.companyName) return;

    setJobs((current) =>
      normalizeJobs(
        editingId
          ? current.map((job) => (job.id === editingId ? nextJob : job))
          : [nextJob, ...current],
      ),
    );
    setDraft(emptyJob);
    setEditingId(null);
  }

  function startEditing(job: Job) {
    setDraft({
      companyName: job.companyName,
      role: job.role,
      appliedOn: job.appliedOn,
      link: job.link,
      lastFollowUp: job.lastFollowUp,
      status: job.status,
      referral: job.referral,
    });
    setEditingId(job.id);
  }

  function removeJob(id: string) {
    setJobs((current) => current.filter((job) => job.id !== id));
    if (editingId === id) {
      setDraft(emptyJob);
      setEditingId(null);
    }
  }

  function cancelEditing() {
    setDraft(emptyJob);
    setEditingId(null);
  }

  function toggleSort(field: SortField) {
    setSortConfig((current) =>
      current.field === field
        ? {
            field,
            direction: current.direction === 'asc' ? 'desc' : 'asc',
          }
        : {
            field,
            direction: field === 'status' ? 'asc' : 'desc',
          },
    );
  }

  return (
    <main className={`min-h-screen bg-white text-black theme-${theme}`}>
      <section className="app-shell">
        <header className="app-header">
          <div>
            <h1 className="app-title">
              Jacker
            </h1>
            <p className="app-subtitle">Your browser-only job tracker.</p>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === 'white' ? 'black' : 'white'} theme`}
              onClick={() =>
                setTheme((current) => (current === 'white' ? 'black' : 'white'))
              }
            >
              {theme === 'white' ? <MoonIcon /> : <SunIcon />}
            </button>
            <p className="storage-note">
              Saved in this browser only. No accounts, sync, or server storage.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="entry-form"
        >
          <label className="field form-company">
            <span>Company Name</span>
            <input
              required
              value={draft.companyName}
              onChange={(event) =>
                updateDraft('companyName', event.target.value)
              }
              placeholder="Company"
            />
          </label>

          <label className="field form-role">
            <span>Role</span>
            <input
              value={draft.role}
              onChange={(event) => updateDraft('role', event.target.value)}
              placeholder="Role"
            />
          </label>

          <label className="field form-date">
            <span>Applied On</span>
            <input
              type="date"
              value={draft.appliedOn}
              onChange={(event) => updateDraft('appliedOn', event.target.value)}
            />
          </label>

          <label className="field form-date">
            <span>Last Follow Up</span>
            <input
              type="date"
              value={draft.lastFollowUp}
              onChange={(event) =>
                updateDraft('lastFollowUp', event.target.value)
              }
            />
          </label>

          <div className="field form-status">
            <span>Status</span>
            <div
              className="status-picker"
              onBlur={(event) => {
                const nextTarget = event.relatedTarget;

                if (
                  !(nextTarget instanceof Node) ||
                  !event.currentTarget.contains(nextTarget)
                ) {
                  setIsStatusOpen(false);
                }
              }}
            >
              <button
                className="status-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isStatusOpen}
                onClick={() => setIsStatusOpen((current) => !current)}
              >
                <span>{draft.status}</span>
                <span className="chevron-icon" aria-hidden="true" />
              </button>
              {isStatusOpen ? (
                <div className="status-menu" role="listbox">
                  {statuses.map((status) => (
                    <button
                      className="status-option"
                      key={status}
                      type="button"
                      role="option"
                      aria-selected={draft.status === status}
                      onClick={() => {
                        updateDraft('status', status);
                        setIsStatusOpen(false);
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <label className="field form-link">
            <span>Link</span>
            <input
              type="url"
              value={draft.link}
              onChange={(event) => updateDraft('link', event.target.value)}
              placeholder="https://"
            />
          </label>

          <label className="field form-referral">
            <span>Referral</span>
            <input
              value={draft.referral}
              onChange={(event) => updateDraft('referral', event.target.value)}
              placeholder="Contact name, or leave empty"
            />
          </label>

          <div className="form-actions">
            <button className="button-primary" type="submit">
              {editingId ? 'Save' : 'Add'}
            </button>
            {editingId ? (
              <button
                className="button-secondary"
                type="button"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            ) : null}
          </div>

        </form>

        <section className="tracker-section">
          <div className="tracker-header">
            <h2>Tracker</h2>
            <span>{jobs.length} saved</span>
          </div>

          <div className="mobile-sort-controls" aria-label="Sort applications">
            <button type="button" onClick={() => toggleSort('appliedOn')}>
              Applied
              <span
                className={getSortIndicatorClass(sortConfig, 'appliedOn')}
                aria-hidden="true"
              />
            </button>
            <button type="button" onClick={() => toggleSort('lastFollowUp')}>
              Follow Up
              <span
                className={getSortIndicatorClass(sortConfig, 'lastFollowUp')}
                aria-hidden="true"
              />
            </button>
            <button type="button" onClick={() => toggleSort('status')}>
              Status
              <span
                className={getSortIndicatorClass(sortConfig, 'status')}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="table-frame">
            <div className="overflow-x-auto">
              <table className="tracker-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Role</th>
                    <th>
                      <button
                        className="sort-button"
                        type="button"
                        onClick={() => toggleSort('appliedOn')}
                      >
                        <span>Applied On</span>
                        <span
                          className={getSortIndicatorClass(sortConfig, 'appliedOn')}
                          aria-hidden="true"
                        />
                      </button>
                    </th>
                    <th>Link</th>
                    <th>
                      <button
                        className="sort-button"
                        type="button"
                        onClick={() => toggleSort('lastFollowUp')}
                      >
                        <span>Last Follow Up</span>
                        <span
                          className={getSortIndicatorClass(sortConfig, 'lastFollowUp')}
                          aria-hidden="true"
                        />
                      </button>
                    </th>
                    <th>
                      <button
                        className="sort-button"
                        type="button"
                        onClick={() => toggleSort('status')}
                      >
                        <span>Status</span>
                        <span
                          className={getSortIndicatorClass(sortConfig, 'status')}
                          aria-hidden="true"
                        />
                      </button>
                    </th>
                    <th>Referral</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {sortedJobs.length ? (
                    sortedJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="font-bold">
                          {job.companyName}
                        </td>
                        <td>{job.role}</td>
                        <td>{formatDate(job.appliedOn)}</td>
                        <td>
                            {job.link ? (
                              <a href={job.link} target="_blank" rel="noreferrer">
                                Open
                              </a>
                            ) : (
                              ''
                            )}
                        </td>
                        <td>{formatDate(job.lastFollowUp)}</td>
                        <td>
                          <span className="status-pill">{job.status}</span>
                        </td>
                        <td>
                          <ReferralCell value={job.referral} />
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="table-action"
                              type="button"
                              onClick={() => startEditing(job)}
                            >
                              Edit
                            </button>
                            <button
                              className="table-action"
                              type="button"
                              onClick={() => removeJob(job.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="empty-cell">
                        Add your first application above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mobile-job-list">
            {sortedJobs.length ? (
              sortedJobs.map((job) => (
                <article className="mobile-job-card" key={job.id}>
                  <div className="mobile-job-card-header">
                    <div>
                      <h3>{job.companyName}</h3>
                      <p>{job.role || 'Role not added'}</p>
                    </div>
                    <span className="status-pill">{job.status}</span>
                  </div>

                  <dl className="mobile-job-details">
                    <div>
                      <dt>Applied</dt>
                      <dd>{formatDate(job.appliedOn) || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt>Follow Up</dt>
                      <dd>{formatDate(job.lastFollowUp) || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt>Link</dt>
                      <dd>
                        {job.link ? (
                          <a href={job.link} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        ) : (
                          'Not added'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Referral</dt>
                      <dd>
                        {job.referral ? (
                          <ReferralCell value={job.referral} />
                        ) : (
                          'Not added'
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mobile-card-actions">
                    <button
                      className="table-action"
                      type="button"
                      onClick={() => startEditing(job)}
                    >
                      Edit
                    </button>
                    <button
                      className="table-action"
                      type="button"
                      onClick={() => removeJob(job.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="mobile-empty-state">
                Add your first application above.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function ReferralCell({ value }: { value: string }) {
  const link = getReferralLink(value);

  if (!link) return value;

  return (
    <a href={link.href} target="_blank" rel="noreferrer">
      {link.label}
    </a>
  );
}

function getReferralLink(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const match = trimmedValue.match(/(?:https?:\/\/|www\.)\S+/i);
  const rawUrl = match?.[0] ?? (looksLikeDomain(trimmedValue) ? trimmedValue : '');
  if (!rawUrl) return null;

  const href = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

  try {
    const url = new URL(href);
    return {
      href: url.toString(),
      label: trimmedValue,
    };
  } catch {
    return null;
  }
}

function looksLikeDomain(value: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?$/i.test(value);
}

function normalizeJobs(jobs: Job[]) {
  return jobs.map(normalizeJob);
}

function normalizeJob(job: Job): Job {
  if (getDaysSince(job.appliedOn) > autoCloseThresholdDays && isActiveStatus(job.status)) {
    return { ...job, status: 'Closed' };
  }

  return job;
}

function compareJobs(firstJob: Job, secondJob: Job, sortConfig: SortConfig) {
  const direction = sortConfig.direction === 'asc' ? 1 : -1;

  if (sortConfig.field === 'status') {
    const rankDifference =
      statusRank[firstJob.status] - statusRank[secondJob.status];

    if (rankDifference !== 0) {
      return rankDifference * direction;
    }
  } else {
    const firstValue = firstJob[sortConfig.field] || '';
    const secondValue = secondJob[sortConfig.field] || '';
    const valueComparison = firstValue.localeCompare(secondValue);

    if (valueComparison !== 0) {
      return valueComparison * direction;
    }
  }

  return secondJob.appliedOn.localeCompare(firstJob.appliedOn);
}

function getSortIndicatorClass(sortConfig: SortConfig, field: SortField) {
  if (sortConfig.field !== field) return 'sort-indicator sort-indicator-idle';
  return sortConfig.direction === 'asc'
    ? 'sort-indicator sort-indicator-asc'
    : 'sort-indicator sort-indicator-desc';
}

function getDaysSince(value: string) {
  const date = parseJobDate(value);
  if (!date) return -1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const difference = today.getTime() - date.getTime();
  return Math.floor(difference / 86400000);
}

function parseJobDate(value: string) {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isActiveStatus(status: JobStatus) {
  return status === 'Applied' || status === 'Followed Up' || status === 'Interview';
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="theme-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="theme-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.93 4.93l1.77 1.77" />
      <path d="M17.3 17.3l1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.93 19.07l1.77-1.77" />
      <path d="M17.3 6.7l1.77-1.77" />
    </svg>
  );
}
