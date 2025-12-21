'use client';

/**
 * Slim SwipeContext - Only manages swipe session state
 * Data fetching is handled by SWR hooks in individual pages
 */

import { createContext, useContext, useReducer, useRef, useMemo, useCallback } from 'react';
import { jobsApi, reportedApi } from '@/lib/api';
import { getOfflineQueue } from '@/lib/offlineQueue';

const SwipeContext = createContext();

// Actions
const ACTIONS = {
    SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
    INCREMENT_INDEX: 'INCREMENT_INDEX',
    ADD_SESSION_ACTION: 'ADD_SESSION_ACTION',
    POP_SESSION_ACTION: 'POP_SESSION_ACTION',
    MARK_ACTION_SYNCED: 'MARK_ACTION_SYNCED',
    SET_SAVING: 'SET_SAVING',
    SET_REPORTING: 'SET_REPORTING',
};

const initialState = {
    currentIndex: 0,
    sessionActions: [], // Recent actions for undo capability
    savingJob: null,    // Job ID currently being saved
    reportingJob: null, // Job ID currently being reported
};

function swipeReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_CURRENT_INDEX:
            return { ...state, currentIndex: action.payload };

        case ACTIONS.INCREMENT_INDEX:
            return { ...state, currentIndex: state.currentIndex + 1 };

        case ACTIONS.ADD_SESSION_ACTION:
            return {
                ...state,
                sessionActions: [...state.sessionActions, action.payload],
            };

        case ACTIONS.POP_SESSION_ACTION:
            return {
                ...state,
                sessionActions: state.sessionActions.slice(0, -1),
                currentIndex: Math.max(0, state.currentIndex - 1),
            };

        case ACTIONS.MARK_ACTION_SYNCED:
            return {
                ...state,
                sessionActions: state.sessionActions.map(a =>
                    a.jobId === action.payload.jobId ? { ...a, pendingSync: false } : a
                ),
            };

        case ACTIONS.SET_SAVING:
            return { ...state, savingJob: action.payload };

        case ACTIONS.SET_REPORTING:
            return { ...state, reportingJob: action.payload };

        default:
            return state;
    }
}

export function SwipeProvider({ children }) {
    const [state, dispatch] = useReducer(swipeReducer, initialState);

    // Track processed jobs to prevent double-swipe
    const processedJobsRef = useRef(new Set());

    // Offline queue singleton
    const offlineQueue = useMemo(() => getOfflineQueue(), []);

    // Accept job action
    const acceptJob = useCallback(async (job, metadata = {}) => {
        if (processedJobsRef.current.has(job.id)) {
            console.log(`Job ${job.id} already processed, skipping`);
            return null;
        }
        processedJobsRef.current.add(job.id);

        // Record session action for undo
        const sessionAction = {
            jobId: job.id,
            action: 'accepted',
            timestamp: new Date().toISOString(),
            job,
            pendingSync: true,
        };
        dispatch({ type: ACTIONS.ADD_SESSION_ACTION, payload: sessionAction });
        dispatch({ type: ACTIONS.INCREMENT_INDEX });

        // Queue for backend sync
        try {
            await offlineQueue.addOperation({
                type: 'accept',
                id: job.id,
                payload: { jobId: job.id, metadata },
                apiCall: async (payload, options) => {
                    await jobsApi.acceptJob(payload.jobId, payload.metadata, options);
                    dispatch({ type: ACTIONS.MARK_ACTION_SYNCED, payload: { jobId: payload.jobId } });
                },
            });
        } catch (error) {
            console.error('Error queuing accept:', error);
        }

        return job.id;
    }, [offlineQueue]);

    // Reject job action
    const rejectJob = useCallback(async (job) => {
        if (processedJobsRef.current.has(job.id)) {
            console.log(`Job ${job.id} already processed, skipping`);
            return;
        }
        processedJobsRef.current.add(job.id);

        dispatch({
            type: ACTIONS.ADD_SESSION_ACTION,
            payload: {
                jobId: job.id,
                action: 'rejected',
                timestamp: new Date().toISOString(),
                job,
                pendingSync: true,
            },
        });
        dispatch({ type: ACTIONS.INCREMENT_INDEX });

        try {
            await offlineQueue.addOperation({
                type: 'reject',
                id: job.id,
                payload: { jobId: job.id },
                apiCall: async (payload, options) => {
                    await jobsApi.rejectJob(payload.jobId, options);
                    dispatch({ type: ACTIONS.MARK_ACTION_SYNCED, payload: { jobId: payload.jobId } });
                },
            });
        } catch (error) {
            console.error('Error queuing reject:', error);
        }
    }, [offlineQueue]);

    // Skip job action
    const skipJob = useCallback(async (job) => {
        if (processedJobsRef.current.has(job.id)) {
            console.log(`Job ${job.id} already processed, skipping`);
            return;
        }
        processedJobsRef.current.add(job.id);

        dispatch({
            type: ACTIONS.ADD_SESSION_ACTION,
            payload: {
                jobId: job.id,
                action: 'skipped',
                timestamp: new Date().toISOString(),
                job,
                pendingSync: true,
            },
        });
        dispatch({ type: ACTIONS.INCREMENT_INDEX });

        try {
            await offlineQueue.addOperation({
                type: 'skip',
                id: job.id,
                payload: { jobId: job.id },
                apiCall: async (payload, options) => {
                    await jobsApi.skipJob(payload.jobId, options);
                    dispatch({ type: ACTIONS.MARK_ACTION_SYNCED, payload: { jobId: payload.jobId } });
                },
            });
        } catch (error) {
            console.error('Error queuing skip:', error);
        }
    }, [offlineQueue]);

    // Rollback/Undo last action
    const rollbackLastAction = useCallback(async () => {
        if (state.sessionActions.length === 0) return;

        const lastAction = state.sessionActions[state.sessionActions.length - 1];

        // Allow re-processing of this job
        processedJobsRef.current.delete(lastAction.jobId);

        // Pop the action and decrement index
        dispatch({ type: ACTIONS.POP_SESSION_ACTION });

        // If not synced, just remove from queue
        if (lastAction.pendingSync) {
            const actionType = lastAction.action === 'accepted' ? 'accept' :
                lastAction.action === 'rejected' ? 'reject' : 'skip';
            offlineQueue.rollbackUnsyncedAction(actionType, lastAction.jobId);
        }

        // Always queue server rollback (idempotent)
        try {
            await offlineQueue.addOperation({
                type: 'rollback',
                id: lastAction.jobId,
                payload: { jobId: lastAction.jobId },
                apiCall: async (payload, options) => {
                    await jobsApi.rollbackJob(payload.jobId, options);
                },
            });
        } catch (error) {
            console.error('Error queuing rollback:', error);
        }
    }, [state.sessionActions, offlineQueue]);

    // Toggle save job
    const toggleSaveJob = useCallback(async (job, isSaved) => {
        dispatch({ type: ACTIONS.SET_SAVING, payload: job.id });

        try {
            await offlineQueue.addOperation({
                type: 'saveJob',
                id: job.id,
                payload: { jobId: job.id, saved: !isSaved },
                apiCall: async (payload, options) => {
                    await jobsApi.toggleSaveJob(payload.jobId, payload.saved, options);
                    dispatch({ type: ACTIONS.SET_SAVING, payload: null });
                },
            });
        } catch (error) {
            console.error('Error toggling save:', error);
            dispatch({ type: ACTIONS.SET_SAVING, payload: null });
        }
    }, [offlineQueue]);

    // Report job
    const reportJob = useCallback(async (job, reason = 'not_interested') => {
        dispatch({ type: ACTIONS.SET_REPORTING, payload: job.id });

        try {
            await offlineQueue.addOperation({
                type: 'report',
                id: `report-${job.id}`,
                payload: { jobId: job.id, reason },
                apiCall: async (payload, options) => {
                    await reportedApi.reportJob(payload.jobId, payload.reason, options);
                    dispatch({ type: ACTIONS.SET_REPORTING, payload: null });
                },
            });
        } catch (error) {
            console.error('Error reporting job:', error);
            dispatch({ type: ACTIONS.SET_REPORTING, payload: null });
        }
    }, [offlineQueue]);

    // Unreport job
    const unreportJob = useCallback(async (jobId) => {
        try {
            await offlineQueue.addOperation({
                type: 'unreport',
                id: `report-${jobId}`,
                payload: { jobId },
                apiCall: async (payload, options) => {
                    await reportedApi.unreportJob(payload.jobId, options);
                },
            });
        } catch (error) {
            console.error('Error unreporting job:', error);
        }
    }, [offlineQueue]);

    const value = useMemo(() => ({
        currentIndex: state.currentIndex,
        sessionActions: state.sessionActions,
        savingJob: state.savingJob,
        reportingJob: state.reportingJob,
        acceptJob,
        rejectJob,
        skipJob,
        rollbackLastAction,
        toggleSaveJob,
        reportJob,
        unreportJob,
    }), [
        state.currentIndex,
        state.sessionActions,
        state.savingJob,
        state.reportingJob,
        acceptJob,
        rejectJob,
        skipJob,
        rollbackLastAction,
        toggleSaveJob,
        reportJob,
        unreportJob,
    ]);

    return (
        <SwipeContext.Provider value={value}>
            {children}
        </SwipeContext.Provider>
    );
}

export function useSwipe() {
    const context = useContext(SwipeContext);
    if (!context) {
        throw new Error('useSwipe must be used within a SwipeProvider');
    }
    return context;
}

export { ACTIONS };
