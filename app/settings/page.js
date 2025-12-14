'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeftIcon, UserCircleIcon, DocumentArrowUpIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/lib/hooks/useSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, isLoading, updateSetting, updateAutomationStage } = useSettings();
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleConnectEmail = () => {
    router.push('/connect-email');
  };

  const handleUploadResume = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingResume(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'resume');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
          updateSetting('baseResume', { name: data.name, url: data.url });
        } else {
          console.error('Upload failed:', data.error);
          alert('Upload failed. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Upload failed. Please try again.');
      } finally {
        setUploadingResume(false);
      }
    }
  };

  const handleUploadCoverLetter = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCoverLetter(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'coverLetter');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
          updateSetting('baseCoverLetter', { name: data.name, url: data.url });
        } else {
          console.error('Upload failed:', data.error);
          alert('Upload failed. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading cover letter:', error);
        alert('Upload failed. Please try again.');
      } finally {
        setUploadingCoverLetter(false);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-xs text-gray-600">
            Manage your preferences and automation
          </p>
        </div>

        {/* Compact single card with all settings */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          
          {/* Application Automation Section */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Application Automation</h3>
            
            {/* Write resume and cover letter */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <label htmlFor="write-docs" className="block text-sm font-medium text-gray-700">
                    Write resume and cover letter for me
                  </label>
                </div>
                <button
                  id="write-docs"
                  type="button"
                  onClick={() => updateAutomationStage('writeResumeAndCoverLetter', !settings.automationStages.writeResumeAndCoverLetter)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.automationStages.writeResumeAndCoverLetter ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.automationStages.writeResumeAndCoverLetter ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Sub-option: Verify documents */}
              {settings.automationStages.writeResumeAndCoverLetter && (
                <div className="ml-4 pl-3 border-l-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label htmlFor="verify-docs" className="block text-xs font-medium text-gray-600">
                        Verify resume and cover letter with me
                      </label>
                    </div>
                    <button
                      id="verify-docs"
                      type="button"
                      onClick={() => updateAutomationStage('verifyResumeAndCoverLetter', !settings.automationStages.verifyResumeAndCoverLetter)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.automationStages.verifyResumeAndCoverLetter ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          settings.automationStages.verifyResumeAndCoverLetter ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Apply via emails and forms */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="apply-auto" className="block text-sm font-medium text-gray-700">
                    Apply for me in emails or forms
                  </label>
                </div>
                <button
                  id="apply-auto"
                  type="button"
                  onClick={() => updateAutomationStage('applyViaEmailsAndForms', !settings.automationStages.applyViaEmailsAndForms)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.automationStages.applyViaEmailsAndForms ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.automationStages.applyViaEmailsAndForms ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Update job status */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <label htmlFor="update-status" className="block text-sm font-medium text-gray-700">
                    Update job status for me
                  </label>
                </div>
                <button
                  id="update-status"
                  type="button"
                  onClick={() => updateAutomationStage('updateJobStatus', !settings.automationStages.updateJobStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.automationStages.updateJobStatus ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.automationStages.updateJobStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Email connection button */}
              {settings.automationStages.updateJobStatus && (
                <div className="ml-4">
                  <button
                    onClick={handleConnectEmail}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    {settings.emailConnected ? `Connected: ${settings.emailProvider}` : 'Connect Email'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Filter out fake jobs */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <label htmlFor="filter-fake-jobs" className="block text-sm font-medium text-gray-700">
                  Filter out fake jobs
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Hide jobs reported as fake or suspicious
                </p>
              </div>
              <button
                id="filter-fake-jobs"
                type="button"
                onClick={() => updateSetting('filterOutFakeJobs', !settings.filterOutFakeJobs)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.filterOutFakeJobs ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.filterOutFakeJobs ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Auto follow-up emails to employers */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <label htmlFor="auto-followup-email" className="block text-sm font-medium text-gray-700">
                    Auto send follow-up emails
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Automatically email employers to follow up on applications
                  </p>
                </div>
                <button
                  id="auto-followup-email"
                  type="button"
                  onClick={() => updateSetting('autoFollowUpEmailEnabled', !settings.autoFollowUpEmailEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoFollowUpEmailEnabled ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoFollowUpEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Auto follow-up configuration */}
              {settings.autoFollowUpEmailEnabled && (
                <div className="ml-4 space-y-2">
                  <div>
                    <label htmlFor="followup-interval" className="block text-xs font-medium text-gray-700 mb-1">
                      Send every
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        id="followup-interval"
                        min="1"
                        max="30"
                        value={settings.autoFollowUpIntervalDays || 7}
                        onChange={(e) => updateSetting('autoFollowUpIntervalDays', parseInt(e.target.value) || 7)}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-600">days</span>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="followup-max-count" className="block text-xs font-medium text-gray-700 mb-1">
                      Maximum follow-ups
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        id="followup-max-count"
                        min="1"
                        max="5"
                        value={settings.autoFollowUpMaxCount || 2}
                        onChange={(e) => updateSetting('autoFollowUpMaxCount', parseInt(e.target.value) || 2)}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-600">per application</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Notifications</h3>
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <label htmlFor="email-notifications" className="block text-sm font-medium text-gray-700">
                  Email notifications
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  For application status changes only
                </p>
              </div>
              <button
                id="email-notifications"
                type="button"
                onClick={() => updateSetting('emailNotificationsEnabled', !settings.emailNotificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotificationsEnabled ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Follow-up reminder (user reminders, not auto emails) */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <label htmlFor="followup-reminder" className="block text-sm font-medium text-gray-700">
                    Follow-up reminders
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Get reminded to follow up on applications
                  </p>
                </div>
                <button
                  id="followup-reminder"
                  type="button"
                  onClick={() => updateSetting('followUpReminderEnabled', !settings.followUpReminderEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.followUpReminderEnabled ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.followUpReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Days selector */}
              {settings.followUpReminderEnabled && (
                <div className="ml-4">
                  <label htmlFor="reminder-days" className="block text-xs font-medium text-gray-700 mb-1">
                    Remind me after
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="reminder-days"
                      min="1"
                      max="90"
                      value={settings.followUpReminderDays}
                      onChange={(e) => updateSetting('followUpReminderDays', parseInt(e.target.value) || 14)}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-600">days</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Base Documents Upload */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Base Documents</h3>
            <p className="text-xs text-gray-500 mb-3">Upload templates for tailoring</p>
            
            <div className="space-y-2">
              {/* Resume upload */}
              <div>
                <label className={`flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${uploadingResume ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                  {uploadingResume ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                  ) : (
                    <DocumentArrowUpIcon className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-xs text-gray-700">
                    {uploadingResume ? 'Uploading...' : (settings.baseResume?.name || 'Upload Base Resume')}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleUploadResume}
                    disabled={uploadingResume}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Cover letter upload */}
              <div>
                <label className={`flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${uploadingCoverLetter ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                  {uploadingCoverLetter ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                  ) : (
                    <DocumentArrowUpIcon className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-xs text-gray-700">
                    {uploadingCoverLetter ? 'Uploading...' : (settings.baseCoverLetter?.name || 'Upload Base Cover Letter')}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleUploadCoverLetter}
                    disabled={uploadingCoverLetter}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* User Settings Button */}
          <div>
            <button
              onClick={() => router.push('/user-settings')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <UserCircleIcon className="h-5 w-5" />
              Change User Settings
            </button>
          </div>
        </div>

        {/* Account Section - Simplified */}
        {status === 'authenticated' && session?.user && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {session.user.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-gray-400" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name || 'User'}</p>
                <p className="text-xs text-gray-600 truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        {status !== 'authenticated' && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-xs text-gray-600 mb-3">Sign in to sync your settings</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
