import { useState } from 'react';
import { Shield, Lock, EyeOff, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePatientData } from '../../hooks/usePatientData';
import { patientService } from '../../services/patientService';
import { EmptyState } from '../../components/shared/EmptyState';
import clsx from 'clsx';

export function Privacy() {
  const { consents, refresh } = usePatientData();
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeConsents = consents.filter(c => c.status === 'active');
  const pastConsents = consents.filter(c => c.status !== 'active');

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get all checked checkboxes for data types
    const dataTypes = Array.from(e.currentTarget.querySelectorAll('input[name="dataTypes"]:checked'))
      .map(cb => (cb as HTMLInputElement).value);

    if (dataTypes.length === 0) {
      alert("Please select at least one type of data to share.");
      return;
    }

    const consent = {
      provider_name: formData.get('providerName'),
      purpose: formData.get('purpose'),
      granted_date: new Date().toISOString().split('T')[0],
      expiry_date: formData.get('expiryDate') || null,
      data_types: dataTypes,
      status: 'active'
    };

    try {
      setIsSaving(true);
      await patientService.createConsent(consent);
      await refresh();
      setShowAdd(false);
    } catch (err: any) {
      alert(err.message || 'Failed to grant consent');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke data access for this provider? They will immediately lose access to your health records.')) return;
    try {
      await patientService.revokeConsent(id);
      await refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke consent');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Privacy & Consent</h1>
          <p className="co-page-subtitle">Control who has access to your health data.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Grant Access
        </button>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-4 items-start">
        <Lock className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-emerald-900">Your data is encrypted and secure</h3>
          <p className="text-emerald-700 text-sm mt-1">
            CareOS uses military-grade encryption to protect your health records. No doctor, hospital, or third party can access your data without your explicit, active consent listed below.
          </p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-800 mt-8 mb-4">Active Data Shares</h2>
      
      {activeConsents.length === 0 ? (
        <EmptyState 
          icon={Shield}
          title="No active data shares"
          description="You are currently not sharing your health data with anyone."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeConsents.map(consent => (
            <div key={consent.id} className="co-card border-l-4 border-l-emerald-500">
              <div className="co-card-body flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-lg">{consent.provider_name}</h3>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Purpose: {consent.purpose}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {consent.data_types.map((type: string) => (
                      <span key={type} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:items-end gap-2 md:w-48 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="text-xs text-slate-500">Granted: <span className="font-medium text-slate-700">{consent.granted_date}</span></div>
                  <div className="text-xs text-slate-500 mb-2">Expires: <span className="font-medium text-slate-700">{consent.expiry_date || 'Never'}</span></div>
                  <button onClick={() => handleRevoke(consent.id)} className="co-btn co-btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 w-full justify-center">
                    <EyeOff className="h-4 w-4" /> Revoke Access
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pastConsents.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-slate-800 mt-8 mb-4">Past / Revoked Access</h2>
          <div className="space-y-3">
            {pastConsents.map(consent => (
              <div key={consent.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between opacity-70">
                <div>
                  <h4 className="font-bold text-slate-700">{consent.provider_name}</h4>
                  <p className="text-xs text-slate-500">Access {consent.status} on {consent.expiry_date || 'Unknown'}</p>
                </div>
                <span className={clsx(
                  "text-[10px] uppercase font-bold px-2 py-1 rounded-md",
                  consent.status === 'revoked' ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"
                )}>
                  {consent.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Grant Data Access</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex gap-2 mb-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>You are about to authorize a third party to view your protected health information.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider or Organization Name *</label>
                <input type="text" name="providerName" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Dr. Jane Doe or Apollo Hospital" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose of Access *</label>
                <input type="text" name="purpose" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Second opinion consultation" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">What data can they access? *</label>
                <div className="grid grid-cols-2 gap-2 border border-slate-200 p-3 rounded-lg bg-slate-50">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dataTypes" value="appointments" className="rounded text-cyan-600 focus:ring-cyan-500" /> Appointments</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dataTypes" value="medications" className="rounded text-cyan-600 focus:ring-cyan-500" /> Medications</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dataTypes" value="reports" className="rounded text-cyan-600 focus:ring-cyan-500" /> Lab Reports</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dataTypes" value="timeline" className="rounded text-cyan-600 focus:ring-cyan-500" /> Care Timeline</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dataTypes" value="profile" className="rounded text-cyan-600 focus:ring-cyan-500" /> Medical Profile</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Access Expiry Date (Optional)</label>
                <input type="date" name="expiryDate" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                <p className="text-xs text-slate-500 mt-1">Leave blank for indefinite access (you can revoke anytime).</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
                <button type="button" className="co-btn co-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="co-btn co-btn-primary" disabled={isSaving}>
                  {isSaving ? 'Authorizing...' : 'Authorize Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
