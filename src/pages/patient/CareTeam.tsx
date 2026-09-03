import { useState } from 'react';
import { Users, Stethoscope, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { usePatientData } from '../../hooks/usePatientData';
import { patientService } from '../../services/patientService';
import { EmptyState } from '../../components/shared/EmptyState';

export function CareTeam() {
  const { careTeam, refresh } = usePatientData();
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const member = {
      name: formData.get('name'),
      specialty: formData.get('specialty'),
      hospital: formData.get('hospital'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      notes: formData.get('notes')
    };

    try {
      setIsSaving(true);
      await patientService.createCareTeamMember(member);
      await refresh();
      setShowAdd(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add provider');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this provider from your care team?')) return;
    try {
      await patientService.deleteCareTeamMember(id);
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to remove provider');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Care Team</h1>
          <p className="co-page-subtitle">Manage the doctors and specialists in your network.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Provider
        </button>
      </div>

      {careTeam.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="No providers found"
          description="Add doctors to your care team to easily book appointments."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {careTeam.map(provider => (
            <div key={provider.id} className="co-card">
              <div className="co-card-body flex gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-lg shrink-0">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{provider.name}</h3>
                      <p className="text-cyan-700 font-medium text-sm">{provider.specialty}</p>
                    </div>
                    <button onClick={() => handleDelete(provider.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors text-xs font-medium">Remove</button>
                  </div>
                  
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {provider.hospital && (
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {provider.hospital}</div>
                    )}
                    {provider.phone && (
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {provider.phone}</div>
                    )}
                    {provider.email && (
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {provider.email}</div>
                    )}
                  </div>
                  
                  {provider.notes && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic border border-slate-100">
                      "{provider.notes}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Add Provider to Care Team</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provider Name *</label>
                  <input type="text" name="name" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Dr. Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialty *</label>
                  <input type="text" name="specialty" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Cardiologist" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clinic / Hospital</label>
                <input type="text" name="hospital" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Apollo Hospital" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" name="phone" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" name="email" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="doctor@clinic.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Personal Notes</label>
                <textarea name="notes" rows={2} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Very attentive, available on Tuesdays..."></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
                <button type="button" className="co-btn co-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="co-btn co-btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
