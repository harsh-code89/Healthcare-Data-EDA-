import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePatientData } from '../../hooks/usePatientData';
import { 
  Calendar, Pill, FileBarChart2, Activity, MessageSquare, 
  Stethoscope, UploadCloud, MapPin, Clock 
} from 'lucide-react';

import { useState, useEffect } from 'react';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appointments, activeMedications, reports, timelineEvents, isLoading: dataLoading } = usePatientData();
  const [greeting, setGreeting] = useState('');
  
  // Combine artificial and data loading states to prevent flicker
  const [artificialLoading, setArtificialLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setArtificialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const loading = dataLoading || artificialLoading;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning ☀️');
    else if (hour < 18) setGreeting('Good afternoon 🌅');
    else setGreeting('Good evening 🌙');
  }, []);

  const todayStr = new Intl.DateTimeFormat('en-IN', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  }).format(new Date());

  const nextAppointment = appointments.find(a => a.status === 'upcoming');
  const activeMedCount = activeMedications.length;
  const latestReport = [...reports].sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())[0];
  const recentTimeline = [...timelineEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="co-skeleton h-24 w-full"></div>
        <div className="co-grid-4">
          <div className="co-skeleton h-32 w-full"></div>
          <div className="co-skeleton h-32 w-full"></div>
          <div className="co-skeleton h-32 w-full"></div>
          <div className="co-skeleton h-32 w-full"></div>
        </div>
        <div className="co-skeleton h-64 w-full"></div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {greeting}, {firstName}
          </h1>
          <p className="text-slate-500">Here is your health overview for today, {todayStr}.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="co-grid-4">
        <div className="co-stat-card group cursor-pointer" onClick={() => navigate('/appointments')}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="co-stat-label">Next Appointment</div>
          {nextAppointment ? (
            <>
              <div className="font-bold text-slate-900 mt-1 truncate">{nextAppointment.date}</div>
              <div className="text-xs text-slate-500 truncate mt-1">Dr. {nextAppointment.providerName.split(' ')[1]}</div>
            </>
          ) : (
            <div className="font-bold text-slate-400 mt-1">No upcoming</div>
          )}
        </div>

        <div className="co-stat-card group cursor-pointer" onClick={() => navigate('/medications')}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <div className="co-stat-label">Active Medications</div>
          <div className="co-stat-value mt-1">{activeMedCount}</div>
          <div className="text-xs text-slate-500">Scheduled for today</div>
        </div>

        <div className="co-stat-card group cursor-pointer" onClick={() => navigate('/reports')}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileBarChart2 className="h-5 w-5" />
            </div>
          </div>
          <div className="co-stat-label">Latest Report</div>
          {latestReport ? (
            <>
              <div className="font-bold text-slate-900 mt-1 truncate" title={latestReport.name}>{latestReport.name}</div>
              <div className="text-xs text-slate-500 truncate mt-1">{latestReport.reportDate}</div>
            </>
          ) : (
            <div className="font-bold text-slate-400 mt-1">No reports</div>
          )}
        </div>

        <div className="co-stat-card group cursor-pointer" onClick={() => navigate('/timeline')}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="co-stat-label">Care Journey</div>
          <div className="co-stat-value mt-1">{timelineEvents.length}</div>
          <div className="text-xs text-slate-500">Timeline events logged</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="co-quick-actions">
          <button className="co-quick-action" onClick={() => navigate('/appointments')}>
            <div className="co-quick-action-icon text-blue-600 bg-blue-50"><Calendar className="h-5 w-5" /></div>
            <span className="co-quick-action-label">Book Appt</span>
          </button>
          <button className="co-quick-action" onClick={() => navigate('/reports')}>
            <div className="co-quick-action-icon text-purple-600 bg-purple-50"><UploadCloud className="h-5 w-5" /></div>
            <span className="co-quick-action-label">Upload</span>
          </button>
          <button className="co-quick-action border-cyan-200" onClick={() => navigate('/ai-assistant')}>
            <div className="co-quick-action-icon text-white bg-gradient-to-br from-cyan-500 to-blue-600"><MessageSquare className="h-5 w-5" /></div>
            <span className="co-quick-action-label text-cyan-700">Ask AI</span>
          </button>
          <button className="co-quick-action" onClick={() => navigate('/medications')}>
            <div className="co-quick-action-icon text-emerald-600 bg-emerald-50"><Pill className="h-5 w-5" /></div>
            <span className="co-quick-action-label">Add Med</span>
          </button>
          <button className="co-quick-action" onClick={() => navigate('/timeline')}>
            <div className="co-quick-action-icon text-indigo-600 bg-indigo-50"><Activity className="h-5 w-5" /></div>
            <span className="co-quick-action-label">Timeline</span>
          </button>
        </div>
      </div>

      <div className="co-grid-2">
        {/* Left Col: Appointments */}
        <div className="co-card">
          <div className="co-card-header flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Upcoming Appointments</h3>
            <button onClick={() => navigate('/appointments')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">View all</button>
          </div>
          <div className="co-card-body p-0">
            {appointments.filter(a => a.status === 'upcoming').length === 0 ? (
              <div className="p-6 text-center text-slate-500">No upcoming appointments.</div>
            ) : (
              appointments.filter(a => a.status === 'upcoming').slice(0, 2).map((appt) => (
                <div key={appt.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/appointments')}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-900">{appt.providerName}</div>
                    <span className={`co-badge ${appt.type === 'teleconsultation' ? 'co-badge-info' : 'co-badge-neutral'}`}>
                      {appt.type === 'teleconsultation' ? 'Video Call' : 'In-person'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-2">{appt.specialty}</div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {appt.date}</div>
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> {appt.time}</div>
                    {appt.type === 'in_person' && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {appt.hospital}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Timeline Snippet */}
        <div className="co-card">
          <div className="co-card-header flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Care Timeline</h3>
            <button onClick={() => navigate('/timeline')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">Full timeline</button>
          </div>
          <div className="co-card-body">
            <div className="co-timeline ml-2">
              {recentTimeline.map((event) => (
                <div key={event.id} className="co-timeline-item !pb-6 last:!pb-0">
                  <div className={`co-timeline-dot w-8 h-8 -ml-[15px] co-timeline-dot-${event.type.split('_')[0]}`}>
                    {event.type === 'consultation' && <Stethoscope className="h-4 w-4" />}
                    {event.type === 'lab_report' && <FileBarChart2 className="h-4 w-4" />}
                    {event.type === 'prescription' && <Pill className="h-4 w-4" />}
                    {event.type === 'diagnosis' && <Activity className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-0.5">{event.date}</div>
                    <div className="text-sm font-bold text-slate-800 mb-1">{event.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="co-emergency-card flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/emergency')}>
        <div className="flex items-center gap-6">
          <div className="co-blood-group">--</div>
          <div>
            <h3 className="font-bold text-red-900 text-lg mb-1">Emergency Profile</h3>
            <div className="text-sm text-red-700 mb-1">
              <strong>Allergies:</strong> Not configured
            </div>
            <div className="text-sm text-red-700">
              <strong>Emergency Contact:</strong> Not configured
            </div>
          </div>
        </div>
        <button className="co-btn co-btn-danger w-full md:w-auto shrink-0">
          Setup Card
        </button>
      </div>

    </div>
  );
}
