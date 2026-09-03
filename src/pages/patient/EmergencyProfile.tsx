import { ShieldAlert, Droplet, Phone, HeartPulse, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function EmergencyProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center pb-6 border-b border-slate-200">
        <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Emergency Medical Profile</h1>
        <p className="text-slate-500">
          This information can be critical for first responders and ER doctors in a medical emergency.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Patient Details</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">ID: {user?.id.split('-')[0].toUpperCase()}</span>
        </div>
        
        <div className="p-6 grid gap-6 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</span>
            <span className="text-lg font-medium text-slate-900">{user?.name}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Blood Group</span>
            <div className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-rose-500" />
              <span className="text-lg font-bold text-slate-900">{user?.bloodGroup || 'Not specified'}</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Known Allergies</span>
            <div className="flex gap-3 items-start">
              <HeartPulse className="h-5 w-5 text-amber-500 mt-0.5" />
              <span className="text-lg font-medium text-slate-900">
                {user?.allergies ? user.allergies : <span className="text-slate-400 italic">None recorded</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Emergency Contacts</h2>
        </div>
        
        <div className="p-6">
          {user?.emergencyContactName ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
                {user.emergencyContactName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{user.emergencyContactName}</h3>
                <div className="flex items-center gap-2 text-slate-600 mt-1">
                  <Phone className="h-4 w-4 text-cyan-600" />
                  <span className="font-medium">{user.emergencyContactPhone || 'No phone number provided'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-500 italic">
              No primary emergency contact configured.
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
        <Edit className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-900">Need to update this information?</h3>
          <p className="text-blue-700 text-sm mt-1">
            You can modify your blood group, allergies, and emergency contacts at any time from your Account Settings. Click your profile icon in the top right and select "Profile Settings" &gt; "Medical".
          </p>
        </div>
      </div>
    </div>
  );
}
