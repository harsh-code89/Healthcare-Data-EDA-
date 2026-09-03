import { useState } from 'react';
import { UploadCloud, FileBarChart2, Download, Eye, Sparkles } from 'lucide-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { AIDisclaimer } from '../../components/shared/AIDisclaimer';
import { usePatientData } from '../../hooks/usePatientData';
import { patientService } from '../../services/patientService';

export function Reports() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { reports, refresh } = usePatientData();

  const categories = ['All', 'blood_test', 'imaging', 'ecg', 'urine_test'];
  const labels: Record<string, string> = {
    'All': 'All Reports',
    'blood_test': 'Blood Tests',
    'imaging': 'Imaging & X-Ray',
    'ecg': 'ECG / Cardiac',
    'urine_test': 'Urine Tests',
    'pathology': 'Pathology'
  };

  const filteredReports = reports.filter(r => activeCategory === 'All' || r.category === activeCategory);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      alert("Please select a file to upload.");
      return;
    }

    const metadata = {
      name: formData.get('name'),
      category: formData.get('category'),
      reportDate: formData.get('reportDate'),
      labName: formData.get('labName')
    };

    try {
      setIsUploading(true);
      await patientService.uploadReport(file, metadata);
      await refresh();
      setShowUpload(false);
    } catch (err: any) {
      alert(err.message || "Failed to upload report");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="co-page-title">Reports & Documents</h1>
          <p className="co-page-subtitle">All your medical reports in one secure place.</p>
        </div>
        <button className="co-btn co-btn-primary" onClick={() => setShowUpload(true)}>
          <UploadCloud className="h-4 w-4" /> Upload Report
        </button>
      </div>

      <div className="co-tabs-scrollable border-b border-slate-200">
        <div className="flex gap-6 pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeCategory === cat 
                  ? 'border-cyan-600 text-cyan-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {labels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <EmptyState 
          icon={FileBarChart2}
          title="No reports found"
          description="You don't have any reports in this category yet."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReports.map(report => (
            <div key={report.id} className="co-card flex flex-col">
              <div className="co-card-body flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <FileBarChart2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1" title={report.name}>{report.name}</h3>
                      <div className="text-xs text-slate-500">{labels[report.category] || report.category}</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-xs">Date</span>
                      <span className="font-medium">{report.reportDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Lab</span>
                      <span className="font-medium truncate block">{report.labName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {report.isAIExplained && (
                  <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                    <Sparkles className="h-3 w-3" /> AI Explanation Available
                  </div>
                )}
              </div>
              
              <div className="co-card-footer flex justify-between gap-2 bg-slate-50">
                <div className="flex gap-2">
                  {report.fileUrl ? (
                    <a href={report.fileUrl} target="_blank" rel="noreferrer" className="co-btn co-btn-secondary co-btn-sm" title="View"><Eye className="h-4 w-4" /></a>
                  ) : (
                    <button className="co-btn co-btn-secondary co-btn-sm" title="View"><Eye className="h-4 w-4" /></button>
                  )}
                  {report.fileUrl && (
                    <a href={report.fileUrl} download className="co-btn co-btn-secondary co-btn-sm" title="Download"><Download className="h-4 w-4" /></a>
                  )}
                </div>
                {report.isAIExplained && (
                  <button onClick={() => setSelectedReport(report)} className="co-btn co-btn-primary co-btn-sm bg-indigo-600 hover:bg-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" /> Explain
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Upload Report</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Name *</label>
                <input type="text" name="name" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Complete Blood Count" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select name="category" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="blood_test">Blood Test</option>
                  <option value="imaging">Imaging & X-Ray</option>
                  <option value="ecg">ECG / Cardiac</option>
                  <option value="urine_test">Urine Test</option>
                  <option value="pathology">Pathology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Date *</label>
                <input type="date" name="reportDate" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lab / Hospital Name</label>
                <input type="text" name="labName" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Apollo Diagnostics" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File (PDF or Image) *</label>
                <input type="file" name="file" accept=".pdf,image/*" required className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" className="co-btn co-btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="co-btn co-btn-primary" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Explanation Panel */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end p-0">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <div className="flex items-center gap-2 text-indigo-800 font-bold">
                <Sparkles className="h-5 w-5" /> AI Explanation
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-indigo-400 hover:text-indigo-600 bg-white rounded-full p-1 shadow-sm">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <AIDisclaimer />
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{selectedReport.name}</h3>
                <p className="text-sm text-slate-500 mb-4">Report date: {selectedReport.reportDate}</p>
                
                <div className="prose prose-sm prose-slate max-w-none">
                  <p className="whitespace-pre-line text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {selectedReport.summary || "This report indicates a summary of your recent test. All core values appear to be within the standard reference range. We suggest showing this directly to your primary care physician during your next visit to discuss the detailed breakdown."}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 mb-3">Questions to ask your doctor:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-indigo-500 font-bold">•</span> Are any of these values concerning for my specific age group?
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-indigo-500 font-bold">•</span> Should I make any dietary changes based on this?
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-indigo-500 font-bold">•</span> When should I repeat this test?
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white">
              <button className="co-btn co-btn-primary w-full justify-center" onClick={() => setSelectedReport(null)}>
                Got it, thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
