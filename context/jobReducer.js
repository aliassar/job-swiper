/**
 * Reducer for complex Job state management
 * Consolidates multiple useState calls into a single useReducer
 */

// Action types
export const ACTIONS = {
  SET_JOBS: 'SET_JOBS',
  SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
  SET_SAVED_JOBS: 'SET_SAVED_JOBS',
  SET_APPLICATIONS: 'SET_APPLICATIONS',
  SET_REPORTED_JOBS: 'SET_REPORTED_JOBS',
  SET_SKIPPED_JOBS: 'SET_SKIPPED_JOBS',
  SET_SESSION_ACTIONS: 'SET_SESSION_ACTIONS',
  SET_LOADING: 'SET_LOADING',
  SET_QUEUE_STATUS: 'SET_QUEUE_STATUS',
  SET_FETCH_ERROR: 'SET_FETCH_ERROR',
  SET_RETRY_COUNT: 'SET_RETRY_COUNT',
  SET_OPERATION_ERROR: 'SET_OPERATION_ERROR', // For queue operation errors
  SET_SAVING_JOB: 'SET_SAVING_JOB', // Loading state for save/unsave operations
  SET_REPORTING_JOB: 'SET_REPORTING_JOB', // Loading state for report operations

  // Complex actions
  ADD_SESSION_ACTION: 'ADD_SESSION_ACTION',
  REMOVE_LAST_SESSION_ACTION: 'REMOVE_LAST_SESSION_ACTION',
  ADD_APPLICATION: 'ADD_APPLICATION',
  UPDATE_APPLICATION: 'UPDATE_APPLICATION',
  REMOVE_APPLICATION: 'REMOVE_APPLICATION',
  TOGGLE_SAVED_JOB: 'TOGGLE_SAVED_JOB',
  ADD_SKIPPED_JOB: 'ADD_SKIPPED_JOB',
  REMOVE_SKIPPED_JOB: 'REMOVE_SKIPPED_JOB',
  MERGE_SKIPPED_JOBS: 'MERGE_SKIPPED_JOBS',
  ADD_REPORTED_JOB: 'ADD_REPORTED_JOB',
  REMOVE_REPORTED_JOB: 'REMOVE_REPORTED_JOB',
  ROLLBACK_JOB: 'ROLLBACK_JOB',
  INCREMENT_INDEX: 'INCREMENT_INDEX',

  // Mark as synced actions
  MARK_APPLICATION_SYNCED: 'MARK_APPLICATION_SYNCED',
  MARK_SESSION_ACTION_SYNCED: 'MARK_SESSION_ACTION_SYNCED',
  MARK_SKIPPED_JOB_SYNCED: 'MARK_SKIPPED_JOB_SYNCED',
  MARK_SAVED_JOB_SYNCED: 'MARK_SAVED_JOB_SYNCED',
  MARK_REPORTED_JOB_SYNCED: 'MARK_REPORTED_JOB_SYNCED',

  // Update application with result
  UPDATE_APPLICATION_WITH_RESULT: 'UPDATE_APPLICATION_WITH_RESULT',
};

// Initial state
export const initialState = {
  jobs: [],
  currentIndex: 0,
  savedJobs: [],
  applications: [],
  reportedJobs: [],
  skippedJobs: [],
  sessionActions: [],
  loading: true,
  queueStatus: { length: 0, operations: [] },
  fetchError: null,
  operationError: null, // For displaying queue operation errors to user
  retryCount: 0,
  savingJob: null, // ID of job currently being saved/unsaved, or null
  reportingJob: null, // ID of job currently being reported, or null
};

// Reducer function
export function jobReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_JOBS:
      return { ...state, jobs: action.payload };

    case ACTIONS.SET_CURRENT_INDEX:
      return { ...state, currentIndex: action.payload };

    case ACTIONS.SET_SAVED_JOBS:
      return { ...state, savedJobs: Array.isArray(action.payload) ? action.payload : [] };

    case ACTIONS.SET_APPLICATIONS:
      return { ...state, applications: Array.isArray(action.payload) ? action.payload : [] };

    case ACTIONS.SET_REPORTED_JOBS:
      return { ...state, reportedJobs: Array.isArray(action.payload) ? action.payload : [] };

    case ACTIONS.SET_SKIPPED_JOBS:
      return { ...state, skippedJobs: Array.isArray(action.payload) ? action.payload : [] };

    case ACTIONS.SET_SESSION_ACTIONS:
      return { ...state, sessionActions: Array.isArray(action.payload) ? action.payload : [] };

    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_QUEUE_STATUS:
      return { ...state, queueStatus: action.payload };

    case ACTIONS.SET_FETCH_ERROR:
      return { ...state, fetchError: action.payload };

    case ACTIONS.SET_RETRY_COUNT:
      return { ...state, retryCount: action.payload };

    case ACTIONS.SET_OPERATION_ERROR:
      return { ...state, operationError: action.payload };

    case ACTIONS.SET_SAVING_JOB:
      return { ...state, savingJob: action.payload };

    case ACTIONS.SET_REPORTING_JOB:
      return { ...state, reportingJob: action.payload };

    case ACTIONS.ADD_SESSION_ACTION:
      return {
        ...state,
        sessionActions: [...(state.sessionActions || []), action.payload],
      };

    case ACTIONS.REMOVE_LAST_SESSION_ACTION:
      return {
        ...state,
        sessionActions: (state.sessionActions || []).slice(0, -1),
      };

    case ACTIONS.ADD_APPLICATION:
      return {
        ...state,
        applications: [...(state.applications || []), action.payload],
      };

    case ACTIONS.UPDATE_APPLICATION:
      return {
        ...state,
        applications: (state.applications || []).map(app =>
          app.id === action.payload.id ? { ...app, ...action.payload.updates } : app
        ),
      };

    case ACTIONS.REMOVE_APPLICATION:
      return {
        ...state,
        applications: (state.applications || []).filter(app => app.jobId !== action.payload),
      };

    case ACTIONS.TOGGLE_SAVED_JOB:
      const jobId = action.payload.id;
      const isSaved = (state.savedJobs || []).some(j => j.id === jobId);

      return {
        ...state,
        savedJobs: isSaved
          ? (state.savedJobs || []).filter(j => j.id !== jobId)
          : [...(state.savedJobs || []), action.payload],
      };

    case ACTIONS.ADD_SKIPPED_JOB:
      return {
        ...state,
        skippedJobs: [...(state.skippedJobs || []), action.payload],
      };

    case ACTIONS.REMOVE_SKIPPED_JOB:
      return {
        ...state,
        skippedJobs: (state.skippedJobs || []).filter(j => j.id !== action.payload),
      };

    case ACTIONS.MERGE_SKIPPED_JOBS:
      // Merge server skipped jobs with local, prioritizing local pending ones
      const existingIds = new Set((state.skippedJobs || []).filter(j => j.pendingSync).map(j => j.id));
      const newServerJobs = (action.payload || []).filter(job => !existingIds.has(job.id));
      return {
        ...state,
        skippedJobs: [...(state.skippedJobs || []).filter(j => j.pendingSync), ...newServerJobs],
      };

    case ACTIONS.ADD_REPORTED_JOB:
      return {
        ...state,
        reportedJobs: [...(state.reportedJobs || []), action.payload],
      };

    case ACTIONS.REMOVE_REPORTED_JOB:
      return {
        ...state,
        reportedJobs: (state.reportedJobs || []).filter(r => r.jobId !== action.payload),
      };

    case ACTIONS.ROLLBACK_JOB:
      const { job, lastAction } = action.payload;
      const currentJobIndex = state.jobs.findIndex(j => j.id === state.jobs[state.currentIndex]?.id);
      const insertIndex = currentJobIndex >= 0 ? currentJobIndex : state.currentIndex;
      const newJobs = [...state.jobs];
      newJobs.splice(insertIndex, 0, job);

      return {
        ...state,
        jobs: newJobs,
        currentIndex: Math.max(0, state.currentIndex - 1),
        sessionActions: state.sessionActions.slice(0, -1),
        applications: lastAction.action === 'accepted'
          ? state.applications.filter(app => app.jobId !== lastAction.jobId)
          : state.applications,
        skippedJobs: lastAction.action === 'skipped'
          ? state.skippedJobs.filter(s => s.id !== lastAction.jobId)
          : state.skippedJobs,
      };

    case ACTIONS.INCREMENT_INDEX:
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
      };

    case ACTIONS.MARK_APPLICATION_SYNCED:
      return {
        ...state,
        applications: state.applications.map(app =>
          app.jobId === action.payload.jobId && app.id.startsWith('temp-')
            ? { ...app, pendingSync: false }
            : app
        ),
      };

    case ACTIONS.UPDATE_APPLICATION_WITH_RESULT:
      return {
        ...state,
        applications: state.applications.map(app =>
          app.jobId === action.payload.jobId && app.id.startsWith('temp-')
            ? { ...action.payload.application, pendingSync: false }
            : app
        ),
      };

    case ACTIONS.MARK_SESSION_ACTION_SYNCED:
      return {
        ...state,
        sessionActions: state.sessionActions.map(a =>
          a.jobId === action.payload.jobId && a.action === action.payload.action
            ? { ...a, pendingSync: false }
            : a
        ),
      };

    case ACTIONS.MARK_SKIPPED_JOB_SYNCED:
      return {
        ...state,
        skippedJobs: state.skippedJobs.map(s =>
          s.id === action.payload.jobId
            ? { ...s, pendingSync: false }
            : s
        ),
      };

    case ACTIONS.MARK_SAVED_JOB_SYNCED:
      return {
        ...state,
        savedJobs: state.savedJobs.map(s =>
          s.id === action.payload.jobId
            ? { ...s, pendingSync: false }
            : s
        ),
      };

    case ACTIONS.MARK_REPORTED_JOB_SYNCED:
      return {
        ...state,
        reportedJobs: state.reportedJobs.map(r =>
          r.jobId === action.payload.jobId
            ? { ...r, pendingSync: false }
            : r
        ),
      };

    default:
      return state;
  }
}
