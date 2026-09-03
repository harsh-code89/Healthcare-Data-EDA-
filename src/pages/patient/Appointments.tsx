import { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, Video, User } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { usePatientData } from '../../hooks/usePatientData';
import { patientService } from '../../services/patientService';

export function Appointments() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showBooking, setShowBooking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { appointments, refresh } = usePatientData();

  const filteredAppts = appointments.filter(a => 
    tab === 'upcoming' ? a.status === 'upcoming' : (a.status === 'completed' || a.status === 'cancelled')
  );

  const handleCancel = async (id: string) => {
    try {
      await patientService.updateAppointmentStatus(id, 'cancelled');
      refresh();
    } catch (error) {
      console.error('Failed to cancel appointment', error);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    try {
      await patientService.createAppointment({
        providerName: formData.get('providerName'),
        specialty: formData.get('specialty'),
        hospital: formData.get('hospital'),
        date: formData.get('date'),
        time: formData.get('time'),
        type: formData.get('type'),
        chiefComplaint: formData.get('chiefComplaint'),
      });
      refresh();
      setShowBooking(false);
    } catch (error) {
      console.error('Failed to book appointment', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Appointments</h1>
          <p className="co-page-subtitle">Manage your consultations and bookings.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => setShowBooking(true)}>
          <CalendarIcon className="h-4 w-4" /> Book Appointment
        </button>
      </div>

      <div className="co-tabs w-max">
        <button className={`co-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming
        </button>
        <button className={`co-tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          Past
        </button>
      </div>

      {filteredAppts.length === 0 ? (
        <EmptyState 
          icon={CalendarIcon}
          title="No appointments found"
          description={`You have no ${tab} appointments.`}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAppts.map(appt => (
            <div key={appt.id} className="co-card">
              <div className="co-card-body">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{appt.providerName}</h3>
                      <div className="text-sm text-slate-500">{appt.specialty}</div>
                    </div>
                  </div>
                  <span className={`co-badge ${appt.status === 'upcoming' ? 'co-badge-success' : 'co-badge-neutral'}`}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CalendarIcon className="h-4 w-4 text-cyan-600" /> {appt.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="h-4 w-4 text-cyan-600" /> {appt.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
                    {appt.type === 'teleconsultation' ? (
                      <><Video className="h-4 w-4 text-cyan-600" /> Teleconsultation</>
                    ) : (
                      <><MapPin className="h-4 w-4 text-cyan-600" /> {appt.hospital}</>
                    )}
                  </div>
                </div>

                {appt.chiefComplaint && (
                  <div className="text-sm text-slate-600 mb-4 line-clamp-1">
                    <strong>Reason:</strong> {appt.chiefComplaint}
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  {tab === 'upcoming' ? (
                    <>
                      {appt.type === 'teleconsultation' && (
                        <button className="co-btn co-btn-primary co-btn-sm flex-1">Join Call</button>
                      )}
                      <button className="co-btn co-btn-secondary co-btn-sm flex-1">Reschedule</button>
                      <button className="co-btn co-btn-ghost co-btn-sm text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleCancel(appt.id)}>Cancel</button>
                    </>
                  ) : (
                    <button className="co-btn co-btn-secondary co-btn-sm w-full">View Consultation Notes</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Book Appointment</h3>
              <button onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleBookSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provider Name</label>
                  <input name="providerName" type="text" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="e.g. Dr. Sarah Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                  <input name="specialty" type="text" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="e.g. Cardiology" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hospital / Clinic</label>
                  <input name="hospital" type="text" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="e.g. General Hospital" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input name="date" type="date" required className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input name="time" type="time" required className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Type</label>
                  <select name="type" required className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                    <option value="in_person">In Person</option>
                    <option value="teleconsultation">Teleconsultation</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint (Reason)</label>
                  <textarea name="chiefComplaint" required rows={3} className="w-full border border-slate-300 rounded-lg p-2" placeholder="Describe your symptoms or reason for visit"></textarea>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowBooking(false)} className="co-btn co-btn-ghost">Cancel</button>
                <button type="submit" disabled={isSaving} className="co-btn co-btn-primary">
                  {isSaving ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
