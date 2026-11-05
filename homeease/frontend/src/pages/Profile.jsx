import React, { useState } from 'react';
import { User, Mail, Phone, Lock, MapPin, Plus, Trash2, Save, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, updateUserState, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [addressForm, setAddressForm] = useState({ label: 'Home', street: '', city: '', state: '', zipCode: '', isDefault: false });
  const [saving, setSaving] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile(profileForm);
      updateUserState(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.addAddress(addressForm);
      updateUserState({ addresses: res.data.addresses });
      toast.success('Address added');
      setAddressForm({ label: 'Home', street: '', city: '', state: '', zipCode: '', isDefault: false });
      setShowAddAddress(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await authService.deleteAddress(addressId);
      updateUserState({ addresses: res.data.addresses });
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'addresses', label: 'Addresses' },
  ];

  return (
    <div className="profile-page">
      <div className="page-hero">
        <h1>My Profile</h1>
        <p>Manage your personal information and account settings</p>
      </div>

      <div className="container profile-container">
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-avatar-section">
              <div className="profile-big-avatar">
                {user?.profileImage
                  ? <img src={user.profileImage} alt={user.name} />
                  : <span>{user?.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
              <h3>{user?.name}</h3>
              <span className="profile-role-badge">{user?.role}</span>
              <p className="profile-email">{user?.email}</p>
            </div>

            <nav className="profile-nav">
              {TABS.map((t) => (
                <button key={t.id} className={`profile-nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </nav>

            <button className="profile-logout-btn" onClick={logout}>
              <LogOut size={16} /> Sign Out
            </button>
          </aside>

          {/* Main Content */}
          <div className="profile-main">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="profile-section card">
                <h2>Personal Information</h2>
                <form onSubmit={handleProfileSave}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <div className="profile-input-wrapper">
                        <User size={16} />
                        <input
                          className="form-input"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Your name"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <div className="profile-input-wrapper">
                        <Phone size={16} />
                        <input
                          className="form-input"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address (read-only)</label>
                    <div className="profile-input-wrapper">
                      <Mail size={16} />
                      <input className="form-input" value={user?.email || ''} readOnly style={{ background: 'var(--bg)', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" value={user?.role} readOnly style={{ background: 'var(--bg)', cursor: 'not-allowed', textTransform: 'capitalize', maxWidth: '200px' }} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {tab === 'password' && (
              <div className="profile-section card">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange} style={{ maxWidth: '460px' }}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="profile-input-wrapper">
                      <Lock size={16} />
                      <input
                        type="password"
                        className="form-input"
                        value={passForm.currentPassword}
                        onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="profile-input-wrapper">
                      <Lock size={16} />
                      <input
                        type="password"
                        className="form-input"
                        value={passForm.newPassword}
                        onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder="At least 6 characters"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="profile-input-wrapper">
                      <Lock size={16} />
                      <input
                        type="password"
                        className="form-input"
                        value={passForm.confirmPassword}
                        onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {tab === 'addresses' && (
              <div className="profile-section card">
                <div className="section-action-header">
                  <h2>Saved Addresses</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddAddress(!showAddAddress)}>
                    <Plus size={15} /> Add Address
                  </button>
                </div>

                {showAddAddress && (
                  <form onSubmit={handleAddAddress} className="add-address-form">
                    <div className="form-group">
                      <label className="form-label">Label</label>
                      <select className="form-input" value={addressForm.label} onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))} style={{ maxWidth: '200px' }}>
                        <option>Home</option>
                        <option>Work</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Street Address</label>
                      <input className="form-input" placeholder="123 Main St" value={addressForm.street} onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))} required />
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input className="form-input" placeholder="New York" value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input className="form-input" placeholder="NY" value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">ZIP Code</label>
                      <input className="form-input" placeholder="10001" value={addressForm.zipCode} onChange={(e) => setAddressForm((p) => ({ ...p, zipCode: e.target.value }))} style={{ maxWidth: '160px' }} />
                    </div>
                    <div className="address-form-actions">
                      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>Save Address</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddAddress(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {user?.addresses?.length > 0 ? (
                  <div className="address-list">
                    {user.addresses.map((addr) => (
                      <div key={addr._id} className="address-card">
                        <div className="address-icon"><MapPin size={18} /></div>
                        <div className="address-content">
                          <div className="address-label-row">
                            <strong>{addr.label}</strong>
                            {addr.isDefault && <span className="default-badge">Default</span>}
                          </div>
                          <p>{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                        </div>
                        <button className="address-delete-btn" onClick={() => handleDeleteAddress(addr._id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !showAddAddress && (
                    <div className="empty-address">
                      <MapPin size={32} />
                      <p>No addresses saved yet.</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
