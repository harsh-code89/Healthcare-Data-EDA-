import { useState } from 'react';
import { Stethoscope, FileBarChart2, Pill, Activity, Syringe, Star, Plus } from 'lucide-react';
import clsx from 'clsx';
import { usePatientData } from '../../hooks/usePatientData';
import { patientService } from '../../services/patientService';
import { EmptyState } from '../../components/shared/EmptyState';

export function Timeline() {
  const [filter, setFilter] = useState('All');
  const [importantOnly, setImportantOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { timelineEvents, refresh } = usePatientData();

  const types = ['All', 'consultation', 'lab_report', 'prescription', 'diagnosis', 'vaccination'];

  const getIcon = (type: string) => {
    if (type === 'consultation') return <Stethoscope className="h-5 w-5" />;
    if (type === 'lab_report') return <FileBarChart2 className="h-5 w-5" />;
    if (type === 'prescription') return <Pill className="h-5 w-5" />;
    if (type === 'diagnosis') return <Activity className="h-5 w-5" />;
    if (type === 'vaccination') return <Syringe className="h-5 w-5" />;
    return <Activity className="h-5 w-5" />;
  };

  const filteredEvents = timelineEvents
    .filter(e => filter === 'All' || e.type === filter)
    .filter(e => !importantOnly || e.isImportant);

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const event = {
      title: formData.get('title'),
      type: formData.get('type'),
      date: formData.get('date'),
      provider: formData.get('provider'),
      hospital: formData.get('hospital'),
      description: formData.get('description'),
      isImportant: formData.get('isImportant') === 'on'
    };

    try {
      setIsSaving(true);
      await patientService.createTimelineEvent(event);
      await refresh();
      setShowAdd(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add timeline event');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Care Timeline</h1>
          <p className="co-page-subtitle">Your complete healthcare journey, from start to now.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors",
                filter === t ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
          <input 
            type="checkbox" 
            checked={importantOnly} 
            onChange={(e) => setImportantOnly(e.target.checked)}
            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          Important events only
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {filteredEvents.length === 0 ? (
          <EmptyState 
            icon={Activity}
            title="No events found"
            description="No timeline events match the selected filters."
          />
        ) : (
          <div className="co-timeline">
            {filteredEvents.map((event) => (
            <div key={event.id} className="co-timeline-item">
              <div className={`co-timeline-dot co-timeline-dot-${event.type.split('_')[0]}`}>
                {getIcon(event.type)}
              </div>
              <div className="flex-1 mt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{event.title}</span>
                    {event.isImportant && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shrink-0">
                    {event.date}
                  </span>
                </div>
                
                {event.provider && (
                  <div className="text-sm text-slate-600 font-medium mb-2">
                    {event.provider} {event.hospital && <span className="text-slate-400 font-normal">| {event.hospital}</span>}
                  </div>
                )}
                
                <div className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {event.description}
                </div>
                
                {event.tags && event.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {event.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Add Timeline Event</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title *</label>
                <input type="text" name="title" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Annual Checkup" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                  <select name="type" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="consultation">Consultation</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="procedure">Procedure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" name="date" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provider (Optional)</label>
                  <input type="text" name="provider" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Dr. Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hospital (Optional)</label>
                  <input type="text" name="hospital" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Clinic / Hospital" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea name="description" required rows={3} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Details about this event..."></textarea>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isImportant" id="isImportant" className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                <label htmlFor="isImportant" className="text-sm text-slate-700">Mark as important event</label>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
                <button type="button" className="co-btn co-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="co-btn co-btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
