import { useState } from 'react';
import { Pill, Plus, Clock, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { usePatientData } from '../../hooks/usePatientData';
import { patientService } from '../../services/patientService';

export function Medications() {
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { medications, isLoading, refresh } = usePatientData();

  const filteredMeds = medications.filter(m => 
    tab === 'active' ? m.isActive : !m.isActive
  );

  const handleStop = async (id: string) => {
    try {
      await patientService.updateMedicationStatus(id, false);
      refresh();
    } catch (error) {
      console.error('Failed to stop medication', error);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    try {
      await patientService.createMedication({
        name: formData.get('name'),
        dosage: formData.get('dosage'),
        frequency: formData.get('frequency'),
        route: formData.get('route'),
        startDate: formData.get('startDate'),
        isActive: true,
      });
      refresh();
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add medication', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Medications</h1>
          <p className="co-page-subtitle">Track your prescriptions and schedule.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Add Medication
        </button>
      </div>

      <div className="co-tabs w-max">
        <button className={`co-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          Active
        </button>
        <button className={`co-tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          Past
        </button>
      </div>

      {tab === 'active' && filteredMeds.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-900">
            <strong>Today's Schedule:</strong> You have {filteredMeds.filter(m => m.reminderEnabled).length} medications scheduled for today. Don't forget to take them on time.
          </div>
        </div>
      )}

      {filteredMeds.length === 0 ? (
        <EmptyState 
          icon={Pill}
          title="No medications found"
          description={`You have no ${tab} medications listed.`}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeds.map(med => (
            <div key={med.id} className={`co-card ${!med.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <div className="co-card-body">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${med.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{med.name} <span className="text-cyan-600 ml-1">{med.dosage}</span></h3>
                      {med.genericName && <div className="text-xs text-slate-500">{med.genericName}</div>}
                    </div>
                  </div>
                  {med.isActive && (
                    <button className="co-btn co-btn-ghost co-btn-sm text-red-600 hover:bg-red-50" onClick={() => handleStop(med.id)}>
                      Stop
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-xs">Frequency</span>
                    <span className="font-medium text-sm flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {med.frequency.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Prescribed by</span>
                    <span className="font-medium text-sm">{med.prescribedBy}</span>
                  </div>
                </div>

                {med.instructions && (
                  <div className="text-sm text-slate-600 mb-4 bg-yellow-50/50 p-2.5 rounded text-amber-900 border border-yellow-100/50">
                    {med.instructions}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-400">
                    Started: {med.startDate} {med.endDate ? ` • Ended: ${med.endDate}` : ''}
                  </div>
                  {med.isActive && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-medium text-slate-600">Reminder</span>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${med.reminderEnabled ? 'bg-cyan-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${med.reminderEnabled ? 'translate-x-4' : ''}`} />
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Add Medication</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name</label>
                <input name="name" type="text" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="e.g. Amoxicillin" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
                  <input name="dosage" type="text" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="e.g. 500mg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                  <input name="route" type="text" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="e.g. Oral" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                <select name="frequency" required className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="three_times_daily">Three Times Daily</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input name="startDate" type="date" required className="w-full border border-slate-300 rounded-lg p-2" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="co-btn co-btn-ghost">Cancel</button>
                <button type="submit" disabled={isSaving} className="co-btn co-btn-primary">
                  {isSaving ? 'Saving...' : 'Add Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
