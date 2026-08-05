import { useState } from 'react';
import type { HealthData } from '../types';
import {
  User, Activity, FlaskConical, Heart, Utensils,
  Target, ChevronRight, ChevronLeft, Sparkles
} from 'lucide-react';

const defaultData: HealthData = {
  age: 30,
  gender: 'male',
  heightCm: 170,
  weightKg: 70,
  pastMedicalHistory: '',
  familyMedicalHistory: '',
  totalCholesterol: '',
  ldl: '',
  hdl: '',
  triglycerides: '',
  fastingGlucose: '',
  hba1c: '',
  hemoglobin: '',
  vitaminD: '',
  vitaminB12: '',
  tsh: '',
  creatinine: '',
  alt: '',
  ast: '',
  systolicBP: '',
  diastolicBP: '',
  restingHeartRate: '',
  currentMedications: '',
  dietPattern: '',
  exerciseRoutine: '',
  exerciseFrequency: '',
  sleepDuration: '',
  sleepQuality: '',
  stressLevel: '',
  smokingStatus: '',
  alcoholUse: '',
  primaryGoals: [],
  symptoms: ''
};

const steps = [
  { id: 0, title: 'Demographics', icon: User, desc: 'Basic information' },
  { id: 1, title: 'Medical History', icon: Heart, desc: 'Past & family history' },
  { id: 2, title: 'Lab Results', icon: FlaskConical, desc: 'Blood test values' },
  { id: 3, title: 'Vitals', icon: Activity, desc: 'Blood pressure & heart rate' },
  { id: 4, title: 'Lifestyle', icon: Utensils, desc: 'Diet, exercise, sleep' },
  { id: 5, title: 'Goals', icon: Target, desc: 'Health goals & concerns' },
];

interface Props {
  onSubmit: (data: HealthData) => void;
}

export function HealthForm({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<HealthData>(defaultData);

  const update = <K extends keyof HealthData>(key: K, value: HealthData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const toggleGoal = (goal: string) => {
    setData(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goal)
        ? prev.primaryGoals.filter(g => g !== goal)
        : [...prev.primaryGoals, goal]
    }));
  };

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
  const selectClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm appearance-none";

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Age</label>
                <input type="number" className={inputClass} value={data.age} onChange={e => update('age', parseInt(e.target.value) || 0)} placeholder="30" />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select className={selectClass} value={data.gender} onChange={e => update('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Height (cm)</label>
                <input type="number" className={inputClass} value={data.heightCm} onChange={e => update('heightCm', parseFloat(e.target.value) || 0)} placeholder="170" />
              </div>
              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input type="number" className={inputClass} value={data.weightKg} onChange={e => update('weightKg', parseFloat(e.target.value) || 0)} placeholder="70" />
              </div>
            </div>
            {data.heightCm > 0 && data.weightKg > 0 && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border border-emerald-100">
                <p className="text-sm text-emerald-700 font-medium">
                  Calculated BMI: {(data.weightKg / ((data.heightCm / 100) ** 2)).toFixed(1)}
                </p>
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Past Medical History</label>
              <textarea className={inputClass + " min-h-[100px] resize-none"} value={data.pastMedicalHistory} onChange={e => update('pastMedicalHistory', e.target.value)} placeholder="e.g., Asthma, surgery in 2018, previous fracture..." />
              <p className="text-xs text-slate-400 mt-1">List any past diagnoses, surgeries, or hospitalizations</p>
            </div>
            <div>
              <label className={labelClass}>Family Medical History</label>
              <textarea className={inputClass + " min-h-[100px] resize-none"} value={data.familyMedicalHistory} onChange={e => update('familyMedicalHistory', e.target.value)} placeholder="e.g., Father — diabetes, Mother — heart disease, Grandmother — cancer..." />
              <p className="text-xs text-slate-400 mt-1">Include conditions in parents, siblings, and grandparents</p>
            </div>
            <div>
              <label className={labelClass}>Current Medications</label>
              <textarea className={inputClass + " min-h-[80px] resize-none"} value={data.currentMedications} onChange={e => update('currentMedications', e.target.value)} placeholder="e.g., Metformin 500mg, Vitamin D supplement..." />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100">
              Enter your most recent lab values. Leave blank if not available. All values help provide more accurate analysis.
            </p>
            <div className="space-y-1 mb-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lipid Panel</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Total Cholesterol (mg/dL)</label>
                <input type="text" className={inputClass} value={data.totalCholesterol} onChange={e => update('totalCholesterol', e.target.value)} placeholder="e.g., 200" />
              </div>
              <div>
                <label className={labelClass}>LDL (mg/dL)</label>
                <input type="text" className={inputClass} value={data.ldl} onChange={e => update('ldl', e.target.value)} placeholder="e.g., 130" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>HDL (mg/dL)</label>
                <input type="text" className={inputClass} value={data.hdl} onChange={e => update('hdl', e.target.value)} placeholder="e.g., 55" />
              </div>
              <div>
                <label className={labelClass}>Triglycerides (mg/dL)</label>
                <input type="text" className={inputClass} value={data.triglycerides} onChange={e => update('triglycerides', e.target.value)} placeholder="e.g., 150" />
              </div>
            </div>
            <div className="space-y-1 mb-2 pt-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood Sugar</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fasting Glucose (mg/dL)</label>
                <input type="text" className={inputClass} value={data.fastingGlucose} onChange={e => update('fastingGlucose', e.target.value)} placeholder="e.g., 95" />
              </div>
              <div>
                <label className={labelClass}>HbA1c (%)</label>
                <input type="text" className={inputClass} value={data.hba1c} onChange={e => update('hba1c', e.target.value)} placeholder="e.g., 5.4" />
              </div>
            </div>
            <div className="space-y-1 mb-2 pt-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Other Markers</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Hemoglobin (g/dL)</label>
                <input type="text" className={inputClass} value={data.hemoglobin} onChange={e => update('hemoglobin', e.target.value)} placeholder="e.g., 14.5" />
              </div>
              <div>
                <label className={labelClass}>TSH (mIU/L)</label>
                <input type="text" className={inputClass} value={data.tsh} onChange={e => update('tsh', e.target.value)} placeholder="e.g., 2.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Vitamin D (ng/mL)</label>
                <input type="text" className={inputClass} value={data.vitaminD} onChange={e => update('vitaminD', e.target.value)} placeholder="e.g., 35" />
              </div>
              <div>
                <label className={labelClass}>Vitamin B12 (pg/mL)</label>
                <input type="text" className={inputClass} value={data.vitaminB12} onChange={e => update('vitaminB12', e.target.value)} placeholder="e.g., 450" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Creatinine (mg/dL)</label>
                <input type="text" className={inputClass} value={data.creatinine} onChange={e => update('creatinine', e.target.value)} placeholder="e.g., 0.9" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>ALT (U/L)</label>
                  <input type="text" className={inputClass} value={data.alt} onChange={e => update('alt', e.target.value)} placeholder="e.g., 25" />
                </div>
                <div>
                  <label className={labelClass}>AST (U/L)</label>
                  <input type="text" className={inputClass} value={data.ast} onChange={e => update('ast', e.target.value)} placeholder="e.g., 22" />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Systolic BP (mmHg)</label>
                <input type="text" className={inputClass} value={data.systolicBP} onChange={e => update('systolicBP', e.target.value)} placeholder="e.g., 120" />
              </div>
              <div>
                <label className={labelClass}>Diastolic BP (mmHg)</label>
                <input type="text" className={inputClass} value={data.diastolicBP} onChange={e => update('diastolicBP', e.target.value)} placeholder="e.g., 80" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Resting Heart Rate (bpm)</label>
              <input type="text" className={inputClass} value={data.restingHeartRate} onChange={e => update('restingHeartRate', e.target.value)} placeholder="e.g., 72" />
            </div>
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📊 Reference Ranges</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><span className="font-medium">Blood Pressure:</span> Normal &lt;120/80, Elevated 120-129/&lt;80, High ≥130/80</p>
                <p><span className="font-medium">Resting Heart Rate:</span> Normal 60-100 bpm, Athletic &lt;60 bpm</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Diet Pattern</label>
              <select className={selectClass} value={data.dietPattern} onChange={e => update('dietPattern', e.target.value)}>
                <option value="">Select your diet pattern</option>
                <option value="balanced">Balanced / Whole Foods</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto / Low Carb</option>
                <option value="processed">Mostly Processed Foods</option>
                <option value="fast_food">Fast Food Heavy</option>
                <option value="irregular">Irregular / Skipping Meals</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Exercise Frequency</label>
                <select className={selectClass} value={data.exerciseFrequency} onChange={e => update('exerciseFrequency', e.target.value)}>
                  <option value="">Select frequency</option>
                  <option value="none">No exercise</option>
                  <option value="minimal">1-2 times/week</option>
                  <option value="moderate">3-4 times/week</option>
                  <option value="regular">5-6 times/week</option>
                  <option value="active">Daily / Very Active</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Exercise Type</label>
                <input type="text" className={inputClass} value={data.exerciseRoutine} onChange={e => update('exerciseRoutine', e.target.value)} placeholder="e.g., Running, weights, yoga..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Sleep Duration (hours)</label>
                <input type="text" className={inputClass} value={data.sleepDuration} onChange={e => update('sleepDuration', e.target.value)} placeholder="e.g., 7" />
              </div>
              <div>
                <label className={labelClass}>Sleep Quality</label>
                <select className={selectClass} value={data.sleepQuality} onChange={e => update('sleepQuality', e.target.value)}>
                  <option value="">Select quality</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Stress Level</label>
                <select className={selectClass} value={data.stressLevel} onChange={e => update('stressLevel', e.target.value)}>
                  <option value="">Select level</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Smoking</label>
                <select className={selectClass} value={data.smokingStatus} onChange={e => update('smokingStatus', e.target.value)}>
                  <option value="">Select status</option>
                  <option value="never">Never</option>
                  <option value="former">Former</option>
                  <option value="current">Current</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Alcohol</label>
                <select className={selectClass} value={data.alcoholUse} onChange={e => update('alcoholUse', e.target.value)}>
                  <option value="">Select usage</option>
                  <option value="none">None</option>
                  <option value="light">Light / Occasional</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Primary Health Goals</label>
              <p className="text-xs text-slate-400 mb-3">Select all that apply</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'fat_loss', label: '🔥 Fat Loss' },
                  { value: 'muscle_gain', label: '💪 Muscle Gain' },
                  { value: 'longevity', label: '🧬 Longevity' },
                  { value: 'disease_prevention', label: '🛡️ Disease Prevention' },
                  { value: 'energy', label: '⚡ More Energy' },
                  { value: 'mental_health', label: '🧠 Mental Health' },
                  { value: 'heart_health', label: '❤️ Heart Health' },
                  { value: 'flexibility', label: '🧘 Flexibility' },
                ].map(goal => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => toggleGoal(goal.value)}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all text-left ${
                      data.primaryGoals.includes(goal.value)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Current Symptoms or Concerns</label>
              <textarea className={inputClass + " min-h-[100px] resize-none"} value={data.symptoms} onChange={e => update('symptoms', e.target.value)} placeholder="e.g., Frequent headaches, fatigue in the afternoon, occasional joint pain..." />
              <p className="text-xs text-slate-400 mt-1">Describe any symptoms you're experiencing or health concerns you have</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">ViteLens</h1>
              <p className="text-xs text-slate-500">AI Health & Longevity Advisor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isComplete = i < step;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110'
                      : isComplete
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium hidden sm:block ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = steps[step].icon;
                return (
                  <>
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{steps[step].title}</h2>
                      <p className="text-sm text-slate-500">{steps[step].desc}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {renderStep()}
          </div>

          <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                step === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'text-slate-600 hover:bg-slate-200 bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onSubmit(data)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Generate Health Report
              </button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            ⚕️ This tool provides general wellness information only and does not constitute medical advice, diagnosis, or treatment.
            Always consult a qualified healthcare professional for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
