import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import authService from '../services/authService';

const UserProfile = () => {
  const { user, setUser, logout, loading } = useAuth();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    username: user?.username || user?.name || '',
    email: user?.email || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-sm font-medium text-gray-500">Syncing_Session...</p>
      </div>
    );
  }
 // If loading finished but no user exists, 
// stop rendering to prevent "Cannot read property of null" errors.
  if (!user) return null;

 const handleProfileSubmit = async (e) => {
  e.preventDefault();
//Define what the original data was
  const originalUsername = user?.username || user?.name || '';
  const originalEmail = user?.email || '';
  // Block if nothing changed
  if (profileData.username === originalUsername && profileData.email === originalEmail) {
    return showToast({ message: 'No changes detected.', type: 'info' });
  }
// Proceed with update if changed
  setIsUpdatingProfile(true);
  try {
    await authService.profileUpdate(profileData);
    setUser((prev) => ({ ...prev, ...profileData }));
    showToast({ message: 'Profile updated successfully', type: 'success' });
  } catch (err) {
    showToast({ message: err.response?.data?.message || 'Update failed', type: 'error' });
  } finally {
    setIsUpdatingProfile(false);
  }
};

const handlePasswordSubmit = async (e) => {
  e.preventDefault();
  //stopthe process if the new password dont match without waking the server.
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    return showToast({ message: 'New passwords do not match', type: 'error' });
  }
  setIsUpdatingPassword(true);
  try {
    const response = await authService.changePassword(passwordData);
    //if we get the flag from change password from backend 
    //it means the session is delted so force logout(this for regular users not new users )
    if (response.requiresRelogin === true) {
      logout(); 
      return;
      }

    //Clear the sensitive plain text fields from memory.
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast({ message: 'Password updated successfully', type: 'success' });
    setIsEditingPassword(false);
    } catch (err) {
      showToast({ message: err.response?.data?.message || 'Password update failed', type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

const inputStyles = "w-full max-w-md border border-slate-300 px-3 py-2 rounded-sm bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-600 dark:bg-gray-300 transition-colors";
const labelStyles = "block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1.5";
const sectionStyles = "pb-8 border-b border-gray-200 dark:border-gray-800 last:border-0";
const buttonStyles = "w-full sm:w-auto bg-gray-900 text-white text-sm font-medium py-2 px-4 rounded-sm hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 transition-colors disabled:opacity-70 min-w-[160px]";
return (
  <div className="space-y-8 pb-10">
    {/* Header Area */}
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
      Account Settings
    </h2>
    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
      Welcome, <span className="text-gray-900 dark:text-gray-200 font-medium">{user.username || user.name}</span>. Manage your system profile and access credentials.
    </p>
  </div>
  <button onClick={logout}  className="text-sm font-medium text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-700 underline underline-offset-4 w-fit">
    Logout</button>
      </div>

      {/*Profile Section */}
  <section className={sectionStyles}>
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Profile Information</h3>
  <form onSubmit={handleProfileSubmit} className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label className={labelStyles}>Username</label>
        <input 
          type="text" 
          value={profileData.username} 
          className={inputStyles} 
          required
          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
            />
              </div>
  <div>
    <label className={labelStyles}>Email Address</label>
    <input 
      type="email"
      value={profileData.email} 
      className={inputStyles} 
      required
      onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
          />
           </div>
        </div>
  <button type="submit" disabled={isUpdatingProfile} className={buttonStyles}>
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Details'} </button>
      </form>
    </div>
  </section>


  {/*Security Section */}
  <section className={sectionStyles}>
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security & Password</h3>
        {!isEditingPassword && (
              <button 
                onClick={() => setIsEditingPassword(true)}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

        {isEditingPassword && (
      <form onSubmit={handlePasswordSubmit} className="space-y-5">
        {/* Constrained width to match the grid elements below */}
        <div className="w-full md:w-[calc(50%-10px)]">
          <label className={labelStyles}>Current Password</label>
          <input type="password" value={passwordData.currentPassword} className={inputStyles} required
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
              </div>
              
     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
       <div>
        <label className={labelStyles}>New Password</label>
        <input type="password" value={passwordData.newPassword} className={inputStyles} required
               onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                </div>
      <div>
        <label className={labelStyles}>Confirm New Password</label>
        <input type="password" value={passwordData.confirmPassword} className={inputStyles} required
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                </div>
              </div>
              
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
        <button type="submit" disabled={isUpdatingPassword} className={buttonStyles}>
                {isUpdatingPassword ? 'Updating...' : 'Save New Password'}
                </button>
      <button 
        type="button" 
        onClick={() => {
        setIsEditingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          }}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                  Cancel </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfile;