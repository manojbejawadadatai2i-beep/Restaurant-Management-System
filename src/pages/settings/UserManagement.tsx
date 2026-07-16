import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import type { User } from '../../types/user';
import axios from 'axios';
import { UserCog, Save, Store, Map, Landmark, Trash2, Search } from 'lucide-react';

interface MetaData {
  regions: { id: number; name: string }[];
  districts: { id: number; name: string; region_id: number }[];
  stores: { id: number; name: string; district_id: number; region_id: number }[];
}

export const UserManagement: React.FC = () => {
  const { users, refreshUsers, currentUser } = useAuth();
  const { hasPermission } = useRBAC();
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeOption, setStoreOption] = useState<'existing' | 'new'>('existing');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreId, setNewStoreId] = useState('');
  const [role, setRole] = useState('');
  const [assignedStoreId, setAssignedStoreId] = useState<string>('');
  const [assignedDistrictId, setAssignedDistrictId] = useState<string>('');
  const [assignedRegionId, setAssignedRegionId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q) ||
      (u.store_name && u.store_name.toLowerCase().includes(q)) ||
      (u.district_name && u.district_name.toLowerCase().includes(q)) ||
      (u.region_name && u.region_name.toLowerCase().includes(q))
    );
  });

  const visibleDistricts = meta && assignedRegionId
    ? meta.districts.filter(d => d.region_id === parseInt(assignedRegionId, 10))
    : [];

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5001/api/meta');
        setMeta(response.data);
      } catch (err) {
        console.error('Failed to fetch metadata', err);
      }
    };
    fetchMeta();
  }, []);

  const handleRegionChange = (val: string) => {
    setAssignedRegionId(val);
    setAssignedDistrictId('');
    setAssignedStoreId('');
  };

  const handleDistrictChange = (val: string) => {
    setAssignedDistrictId(val);
    setAssignedStoreId('');
  };

  const handleEditClick = (user: User) => {
    setIsAdding(false);
    setEditingUser(user);
    setRole(user.role);
    setAssignedStoreId(user.assigned_store_id?.toString() || '');
    setAssignedDistrictId(user.assigned_district_id?.toString() || '');
    setAssignedRegionId(user.assigned_region_id?.toString() || '');
    setMessage('');
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setIsAdding(true);
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Store Manager');
    setAssignedRegionId('');
    setAssignedDistrictId('');
    setAssignedStoreId('');
    setStoreOption('existing');
    setNewStoreName('');
    setNewStoreId('');
    setMessage('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdding && !editingUser) return;

    setIsSaving(true);
    setMessage('');
    try {
      if (isAdding) {
        await axios.post('http://127.0.0.1:5001/api/users', {
          username,
          email: email || null,
          password: password || null,
          role,
          assigned_store_id: storeOption === 'existing' && assignedStoreId ? assignedStoreId : null,
          assigned_district_id: assignedDistrictId || null,
          assigned_region_id: assignedRegionId || null,
          addNewStore: storeOption === 'new',
          newStoreName: storeOption === 'new' ? newStoreName : null,
          newStoreId: storeOption === 'new' ? newStoreId : null
        });
        setMessage('User added successfully!');
        await refreshUsers();
        setTimeout(() => {
          setIsAdding(false);
          setMessage('');
        }, 1500);
      } else {
        await axios.put(`http://127.0.0.1:5001/api/users/${editingUser!.id}`, {
          role,
          assigned_store_id: assignedStoreId || null,
          assigned_district_id: assignedDistrictId || null,
          assigned_region_id: assignedRegionId || null
        });
        setMessage('User updated successfully!');
        await refreshUsers();
        setTimeout(() => {
          setEditingUser(null);
          setMessage('');
        }, 1500);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error processing request.';
      setMessage(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    setIsDeleting(true);
    setMessage('');
    try {
      await axios.delete(`http://127.0.0.1:5001/api/users/${userId}`);
      if (editingUser?.id === userId) {
        setEditingUser(null);
      }
      await refreshUsers();
      setMessage('User deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      setDeletingUserId(null);
    } catch (err) {
      setMessage('Error deleting user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Only permit Corporate Admin and system Administrators
  const canAccess = hasPermission('view:user-management');

  if (!canAccess) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <h3 className="text-red-800 dark:text-red-400 font-bold text-lg mb-2">Access Denied</h3>
        <p className="text-sm text-red-600 dark:text-red-300">
          You do not have administrative permissions to view or manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
      
      {/* Tab/Section Title */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog size={20} className="text-orange-500" /> User Management & Store Assignments
          </h2>
        </div>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
        >
          + Add User
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Users Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
              placeholder="Search by username, email, role, or scope..."
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-550">
              <Search size={18} />
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">
                  <th className="p-4">Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Scope</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{u.username}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    {u.store_name && (
                      <span className="flex items-center gap-1"><Store size={14} className="text-slate-400" /> {u.store_name}</span>
                    )}
                    {u.district_name && (
                      <span className="flex items-center gap-1"><Map size={14} className="text-slate-400" /> {u.district_name}</span>
                    )}
                    {u.region_name && (
                      <span className="flex items-center gap-1"><Landmark size={14} className="text-slate-400" /> {u.region_name}</span>
                    )}
                    {!u.store_name && !u.district_name && !u.region_name && (
                      <span className="text-slate-400 text-xs">System-Wide Access</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {deletingUserId === u.id ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id)}
                          disabled={isDeleting}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingUserId(null)}
                          disabled={isDeleting}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        {u.role !== 'Corporate Administrator' && u.role !== 'Administrator' && (
                          <button
                            onClick={() => handleEditClick(u)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 transition-colors"
                          >
                            Manage
                          </button>
                        )}
                        {currentUser?.id !== u.id && u.role !== 'Corporate Administrator' && u.role !== 'Administrator' && (
                          <button
                            onClick={() => {
                              setDeletingUserId(u.id);
                              setMessage('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Panel */}
        <div className="bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-800 rounded-xl p-5">
          {editingUser || isAdding ? (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isAdding ? 'Add New User' : <>Manage Scopes for: <span className="text-orange-500">{editingUser?.username}</span></>}
              </h3>

              {isAdding ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                      placeholder="Enter username..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                      placeholder="Enter email address..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                      placeholder="Enter password..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                    >
                      <option value="Store Manager">Store Manager</option>
                      <option value="District Manager">District Manager</option>
                      <option value="Regional Manager">Regional Manager</option>
                    </select>
                  </div>

                  {meta && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Region</label>
                      <select
                        value={assignedRegionId}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                        required
                      >
                        <option value="">Select Region...</option>
                        {meta.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  )}

                  {meta && assignedRegionId && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">District</label>
                      <select
                        value={assignedDistrictId}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                        required
                      >
                        <option value="">Select District...</option>
                        {visibleDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}

                  {meta && assignedDistrictId && (
                    <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Store Options</label>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="storeOption"
                            checked={storeOption === 'existing'}
                            onChange={() => setStoreOption('existing')}
                            className="accent-orange-500"
                          />
                          Assign Existing Store
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="storeOption"
                            checked={storeOption === 'new'}
                            onChange={() => setStoreOption('new')}
                            className="accent-orange-500"
                          />
                          Add New Store
                        </label>
                      </div>

                      {storeOption === 'existing' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-405 dark:text-slate-500 mb-1 uppercase">Select Existing Store</label>
                          <select
                            value={assignedStoreId}
                            onChange={(e) => setAssignedStoreId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                            required
                          >
                            <option value="">Select Store...</option>
                            {meta.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-slate-100/50 dark:bg-slate-900/20 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-405 dark:text-slate-500 mb-1 uppercase">New Store Name</label>
                            <input
                              type="text"
                              value={newStoreName}
                              onChange={(e) => setNewStoreName(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                              placeholder="Enter store name..."
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-405 dark:text-slate-500 mb-1 uppercase">Store ID</label>
                            <input
                              type="number"
                              value={newStoreId}
                              onChange={(e) => setNewStoreId(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                              placeholder="Enter store ID..."
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                    >
                      <option value="Store Manager">Store Manager</option>
                      <option value="District Manager">District Manager</option>
                      <option value="Regional Manager">Regional Manager</option>
                    </select>
                  </div>

                  {role === 'Store Manager' && meta && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Assign Store</label>
                      <select
                        value={assignedStoreId}
                        onChange={(e) => setAssignedStoreId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                        required
                      >
                        <option value="">Select Store...</option>
                        {meta.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

                  {role === 'District Manager' && meta && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Assign District</label>
                      <select
                        value={assignedDistrictId}
                        onChange={(e) => setAssignedDistrictId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                        required
                      >
                        <option value="">Select District...</option>
                        {meta.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}

                  {role === 'Regional Manager' && meta && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Assign Region</label>
                      <select
                        value={assignedRegionId}
                        onChange={(e) => setAssignedRegionId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:outline-none dark:text-white"
                        required
                      >
                        <option value="">Select Region...</option>
                        {meta.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {message && (
                <p className={`text-xs font-semibold ${message.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>
                  {message}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save size={16} /> {isAdding ? 'Create User' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setIsAdding(false);
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-350"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <UserCog size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">Select a user to modify their role and store/district/region scopes or click "+ Add User" to create a new one.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
