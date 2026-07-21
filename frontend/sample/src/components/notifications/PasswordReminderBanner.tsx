import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, KeyRound, X } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export const PasswordReminderBanner: React.FC = () => {
  const { currentUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show notification if user is flagged as requiring password change or is new user
  const shouldShowNotification = 
    !dismissed && 
    currentUser && 
    (currentUser.requires_password_change || currentUser.is_new_user);

  if (!shouldShowNotification) return null;

  return (
    <>
      <div className="w-full mb-6 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 flex-shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                New User Security Action Required
              </h4>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white">
                Notification Reminder
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
              Welcome, <strong className="text-amber-900 dark:text-amber-200">{currentUser.username}</strong>! You are using an initial default password. Please update your password to secure your account credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/15 transition-all cursor-pointer"
          >
            <KeyRound size={14} />
            <span>Change Password Now</span>
          </button>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-amber-500/10 transition-colors cursor-pointer"
            title="Remind me later"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
