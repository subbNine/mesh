import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from '../../store/toast.store';
import { api } from '../../lib/api';
import { User, Camera, Mail, Lock, Check, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { success, error } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleUpdateProfile = async () => {
    if (!firstName || !lastName) {
      error('First and last name are required');
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      const { data } = await api.patch('/users/me', { firstName, lastName });
      updateUser(data);
      success('Profile updated successfully');
    } catch (err) {
      error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        error('Please upload an image file');
        return;
    }

    if (file.size > 1 * 1024 * 1024) {
        error('File size must be under 1MB');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingAvatar(true);
    try {
        const { data } = await api.post('/users/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        updateUser(data);
        success('Avatar updated successfully');
    } catch (err) {
        error('Failed to upload avatar');
    } finally {
        setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to change password';
      error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Account Settings</h1>
        <p className="text-zinc-500 mt-2 text-lg">Manage your profile, avatar, and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Public Profile</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-zinc-700">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-zinc-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="E.g. John"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-zinc-700">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-zinc-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="E.g. Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <div className="relative">
                    <input
                        id="email"
                        type="email"
                        disabled
                        className="w-full px-3 py-2 rounded-md border border-zinc-100 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                        value={user?.email || ''}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                        Read Only
                    </span>
                </div>
                <p className="text-[11px] text-zinc-400 italic">Email cannot be changed at this time.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </Card>

          {/* Password Card */}
          <Card className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
                <div className="bg-amber-50 p-2 rounded-lg">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold">Security</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium text-zinc-700">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    required
                    className="w-full px-3 py-2 rounded-md border border-zinc-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-medium text-zinc-700">New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            required
                            className="w-full px-3 py-2 rounded-md border border-zinc-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">Confirm New Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            className="w-full px-3 py-2 rounded-md border border-zinc-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-bold text-sm shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Update Password
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Avatar Sidebar Section */}
        <div className="space-y-6">
          <Card className="p-6 text-center space-y-6 flex flex-col items-center">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Your Avatar</h3>
            
            <button 
              type="button"
              className="relative group cursor-pointer outline-none focus:ring-4 focus:ring-primary/20 rounded-full transition-all" 
              onClick={handleAvatarClick}
            >
              <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-zinc-100 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-5xl font-black text-zinc-300">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
              
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Change Photo</span>
              </div>

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              )}
            </button>

            <div className="space-y-2">
                <p className="text-sm font-bold text-zinc-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-zinc-500">@{user?.userName}</p>
            </div>

            <button
                onClick={handleAvatarClick}
                className="w-full py-2 border-2 border-zinc-100 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                disabled={isUploadingAvatar}
            >
                Upload new photo
            </button>

            <p className="text-[10px] text-zinc-400">
                JPG, GIF or PNG. Max size of 1MB.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
