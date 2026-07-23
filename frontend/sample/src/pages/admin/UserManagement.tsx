import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types';
import axios from '../../utils/axios';
import { UserCog, Building2, MapPin, Landmark, Trash2, Search, Plus } from 'lucide-react';
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
    setRole('Store Manager');
    setAssignedRegionId('');
    setAssignedDistrictId('');
    setAssignedStoreId('');
    setMessage('');
    setIsFormOpen(true);
  };

  // Helper: download a single-row credentials CSV instantly
  const downloadCredentials = (data: { username?: string; email?: string; password?: string; role?: string }) => {
    const uname = data.username || username || 'user';
    const uemail = data.email || email || `${uname.toLowerCase().replace(/\s+/g, '_')}@restaurant.com`;
    const upass = data.password || '';
    const urole = data.role || role || 'Store Manager';
    const header = 'Username,Email,Password,Role';
    const row = `"${uname}","${uemail}","${upass}","${urole}"`;
    const blob = new Blob([header + '\n' + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credentials_${uname.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdding && !editingUser) return;

    setIsSaving(true);
    setMessage('');
    try {
      if (isAdding) {
        let finalDistrictId = assignedDistrictId;
        let finalRegionId = assignedRegionId;

        if (role === 'Store Manager' && assignedStoreId && meta) {
          const matchedStore = meta.stores.find(s => s.id === parseInt(assignedStoreId, 10));
          if (matchedStore) {
            finalDistrictId = matchedStore.district_id.toString();
            finalRegionId = matchedStore.region_id.toString();
          }
        } else if (role === 'District Manager' && assignedDistrictId && meta) {
          const matchedDist = meta.districts.find(d => d.id === parseInt(assignedDistrictId, 10));
          if (matchedDist) {
            finalRegionId = matchedDist.region_id.toString();
          }
        }

        const res = await axios.post('/api/users', {
          username,
          email: email || null,
          role,
          assigned_store_id: assignedStoreId || null,
          assigned_district_id: finalDistrictId || null,
          assigned_region_id: finalRegionId || null,
        });

        // Auto-download credentials as CSV
        downloadCredentials({
          username: res.data.username,
          email: res.data.email,
          password: res.data.password,
          role: res.data.role,
        });

        await refreshUsers();
        setIsFormOpen(false);
        setMessage('User created successfully. Credentials downloaded.');
      } else {
        let finalStoreId = assignedStoreId;
        let finalDistrictId = assignedDistrictId;
        let finalRegionId = assignedRegionId;

        if (role === 'District Manager') {
          finalStoreId = '';
          if (assignedDistrictId && meta) {
            const matchedDist = meta.districts.find(d => d.id === parseInt(assignedDistrictId, 10));
            if (matchedDist) {
              finalRegionId = matchedDist.region_id.toString();
            }
          }
        } else if (role === 'Regional Manager') {
          finalStoreId = '';
          finalDistrictId = '';
        } else if (role === 'Corporate Administrator' || role === 'Super Admin' || role === 'Administrator') {
          finalStoreId = '';
          finalDistrictId = '';
          finalRegionId = '';
        } else if (role === 'Store Manager') {
          if (assignedStoreId && meta) {
            const matchedStore = meta.stores.find(s => s.id === parseInt(assignedStoreId, 10));
            if (matchedStore) {
              finalDistrictId = matchedStore.district_id.toString();
              finalRegionId = matchedStore.region_id.toString();
            }
          }
        }

        await axios.put(`/api/users/${editingUser!.id}`, {
          role,
          assigned_store_id: finalStoreId || null,
          assigned_district_id: finalDistrictId || null,
          assigned_region_id: finalRegionId || null,
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
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Error processing request.';
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
    } catch (err) {
      setMessage('Error deleting user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Derive assigned scope info badges for UI preview
  const selectedStoreObj = meta?.stores.find(s => s.id === parseInt(assignedStoreId, 10));
  const storeDistrictObj = selectedStoreObj ? meta?.districts.find(d => d.id === selectedStoreObj.district_id) : null;
  const storeRegionObj = selectedStoreObj ? meta?.regions.find(r => r.id === selectedStoreObj.region_id) : null;

  const selectedDistObj = meta?.districts.find(d => d.id === parseInt(assignedDistrictId, 10));
  const distRegionObj = selectedDistObj ? meta?.regions.find(r => r.id === selectedDistObj.region_id) : null;

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
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Scope</TableHead>
                <TableHead>Login Method</TableHead>
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
                          <Building2 size={13} className="text-slate-400" /> {u.store_name}
                        </span>
                      )}
                      {u.district_name && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin size={13} className="text-slate-400" /> {u.district_name}
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
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      u.login_method === 'google_only'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
                        : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800'
                    }`}>
                      {u.login_method === 'google_only' ? 'Google Login' : (u.login_method === 'password_only' ? 'Password Only' : 'Both')}
                    </span>
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
      </div>

      {/* Edit/Add Dialog Overlay */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isAdding ? 'Add New User' : 'Manage User Access'}
        description={isAdding ? 'Create credentials and assign a role scope. A credentials sheet will be downloaded automatically.' : `Adjust region/district/store scope for ${editingUser?.username}`}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {isAdding && (
            <>
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                placeholder="Enter username..."
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="name@restaurant.com"
                required
              />

              {/* Auto-credentials info banner */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Auto-Generated Password
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    A secure password is generated automatically. A credentials sheet (.csv) will download immediately after user creation.
                  </p>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 bg-amber-500 text-white rounded-lg tracking-wider flex-shrink-0">
                  Auto CSV
                </span>
              </div>
            </>
          )}

          <Select
            label="Role Designation"
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
            options={[
              { value: 'Store Manager', label: 'Store Manager' },
              { value: 'District Manager', label: 'District Manager' },
              { value: 'Regional Manager', label: 'Regional Manager' },
            ]}
          />

          {/* Scope Assignment */}
          {role === 'Store Manager' && meta && (
            <div className="space-y-3">
              <Select
                label="Assign Store"
                value={assignedStoreId}
                onChange={(e: any) => setAssignedStoreId(e.target.value)}
                placeholder="Select Store..."
                required
                options={meta.stores.map(s => ({ value: s.id, label: s.name }))}
              />
              {assignedStoreId && storeDistrictObj && storeRegionObj && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Auto-Resolved Scope</p>
                  <div className="flex gap-3 font-semibold">
                    <span>District: <strong className="text-slate-800 dark:text-slate-200">{storeDistrictObj.name}</strong></span>
                    <span>Region: <strong className="text-slate-800 dark:text-slate-200">{storeRegionObj.name}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {role === 'District Manager' && meta && (
            <div className="space-y-2">
              <Select
                label="Assign District"
                value={assignedDistrictId}
                onChange={(e: any) => setAssignedDistrictId(e.target.value)}
                placeholder="Select District..."
                required
                options={meta.districts.map(d => ({ value: d.id, label: d.name }))}
              />
              {assignedDistrictId && distRegionObj && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Auto-Resolved Scope</p>
                  <p className="font-semibold mt-0.5">Region: <strong className="text-slate-800 dark:text-slate-200">{distRegionObj.name}</strong></p>
                </div>
              )}
            </div>
          )}

          {role === 'Regional Manager' && meta && (
            <Select
              label="Assign Region"
              value={assignedRegionId}
              onChange={(e: any) => setAssignedRegionId(e.target.value)}
              placeholder="Select Region..."
              required
              options={meta.regions.map(r => ({ value: r.id, label: r.name }))}
            />
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
              {isAdding ? 'Create User & Download Credentials' : 'Save Changes'}
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

