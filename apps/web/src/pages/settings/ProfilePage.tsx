import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from '../../store/toast.store';
import { api } from '../../lib/api';
import { 
  User, Camera, Mail, Lock, Check, Loader2, 
  Layers, LogOut, Shield, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const { success, error } = useToast();
  const navigate = useNavigate();

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

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col text-foreground font-sans selection:bg-primary/20 overflow-x-hidden relative transition-colors duration-500">
      {/* Canvas Background Grid */}
      <div className="fixed inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Floating Glass Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-[100]">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass h-14 rounded-2xl flex items-center justify-between px-6 shadow-2xl backdrop-blur-3xl border-border/40"
        >
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                   <Layers size={18} />
                </div>
                <span className="font-display font-black text-lg tracking-tight uppercase text-foreground">Mesh</span>
             </div>
             
             <div className="h-4 w-px bg-border/40 hidden sm:block" />
             
             <Button
               variant="tertiary"
               size="sm"
               onClick={() => navigate(-1)}
               className="hidden sm:flex text-[10px] items-center gap-2"
               icon={<ArrowLeft size={14} />}
             >
               Back to workspace
             </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Account synced</span>
            </div>
            <div className="w-px h-4 bg-border/40 mx-1" />
            <Button
              variant="tertiary"
              size="sm"
              onClick={logout}
              className="px-3 hover:text-destructive group"
              icon={<LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            >
              Sign out
            </Button>
          </div>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-8 pt-40 pb-32">
        <header className="mb-20 space-y-4 text-center sm:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary"
          >
            Settings
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl font-black tracking-tight text-foreground"
          >
            Account <span className="text-primary italic">Settings</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl font-serif italic leading-relaxed opacity-70 mx-auto sm:mx-0"
          >
            Manage your profile details, security, and profile photo within the Mesh workspace.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Controls */}
          <div className="lg:col-span-8 space-y-10">
            {/* Public Profile Card */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              className="glass rounded-[40px] border-border/40 overflow-hidden group shadow-2xl transition-colors"
            >
              <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-black text-foreground tracking-tight">Public Profile</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Personal Details</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 relative">
                {/* Technical Overlay */}
                <div className="absolute inset-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">First Name</label>
                    <input
                      type="text"
                      className="w-full h-14 bg-muted/20 border border-border/40 rounded-2xl px-5 text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-foreground/10"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Prince"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full h-14 bg-muted/20 border border-border/40 rounded-2xl px-5 text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-foreground/10"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Ita"
                    />
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Email Address</label>
                  <div className="relative group/field">
                    <input
                      type="email"
                      disabled
                      className="w-full h-14 bg-muted/10 border border-border/40 rounded-2xl px-5 text-foreground/40 font-sans cursor-not-allowed italic"
                      value={user?.email || ''}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-card/60 border border-border/40 flex items-center gap-2">
                       <Shield size={10} className="text-primary/40" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Default</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 italic font-serif pl-1">Your email is managed by your account provider.</p>
                </div>

                <div className="pt-6 flex justify-end relative z-10">
                  <Button
                    onClick={handleUpdateProfile}
                    loading={isUpdatingProfile}
                    variant="primary"
                    size="lg"
                    className="h-14 rounded-2xl px-12"
                    icon={<Check size={18} />}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Security Card */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
              className="glass rounded-[40px] border-border/40 overflow-hidden group shadow-2xl transition-colors"
            >
              <form onSubmit={handleChangePassword}>
                <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-inner">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-black text-foreground tracking-tight">Security</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Manage Password</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8 relative">
                   <div className="absolute inset-0 bg-dot-grid opacity-[0.03] pointer-events-none" />
                   
                   <div className="space-y-3 relative z-10">
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Current Password</label>
                    <input
                      type="password"
                      required
                      className="w-full h-14 bg-muted/20 border border-border/40 rounded-2xl px-5 text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-foreground/10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-3">
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">New Password</label>
                      <input
                        type="password"
                        required
                        className="w-full h-14 bg-muted/20 border border-border/40 rounded-2xl px-5 text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-foreground/10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Verify Password</label>
                      <input
                        type="password"
                        required
                        className="w-full h-14 bg-muted/20 border border-border/40 rounded-2xl px-5 text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-foreground/10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end relative z-10">
                    <Button
                      type="submit"
                      loading={isChangingPassword}
                      variant="outline"
                      size="lg"
                      className="h-14 rounded-2xl px-12 border-border/40 hover:border-amber-500/50 hover:text-amber-500"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Sidebar - Avatar */}
          <div className="lg:col-span-4 space-y-10">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.3 }}
              className="glass rounded-[40px] border-border/40 overflow-hidden group shadow-2xl p-8 flex flex-col items-center text-center space-y-10 transition-colors"
            >
              <div className="w-full flex flex-col items-center">
                 <h3 className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] mb-10">Profile Photo</h3>
                 
                 <button 
                  type="button"
                  className="relative group cursor-pointer outline-none rounded-full transition-all p-1.5 bg-gradient-to-br from-primary/40 to-transparent shadow-2xl" 
                  onClick={handleAvatarClick}
                 >
                  <div className="w-44 h-44 rounded-full ring-8 ring-background overflow-hidden bg-muted/40 flex items-center justify-center relative">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="text-6xl font-display font-black text-primary/10">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <Camera className="w-8 h-8 mb-2 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Change Photo</span>
                    </div>

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                 </button>

                 <div className="mt-8 space-y-1">
                    <p className="font-display text-2xl font-black text-foreground tracking-tight">{user?.firstName} {user?.lastName}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                       @{user?.userName || 'subNine'}
                    </div>
                 </div>
              </div>

              <div className="w-full space-y-4">
                <Button
                    onClick={handleAvatarClick}
                    variant="outline"
                    className="w-full h-14 rounded-2xl text-[10px] border-border/40 uppercase tracking-widest shadow-none"
                    disabled={isUploadingAvatar}
                    icon={<ImageIcon size={16} />}
                >
                    Upload Photo
                </Button>

                <p className="text-[10px] text-muted-foreground/30 font-serif italic leading-relaxed">
                    JPG, GIF or PNG formats supported. <br /> Maximum payload: 1MB.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </motion.div>

            {/* Support / Help Box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-8 rounded-[40px] border border-dashed border-border/60 flex flex-col items-center text-center space-y-4"
            >
               <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40">
                  <Mail size={18} />
               </div>
               <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Need help?</p>
               <p className="text-[12px] font-serif italic text-muted-foreground/40 leading-relaxed">
                  Having trouble with your account? <br />
                  Contact support.
               </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
