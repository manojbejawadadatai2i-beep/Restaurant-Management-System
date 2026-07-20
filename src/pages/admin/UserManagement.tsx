import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types';
import axios from '../../utils/axios';
import { UserCog, Store, Map, Landmark, Trash2, Search, Plus } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Dialog } from '../../components/ui/Dialog';

interface MetaData {
  regions: { id: number; name: string }[];
  districts: { id: number; name: string; region_id: number }[];
  stores: { id: number; name: string; district_id: number; region_id: number }[];
}

export const UserManagement: React.FC = () => {
  const { users, refreshUsers, currentUser, hasPermission } = useAuth();
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
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
        const response = await axios.get('/api/meta');
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
    setIsFormOpen(true);
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
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdding && !editingUser) return;

    setIsSaving(true);
    setMessage('');
    try {
      if (isAdding) {
        await axios.post('/api/users', {
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
          setIsFormOpen(false);
          setIsAdding(false);
          setMessage('');
        }, 1200);
      } else {
        await axios.put(`/api/users/${editingUser!.id}`, {
          role,
          assigned_store_id: assignedStoreId || null,
          assigned_district_id: assignedDistrictId || null,
          assigned_region_id: assignedRegionId || null
        });
        setMessage('User updated successfully!');
        await refreshUsers();
        setTimeout(() => {
          setIsFormOpen(false);
          setEditingUser(null);
          setMessage('');
        }, 1200);
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
      await axios.delete(`/api/users/${userId}`);
      if (editingUser?.id === userId) {
        setEditingUser(null);
      }
      await refreshUsers();
      setMessage('User deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      setDeletingUserId(null);
    } catch {
      setMessage('Error deleting user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canAccess = hasPermission('view:user-management');

  if (!canAccess) {
    return (
      <Alert variant="error" title="Access Denied">
        You do not have administrative permissions to view or manage users.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <Card>
        <CardHeader className="border-b-0 pb-0 mb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center flex-shrink-0">
                <UserCog size={20} />
              </div>
              <div>
                <CardTitle>User Management & Store Assignments</CardTitle>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Control corporate and manager authorization</p>
              </div>
            </div>
            <Button
              onClick={handleAddClick}
              leftIcon={<Plus size={16} />}
              size="sm"
            >
              Add User
            </Button>
          </div>
        </CardHeader>
      </Card>

      {message && !isFormOpen && (
        <Alert variant={message.includes('successfully') ? 'success' : 'error'} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {/* Main Grid */}
      <div className="space-y-4">
        
        {/* Search */}
        <div className="relative max-w-md">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
            placeholder="Search by username, email, role, or scope..."
          />
        </div>

        {/* Users Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Scope</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-bold text-slate-900 dark:text-white">
                  <div>
                    <p>{u.username}</p>
                    {u.email && <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{u.email}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                    {u.role}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {u.store_name && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Store size={13} className="text-slate-400" /> {u.store_name}
                      </span>
                    )}
                    {u.district_name && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Map size={13} className="text-slate-400" /> {u.district_name}
                      </span>
                    )}
                    {u.region_name && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Landmark size={13} className="text-slate-400" /> {u.region_name}
                      </span>
                    )}
                    {!u.store_name && !u.district_name && !u.region_name && (
                      <span className="text-slate-400 text-xs font-medium">System-Wide Access</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {deletingUserId === u.id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        onClick={() => handleDelete(u.id)}
                        disabled={isDeleting}
                        variant="danger"
                        size="sm"
                      >
                        Confirm
                      </Button>
                      <Button
                        onClick={() => setDeletingUserId(null)}
                        disabled={isDeleting}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      {u.role !== 'Corporate Administrator' && u.role !== 'Administrator' && (
                        <Button
                          onClick={() => handleEditClick(u)}
                          variant="outline"
                          size="sm"
                        >
                          Manage
                        </Button>
                      )}
                      {currentUser?.id !== u.id && u.role !== 'Corporate Administrator' && u.role !== 'Administrator' && (
                        <Button
                          onClick={() => {
                            setDeletingUserId(u.id);
                            setMessage('');
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Add Dialog Overlay */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isAdding ? 'Add New User' : 'Manage User Access'}
        description={isAdding ? 'Create credentials and assign a role scope' : `Adjust region/district/store scope for ${editingUser?.username}`}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {isAdding && (
            <>
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@restaurant.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </>
          )}

          <Select
            label="Role Designation"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'Store Manager', label: 'Store Manager' },
              { value: 'District Manager', label: 'District Manager' },
              { value: 'Regional Manager', label: 'Regional Manager' },
            ]}
          />

          {isAdding ? (
            <>
              {meta && (
                <Select
                  label="Region Assignment"
                  value={assignedRegionId}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  placeholder="Select Region..."
                  required
                  options={meta.regions.map(r => ({ value: r.id, label: r.name }))}
                />
              )}

              {meta && assignedRegionId && (
                <Select
                  label="District Assignment"
                  value={assignedDistrictId}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  placeholder="Select District..."
                  required
                  options={visibleDistricts.map(d => ({ value: d.id, label: d.name }))}
                />
              )}

              {meta && assignedDistrictId && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Store Setup Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="storeOption"
                        checked={storeOption === 'existing'}
                        onChange={() => setStoreOption('existing')}
                        className="accent-orange-500"
                      />
                      Existing Store
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="storeOption"
                        checked={storeOption === 'new'}
                        onChange={() => setStoreOption('new')}
                        className="accent-orange-500"
                      />
                      Create New Store
                    </label>
                  </div>

                  {storeOption === 'existing' ? (
                    <Select
                      label="Assign Existing Store"
                      value={assignedStoreId}
                      onChange={(e) => setAssignedStoreId(e.target.value)}
                      placeholder="Select Store..."
                      required
                      options={meta.stores
                        .filter(s => s.district_id === parseInt(assignedDistrictId, 10))
                        .map(s => ({ value: s.id, label: s.name }))}
                    />
                  ) : (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Input
                        label="New Store Name"
                        type="text"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        placeholder="e.g. Store 19"
                        required
                      />
                      <Input
                        label="Unique Store ID"
                        type="number"
                        value={newStoreId}
                        onChange={(e) => setNewStoreId(e.target.value)}
                        placeholder="e.g. 19"
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {role === 'Store Manager' && meta && (
                <Select
                  label="Assign Store Scope"
                  value={assignedStoreId}
                  onChange={(e) => setAssignedStoreId(e.target.value)}
                  placeholder="Select Store..."
                  required
                  options={meta.stores.map(s => ({ value: s.id, label: s.name }))}
                />
              )}

              {role === 'District Manager' && meta && (
                <Select
                  label="Assign District Scope"
                  value={assignedDistrictId}
                  onChange={(e) => setAssignedDistrictId(e.target.value)}
                  placeholder="Select District..."
                  required
                  options={meta.districts.map(d => ({ value: d.id, label: d.name }))}
                />
              )}

              {role === 'Regional Manager' && meta && (
                <Select
                  label="Assign Region Scope"
                  value={assignedRegionId}
                  onChange={(e) => setAssignedRegionId(e.target.value)}
                  placeholder="Select Region..."
                  required
                  options={meta.regions.map(r => ({ value: r.id, label: r.name }))}
                />
              )}
            </>
          )}

          {message && (
            <Alert variant={message.includes('successfully') ? 'success' : 'error'}>
              {message}
            </Alert>
          )}

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              isLoading={isSaving}
              className="flex-1"
            >
              {isAdding ? 'Create User' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={() => setIsFormOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
