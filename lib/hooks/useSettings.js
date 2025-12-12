/**
 * Custom hook for managing settings with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'job-swiper-settings';

const DEFAULT_SETTINGS = {
  // General settings
  emailNotificationsEnabled: false,
  
  // Application automation settings
  automationStages: {
    autoTailorResumeCoverLetter: false,
    autoFillFormOrEmail: false,
    autoSetJobStatus: false,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      return false;
    }
  }, [settings]);

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    return saveSettings({ [key]: value });
  }, [saveSettings]);

  // Update automation stage
  const updateAutomationStage = useCallback((stage, enabled) => {
    const updatedAutomation = {
      ...settings.automationStages,
      [stage]: enabled,
    };
    return saveSettings({ automationStages: updatedAutomation });
  }, [settings.automationStages, saveSettings]);

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    try {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem(SETTINGS_KEY);
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    updateAutomationStage,
    saveSettings,
    resetSettings,
  };
}
