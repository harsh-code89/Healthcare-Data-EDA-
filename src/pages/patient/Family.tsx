import { useState } from 'react';
import { Users, Plus, Heart, Calendar } from 'lucide-react';
import { usePatientData } from '../../hooks/usePatientData';
import { patientService } from '../../services/patientService';
import { EmptyState } from '../../components/shared/EmptyState';

export function Family() {
  const { familyMembers, refresh } = usePatientData();
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const member = {
      name: formData.get('name'),
      relation: formData.get('relation'),
      date_of_birth: formData.get('dateOfBirth') || null,
      blood_group: formData.get('bloodGroup') || null,
      is_dependent: formData.get('isDependent') === 'on'
    };

    try {
      setIsSaving(true);
      await patientService.createFamilyMember(member);
      await refresh();
      setShowAdd(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add family member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this person from your family profiles?')) return;
    try {
      await patientService.deleteFamilyMember(id);
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to remove family member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Family Profiles</h1>
          <p className="co-page-subtitle">Manage health records for your dependents and loved ones.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Family Member
        </button>
      </div>

      {familyMembers.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No family members added"
          description="Add your children or elderly parents to manage their healthcare alongside yours."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map(member => (
            <div key={member.id} className="co-card flex flex-col relative overflow-hidden">
              {member.is_dependent && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">
                  Dependent
                </div>
              )}
              <div className="co-card-body flex-1 text-center pt-8">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center font-bold text-2xl mb-4">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
                <p className="text-slate-500 capitalize">{member.relation}</p>
                
                <div className="mt-6 space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 text-left">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> DOB</span>
                    <span className="font-medium text-slate-900">{member.date_of_birth || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-slate-400" /> Blood Group</span>
                    <span className="font-medium text-slate-900">{member.blood_group || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="co-card-footer flex justify-between bg-slate-50">
                <button onClick={() => alert("Switching profiles will be implemented in a future update.")} className="text-indigo-600 font-medium text-sm hover:text-indigo-700">Switch to profile</button>
                <button onClick={() => handleDelete(member.id)} className="text-red-500 font-medium text-sm hover:text-red-600">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Add Family Member</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input type="text" name="name" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship *</label>
                <select name="relation" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input type="date" name="dateOfBirth" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                <select name="bloodGroup" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-2">
                <input type="checkbox" name="isDependent" id="isDependent" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="isDependent" className="text-sm text-slate-700">This person is a dependent (e.g. minor child)</label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
                <button type="button" className="co-btn co-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="co-btn co-btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
