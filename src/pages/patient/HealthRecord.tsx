import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, UploadCloud, Stethoscope, FileBarChart2, 
  Pill, Activity, Syringe, Scissors, Eye, ExternalLink
} from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { usePatientData } from '../../hooks/usePatientData';

const TABS = [
  'All', 'Consultations', 'Lab Reports', 'Prescriptions', 'Imaging', 'Vaccinations', 'Procedures'
];

export function HealthRecord() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  
  const { timelineEvents } = usePatientData();

  // Map tabs to timeline event types
  const typeMapping: Record<string, string[]> = {
    'All': [],
    'Consultations': ['consultation'],
    'Lab Reports': ['lab_report'],
    'Prescriptions': ['prescription'],
    'Imaging': ['imaging'],
    'Vaccinations': ['vaccination'],
    'Procedures': ['procedure']
  };

  const getIcon = (type: string) => {
    if (type === 'consultation') return <Stethoscope className="h-5 w-5" />;
    if (type === 'lab_report') return <FileBarChart2 className="h-5 w-5" />;
    if (type === 'prescription') return <Pill className="h-5 w-5" />;
    if (type === 'imaging') return <Activity className="h-5 w-5" />;
    if (type === 'vaccination') return <Syringe className="h-5 w-5" />;
    if (type === 'procedure') return <Scissors className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  // Filter records based on tab
  const filteredRecords = timelineEvents.filter(e => {
    if (activeTab === 'All') return true;
    const allowedTypes = typeMapping[activeTab] || [];
    return allowedTypes.includes(e.type);
  });

  // Group by month-year
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    const date = new Date(record.date);
    const key = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, typeof filteredRecords>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Health Record</h1>
          <p className="co-page-subtitle">Your complete medical history, organized.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => navigate('/reports')}>
          <UploadCloud className="h-4 w-4" /> Upload Report
        </button>
      </div>

      {/* Tabs */}
      <div className="co-tabs-scrollable border-b border-slate-200">
        <div className="flex gap-6 pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-cyan-600 text-cyan-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title={`No ${activeTab.toLowerCase()} found`} 
          description="You haven't uploaded or logged any records of this type yet."
          action={
            <button className="co-btn co-btn-primary mt-4" onClick={() => navigate('/reports')}>
              <ExternalLink className="h-4 w-4" /> Go to Reports
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedRecords).map(([monthYear, records]) => (
            <div key={monthYear} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{monthYear}</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {records.map((record, i) => (
                  <div key={record.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors ${i !== records.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 co-timeline-dot-${record.type.split('_')[0]}`}>
                      {getIcon(record.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">{record.title}</span>
                      </div>
                      <div className="text-sm text-slate-600 mb-1">{record.provider} {record.hospital && `• ${record.hospital}`}</div>
                      <div className="text-xs text-slate-400">{record.date}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <button className="co-btn co-btn-ghost co-btn-sm" title="View Document">
                        <Eye className="h-4 w-4" /> <span className="sm:hidden">View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
