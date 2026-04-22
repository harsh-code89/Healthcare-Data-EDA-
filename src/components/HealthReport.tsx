import type { HealthReport as HealthReportType, Recommendation, UrgencyLevel } from '../types';
import {
  AlertTriangle, CheckCircle, Shield, ArrowLeft,
  Heart, Dumbbell, Apple, Pill, Stethoscope,
  ChevronDown, ChevronUp, Sparkles, AlertCircle, Info
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  report: HealthReportType;
  onBack: () => void;
}

function UrgencyBadge({ level }: { level: UrgencyLevel }) {
  const styles = {
    low: 'bg-green-100 text-green-700 border-green-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-red-100 text-red-700 border-red-200'
  };
  const labels = { low: 'Low Priority', moderate: 'Moderate Priority', high: 'High Priority' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {level === 'high' && <AlertTriangle className="w-3 h-3" />}
      {labels[level]}
    </span>
  );
}

function CategoryIcon({ category }: { category: Recommendation['category'] }) {
  const iconMap = {
    lifestyle: <Heart className="w-4 h-4" />,
    diet: <Apple className="w-4 h-4" />,
    exercise: <Dumbbell className="w-4 h-4" />,
    supplement: <Pill className="w-4 h-4" />,
    preventive: <Shield className="w-4 h-4" />
  };
  const colorMap = {
    lifestyle: 'bg-purple-100 text-purple-600',
    diet: 'bg-orange-100 text-orange-600',
    exercise: 'bg-blue-100 text-blue-600',
    supplement: 'bg-pink-100 text-pink-600',
    preventive: 'bg-teal-100 text-teal-600'
  };
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[category]}`}>
      {iconMap[category]}
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const categoryLabels = {
    lifestyle: 'Lifestyle',
    diet: 'Diet & Nutrition',
    exercise: 'Exercise',
    supplement: 'Supplement',
    preventive: 'Preventive Care'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left flex items-start gap-4"
      >
        <CategoryIcon category={rec.category} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{rec.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{categoryLabels[rec.category]}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <UrgencyBadge level={rec.urgency} />
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{rec.description}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Advantages
              </h5>
              <ul className="space-y-1.5">
                {rec.advantages.map((a, i) => (
                  <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <h5 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Disadvantages / Risks
              </h5>
              <ul className="space-y-1.5">
                {rec.disadvantages.map((d, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> Alternative Options
            </h5>
            <ul className="space-y-1.5">
              {rec.alternatives.map((a, i) => (
                <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span> {a}
                </li>
              ))}
            </ul>
          </div>

          {rec.requiresDoctor && rec.doctorNote && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-start gap-3">
              <Stethoscope className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Doctor Consultation Required</h5>
                <p className="text-xs text-red-700 leading-relaxed">{rec.doctorNote}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HealthReport({ report, onBack }: Props) {
  const overallColors = {
    low: { bg: 'from-green-500 to-emerald-600', text: 'text-green-100', label: 'Generally Healthy' },
    moderate: { bg: 'from-amber-500 to-orange-600', text: 'text-amber-100', label: 'Some Areas Need Attention' },
    high: { bg: 'from-red-500 to-rose-600', text: 'text-red-100', label: 'Important Issues Identified' }
  };

  const overall = overallColors[report.overallUrgency];

  const bmiPosition = Math.min(Math.max((report.bmi - 15) / 30 * 100, 0), 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">VitaLens Report</h1>
              <p className="text-xs text-slate-500">Your Personalized Health Analysis</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Overall Summary Card */}
        <div className={`rounded-2xl bg-gradient-to-r ${overall.bg} p-6 sm:p-8 text-white shadow-xl`}>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 ${overall.text}`}>
                  {overall.label}
                </span>
              </div>
              <h2 className="text-2xl font-bold">Health Analysis Summary</h2>
              <p className="text-white/90 text-sm leading-relaxed max-w-2xl">{report.summary}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-xs font-medium">Risk Factors</p>
              <p className="text-2xl font-bold mt-1">{report.riskFactors.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-xs font-medium">Recommendations</p>
              <p className="text-2xl font-bold mt-1">{report.recommendations.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-xs font-medium">Positive Findings</p>
              <p className="text-2xl font-bold mt-1">{report.positiveFindings.length}</p>
            </div>
          </div>
        </div>

        {/* BMI Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Body Mass Index (BMI)</h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{report.bmi}</p>
              <p className={`text-sm font-medium mt-1 ${
                report.bmiCategory === 'Normal' ? 'text-green-600' :
                report.bmiCategory === 'Overweight' ? 'text-amber-600' : 'text-red-600'
              }`}>{report.bmiCategory}</p>
            </div>
            <div className="flex-1">
              <div className="relative h-4 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="w-[15%] bg-blue-300" />
                  <div className="w-[28%] bg-green-400" />
                  <div className="w-[22%] bg-amber-400" />
                  <div className="w-[35%] bg-red-400" />
                </div>
                <div
                  className="absolute top-0 w-1 h-full bg-slate-900 rounded-full shadow-lg"
                  style={{ left: `${bmiPosition}%`, transform: 'translateX(-50%)' }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 font-medium">
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>Obese</span>
              </div>
            </div>
          </div>
        </div>

        {/* Positive Findings */}
        {report.positiveFindings.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Positive Findings
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {report.positiveFindings.map((f, i) => (
                <div key={i} className="flex items-start gap-3 bg-green-50 rounded-xl p-3 border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-green-800">{f}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {report.riskFactors.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Identified Risk Factors
            </h3>
            <div className="space-y-3">
              {report.riskFactors
                .sort((a, b) => {
                  const order = { high: 0, moderate: 1, low: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .map((rf, i) => (
                <div key={i} className={`rounded-xl p-4 border ${
                  rf.severity === 'high' ? 'bg-red-50 border-red-200' :
                  rf.severity === 'moderate' ? 'bg-amber-50 border-amber-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">{rf.name}</h4>
                        <UrgencyBadge level={rf.severity} />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{rf.description}</p>
                    </div>
                  </div>
                  {rf.relatedValues && (
                    <p className="text-xs text-slate-500 mt-2 font-mono bg-white/50 inline-block px-2 py-1 rounded">
                      {rf.relatedValues}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Personalized Recommendations
            </h3>
            <p className="text-sm text-slate-500 -mt-2">Click each recommendation to see detailed advantages, risks, and alternatives.</p>
            <div className="space-y-3">
              {report.recommendations
                .sort((a, b) => {
                  const order = { high: 0, moderate: 1, low: 2 };
                  return order[a.urgency] - order[b.urgency];
                })
                .map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Doctor Advisory */}
        {report.doctorAdvisory.length > 0 && (
          <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-6">
            <h3 className="text-base font-semibold text-red-800 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-red-600" />
              Doctor Consultation Advisory
            </h3>
            <div className="space-y-3">
              {report.doctorAdvisory.map((note, i) => (
                <div key={i} className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800 leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ The items above are strongly recommended for professional medical evaluation. This tool does not diagnose diseases or prescribe treatments.
              </p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Important Disclaimer</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            This health analysis is generated algorithmically based on the data you provided and general medical knowledge.
            It is intended for informational and educational purposes only. It does <strong>not</strong> constitute medical advice,
            diagnosis, or treatment. Individual health situations are complex and may require nuanced medical judgment.
            Always consult a qualified healthcare professional before making any changes to your medications, treatments,
            diet, or exercise regimen. If you are experiencing a medical emergency, please call your local emergency services immediately.
          </p>
        </div>

        <div className="text-center pb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Start New Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
