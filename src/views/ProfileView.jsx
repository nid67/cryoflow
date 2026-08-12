import React, { useState } from 'react';
import { apiService } from '../services/api';

export default function ProfileView({ user, onUpdateUser, onLogout }) {
  const [name, setName] = useState(user?.name || 'Dr. Elena Vance');
  const [role, setRole] = useState(user?.role || 'Cold Operations Director');
  const [organization, setOrganization] = useState(user?.organization || 'Apex Life Sciences');
  const [savedMsg, setSavedMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      // Update backend
      await apiService.updateProfile({ name, role, organization });
      
      // Update local storage and app state
      const updatedUser = {
        ...user,
        name,
        role,
        organization
      };
      
      onUpdateUser(updatedUser);
      setSavedMsg('Profile updated successfully and stored in local cache memory.');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setSavedMsg('Profile updated locally.');
      const updatedUser = { ...user, name, role, organization };
      onUpdateUser(updatedUser);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    try {
      await apiService.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPassMsg('Password updated successfully. Session security validated.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPassMsg(''), 4000);
    } catch (err) {
      alert("Error changing password: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">User Profile & Security Gateway</h1>
          <p className="text-xs text-on-surface-variant mt-1">21 CFR Part 11 Electronic Records Security Clearance</p>
        </div>

        <button onClick={onLogout} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl border border-red-200 cursor-pointer">
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Form */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
            Profile Details
          </h3>

          {savedMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {savedMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Role / Position</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Organization / Enterprise</label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-3 bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving Profile...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Profile to Local Cache
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">key</span>
            Change Password
          </h3>

          {passMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              {passMsg}
            </div>
          )}

          <form onSubmit={handleChangePass} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
