import React, { useState } from 'react';
import axios from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Lock, CheckCircle, ShieldAlert } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please complete all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/change-password', {
        userId: currentUser?.id,
        currentPassword,
        newPassword
      });

      setSuccessMsg('Your password has been changed successfully! Account secured.');
      
      // Update local storage so notification banner stops showing for this session
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          requires_password_change: false,
          is_new_user: false
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Security Account Password Update"
      description="Update your default or initial password to a strong personal passphrase"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMsg && (
          <Alert variant="error">
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">New Account Password Required</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Your account is currently configured with a default password. Create a unique password to protect your restaurant scope analytics.
            </p>
          </div>
        </div>

        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current or default password..."
          leftIcon={<Lock size={15} />}
        />

        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 6 characters..."
          required
          leftIcon={<Lock size={15} />}
        />

        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password..."
          required
          leftIcon={<Lock size={15} />}
        />

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
          >
            Update & Secure Password
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
