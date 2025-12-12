'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/lib/hooks/useSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, isLoading, updateSetting, updateAutomationStage } = useSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Account Settings Section */}
        {status === 'authenticated' && session?.user && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
              {session.user.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-16 h-16 text-gray-400" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{session.user.name || 'User'}</p>
                <p className="text-sm text-gray-600">{session.user.email}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        {status !== 'authenticated' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
            <p className="text-gray-600 mb-4">Sign in to sync your settings across devices</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {/* General Settings Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
          
          {/* Email Notifications Toggle */}
          <div className="mb-0">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="block text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive email updates about applications
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
          </div>
        </div>

        {/* Application Automation Settings Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Automation</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure which tasks should be automated during the application process
          </p>
          
          {/* Auto Tailor Resume and Cover Letter */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="auto-tailor" className="block text-sm font-medium text-gray-700">
                  Auto Tailor Resume and Cover Letter
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically customize resume and cover letter for each job
                </p>
              </div>
              <button
                id="auto-tailor"
                type="button"
                onClick={() => updateAutomationStage('autoTailorResumeCoverLetter', !settings.automationStages.autoTailorResumeCoverLetter)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.automationStages.autoTailorResumeCoverLetter ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.automationStages.autoTailorResumeCoverLetter ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto Fill Form or Send Email */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="auto-fill" className="block text-sm font-medium text-gray-700">
                  Automatically Fill Form or Send Email
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Auto-complete application forms or send application emails
                </p>
              </div>
              <button
                id="auto-fill"
                type="button"
                onClick={() => updateAutomationStage('autoFillFormOrEmail', !settings.automationStages.autoFillFormOrEmail)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.automationStages.autoFillFormOrEmail ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.automationStages.autoFillFormOrEmail ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto Set Job Status */}
          <div className="mb-0">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="auto-status" className="block text-sm font-medium text-gray-700">
                  Automatically Set Job Status
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update status when rejected or invited to interview
                </p>
              </div>
              <button
                id="auto-status"
                type="button"
                onClick={() => updateAutomationStage('autoSetJobStatus', !settings.automationStages.autoSetJobStatus)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.automationStages.autoSetJobStatus ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.automationStages.autoSetJobStatus ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
