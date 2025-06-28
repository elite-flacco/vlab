import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { db } from '../lib/supabase';
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updatePassword, loading: authLoading, error: authError, clearError } = useAuthStore();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: '',
    github_username: '',
    twitter_username: '',
    website_url: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Load user profile data on mount
  React.useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await db.getProfile(user.id);
      if (error) throw error;
      
      if (data) {
        setProfileData({
          name: data.name || '',
          bio: data.bio || '',
          github_username: data.github_username || '',
          twitter_username: data.twitter_username || '',
          website_url: data.website_url || '',
        });
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      setProfileError(error.message);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const { error } = await db.updateProfile(user.id, profileData);
      if (error) throw error;
      
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setProfileError(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setPasswordError(null);
    setPasswordSuccess(false);
    clearError();

    // Validation
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await updatePassword(passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    }
  };

  const togglePasswordVisibility = (field: 'newPassword' | 'confirmPassword') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-foreground-dim hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-foreground-dim">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <div className="terminal-window p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground font-mono">Profile Information</h2>
              <p className="text-sm text-foreground-dim">Update your personal information and social links.</p>
            </div>
          </div>

          {profileError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{profileError}</p>
            </div>
          )}

          {profileSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-400">Profile updated successfully!</p>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-field">
                <label htmlFor="name" className="form-label">
                  Display Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="Your display name"
                />
              </div>

              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  className="form-input opacity-50 cursor-not-allowed"
                  disabled
                  title="Email cannot be changed"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="bio" className="form-label">
                Bio
              </label>
              <textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                className="form-textarea"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-field">
                <label htmlFor="github" className="form-label">
                  GitHub Username
                </label>
                <input
                  id="github"
                  type="text"
                  value={profileData.github_username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, github_username: e.target.value }))}
                  className="form-input"
                  placeholder="github_username"
                />
              </div>

              <div className="form-field">
                <label htmlFor="twitter" className="form-label">
                  Twitter Username
                </label>
                <input
                  id="twitter"
                  type="text"
                  value={profileData.twitter_username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, twitter_username: e.target.value }))}
                  className="form-input"
                  placeholder="twitter_handle"
                />
              </div>

              <div className="form-field">
                <label htmlFor="website" className="form-label">
                  Website URL
                </label>
                <input
                  id="website"
                  type="url"
                  value={profileData.website_url}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                  className="form-input"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="btn-primary"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Password Management */}
        <div className="terminal-window p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground font-mono">Password Management</h2>
              <p className="text-sm text-foreground-dim">Update your account password for security.</p>
            </div>
          </div>

          {(passwordError || authError) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{passwordError || authError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-400">Password updated successfully!</p>
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-field">
                <label htmlFor="newPassword" className="form-label">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPasswords.newPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="form-input pr-10"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.newPassword ? (
                      <EyeOff className="h-4 w-4 text-foreground-dim" />
                    ) : (
                      <Eye className="h-4 w-4 text-foreground-dim" />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="form-input pr-10"
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff className="h-4 w-4 text-foreground-dim" />
                    ) : (
                      <Eye className="h-4 w-4 text-foreground-dim" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 border border-foreground-dim/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Password Requirements:</h4>
              <ul className="text-xs text-foreground-dim space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Must match confirmation password</li>
                <li>• Consider using a mix of letters, numbers, and symbols for better security</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={authLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                className="btn-primary"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};