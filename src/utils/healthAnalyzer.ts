import type { HealthData, HealthReport, RiskFactor, Recommendation, UrgencyLevel } from '../types';

function parseNum(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obese (Class I)';
  if (bmi < 40) return 'Obese (Class II)';
  return 'Obese (Class III)';
}

export function analyzeHealth(data: HealthData): HealthReport {
  const riskFactors: RiskFactor[] = [];
  const recommendations: Recommendation[] = [];
  const doctorAdvisory: string[] = [];
  const positiveFindings: string[] = [];
  let highestUrgency: UrgencyLevel = 'low';

  const setUrgency = (level: UrgencyLevel) => {
    if (level === 'high') highestUrgency = 'high';
    else if (level === 'moderate' && highestUrgency !== 'high') highestUrgency = 'moderate';
  };

  // BMI
  const bmi = calcBMI(data.weightKg, data.heightCm);
  const bmiCat = bmiCategory(bmi);

  if (bmi >= 30) {
    riskFactors.push({ name: 'Obesity', description: `BMI of ${bmi.toFixed(1)} indicates obesity, increasing risk for cardiovascular disease, diabetes, and joint problems.`, severity: 'high', relatedValues: `BMI: ${bmi.toFixed(1)}` });
    setUrgency('high');
    recommendations.push({
      title: 'Weight Management Program',
      category: 'lifestyle',
      description: 'A structured approach combining calorie deficit, regular exercise, and behavioral changes to achieve sustainable weight loss of 0.5–1 kg per week.',
      advantages: ['Reduces cardiovascular risk', 'Improves insulin sensitivity', 'Reduces joint stress', 'Improves sleep quality'],
      disadvantages: ['Requires consistent long-term commitment', 'Rapid weight loss can lead to muscle loss', 'May require professional guidance'],
      alternatives: ['Consult a registered dietitian for personalized meal plans', 'Consider cognitive behavioral therapy for eating habits', 'Structured programs like Mediterranean diet approach'],
      urgency: 'high',
      requiresDoctor: true,
      doctorNote: 'Consult your doctor before starting any weight loss program, especially if you have existing medical conditions.'
    });
    doctorAdvisory.push('BMI indicates obesity — medical evaluation recommended for metabolic screening and personalized weight management guidance.');
  } else if (bmi >= 25) {
    riskFactors.push({ name: 'Overweight', description: `BMI of ${bmi.toFixed(1)} is above normal range. Modest weight management can reduce future health risks.`, severity: 'moderate', relatedValues: `BMI: ${bmi.toFixed(1)}` });
    setUrgency('moderate');
    recommendations.push({
      title: 'Gradual Weight Optimization',
      category: 'lifestyle',
      description: 'Focus on portion control, increased physical activity, and nutrient-dense foods to gradually reach a healthier weight.',
      advantages: ['Prevents progression to obesity', 'Improves energy levels', 'Reduces disease risk'],
      disadvantages: ['Results take time', 'Requires dietary adjustments'],
      alternatives: ['Intermittent fasting (16:8 pattern)', 'Increased daily step count (10,000+ steps/day)', 'Strength training to boost metabolism'],
      urgency: 'moderate',
      requiresDoctor: false
    });
  } else if (bmi < 18.5) {
    riskFactors.push({ name: 'Underweight', description: `BMI of ${bmi.toFixed(1)} is below normal. This may indicate nutritional deficiencies or underlying health issues.`, severity: 'moderate', relatedValues: `BMI: ${bmi.toFixed(1)}` });
    setUrgency('moderate');
    doctorAdvisory.push('Underweight status should be evaluated to rule out underlying conditions such as thyroid disorders or malabsorption.');
  } else {
    positiveFindings.push(`Healthy BMI of ${bmi.toFixed(1)} — your weight is in a normal range for your height.`);
  }

  // Blood Pressure
  const sys = parseNum(data.systolicBP);
  const dia = parseNum(data.diastolicBP);
  if (sys !== null && dia !== null) {
    if (sys >= 140 || dia >= 90) {
      riskFactors.push({ name: 'Hypertension', description: 'Blood pressure readings indicate hypertension, a major risk factor for stroke, heart attack, and kidney disease.', severity: 'high', relatedValues: `${sys}/${dia} mmHg` });
      setUrgency('high');
      recommendations.push({
        title: 'Blood Pressure Management',
        category: 'lifestyle',
        description: 'Implement the DASH diet, reduce sodium intake to <2300mg/day, engage in regular aerobic exercise, manage stress, and limit alcohol.',
        advantages: ['Can lower BP by 10-15 mmHg without medication', 'Reduces stroke and heart attack risk', 'Improves overall cardiovascular health'],
        disadvantages: ['Requires significant dietary changes', 'Takes 4-12 weeks to see full effect', 'May still require medication in some cases'],
        alternatives: ['Meditation and deep breathing exercises', 'Potassium-rich diet', 'Weight loss if overweight (each kg lost can reduce BP by ~1 mmHg)'],
        urgency: 'high',
        requiresDoctor: true,
        doctorNote: 'This requires evaluation by a qualified healthcare professional. Hypertension may need pharmacological intervention alongside lifestyle changes.'
      });
      doctorAdvisory.push('Hypertension detected — immediate medical evaluation and monitoring is strongly recommended.');
    } else if (sys >= 120 || dia >= 80) {
      riskFactors.push({ name: 'Elevated Blood Pressure', description: 'Blood pressure is in the elevated/pre-hypertension range. Lifestyle modifications can prevent progression.', severity: 'moderate', relatedValues: `${sys}/${dia} mmHg` });
      setUrgency('moderate');
      recommendations.push({
        title: 'Blood Pressure Prevention',
        category: 'lifestyle',
        description: 'Reduce sodium intake, increase potassium-rich foods, maintain regular exercise, and monitor BP regularly.',
        advantages: ['Prevents progression to hypertension', 'No medication needed at this stage', 'Improves heart health'],
        disadvantages: ['Requires dietary discipline', 'Need regular monitoring'],
        alternatives: ['Home BP monitoring device for tracking', 'Stress reduction techniques', 'Regular cardiovascular exercise'],
        urgency: 'moderate',
        requiresDoctor: false
      });
    } else {
      positiveFindings.push(`Blood pressure of ${sys}/${dia} mmHg is in the healthy range.`);
    }
  }

  // Cholesterol
  const totalChol = parseNum(data.totalCholesterol);
  const ldl = parseNum(data.ldl);
  const hdl = parseNum(data.hdl);
  const trig = parseNum(data.triglycerides);

  if (totalChol !== null && totalChol >= 240) {
    riskFactors.push({ name: 'High Total Cholesterol', description: 'Total cholesterol is significantly elevated, increasing atherosclerosis risk.', severity: 'high', relatedValues: `Total Cholesterol: ${totalChol} mg/dL` });
    setUrgency('high');
    doctorAdvisory.push('High cholesterol levels require medical evaluation and possible lipid-lowering therapy.');
  } else if (totalChol !== null && totalChol >= 200) {
    riskFactors.push({ name: 'Borderline High Cholesterol', description: 'Total cholesterol is borderline high. Dietary and lifestyle changes recommended.', severity: 'moderate', relatedValues: `Total Cholesterol: ${totalChol} mg/dL` });
    setUrgency('moderate');
  } else if (totalChol !== null && totalChol < 200) {
    positiveFindings.push(`Total cholesterol of ${totalChol} mg/dL is within the desirable range.`);
  }

  if (ldl !== null && ldl >= 160) {
    riskFactors.push({ name: 'High LDL Cholesterol', description: 'LDL (bad cholesterol) is high, contributing to plaque buildup in arteries.', severity: 'high', relatedValues: `LDL: ${ldl} mg/dL` });
    setUrgency('high');
    recommendations.push({
      title: 'LDL Cholesterol Reduction',
      category: 'diet',
      description: 'Adopt a heart-healthy diet: increase soluble fiber (oats, beans, fruits), reduce saturated fats, add plant sterols, and incorporate omega-3 fatty acids.',
      advantages: ['Can reduce LDL by 10-25%', 'Reduces cardiovascular event risk', 'Improves overall lipid profile'],
      disadvantages: ['Dietary changes can be challenging', 'May not be sufficient alone for very high levels', 'Takes 3-6 months to see significant changes'],
      alternatives: ['Portfolio diet approach', 'Mediterranean diet', 'Discuss statin therapy with your doctor if lifestyle changes are insufficient'],
      urgency: 'high',
      requiresDoctor: true,
      doctorNote: 'This requires evaluation by a qualified healthcare professional for possible lipid-lowering medication.'
    });
  } else if (ldl !== null && ldl >= 130) {
    riskFactors.push({ name: 'Borderline High LDL', description: 'LDL cholesterol is borderline high.', severity: 'moderate', relatedValues: `LDL: ${ldl} mg/dL` });
  }

  if (hdl !== null && hdl < 40) {
    riskFactors.push({ name: 'Low HDL Cholesterol', description: 'HDL (good cholesterol) is low, reducing your cardiovascular protection.', severity: 'moderate', relatedValues: `HDL: ${hdl} mg/dL` });
    recommendations.push({
      title: 'Increase HDL Cholesterol',
      category: 'exercise',
      description: 'Regular aerobic exercise (30+ min, 5x/week), healthy fats (olive oil, nuts, avocado), and moderate alcohol reduction can boost HDL.',
      advantages: ['Improves cardiovascular protection', 'Enhances reverse cholesterol transport', 'Pairs well with overall fitness goals'],
      disadvantages: ['HDL is harder to raise than LDL is to lower', 'Genetic factors play a significant role'],
      alternatives: ['Niacin supplementation (consult doctor first)', 'Omega-3 fatty acid supplementation', 'Smoking cessation if applicable'],
      urgency: 'moderate',
      requiresDoctor: false
    });
  } else if (hdl !== null && hdl >= 60) {
    positiveFindings.push(`HDL cholesterol of ${hdl} mg/dL is optimal — good cardiovascular protection.`);
  }

  if (trig !== null && trig >= 200) {
    riskFactors.push({ name: 'High Triglycerides', description: 'Elevated triglycerides increase risk of heart disease and pancreatitis.', severity: 'high', relatedValues: `Triglycerides: ${trig} mg/dL` });
    setUrgency('high');
    doctorAdvisory.push('High triglycerides require medical evaluation, especially if above 500 mg/dL (pancreatitis risk).');
  } else if (trig !== null && trig >= 150) {
    riskFactors.push({ name: 'Borderline High Triglycerides', description: 'Triglycerides are mildly elevated. Reducing sugar and refined carbs can help.', severity: 'moderate', relatedValues: `Triglycerides: ${trig} mg/dL` });
  }

  // Glucose & Diabetes Risk
  const glucose = parseNum(data.fastingGlucose);
  const hba1c = parseNum(data.hba1c);

  if (glucose !== null && glucose >= 126) {
    riskFactors.push({ name: 'Diabetic-Range Fasting Glucose', description: 'Fasting glucose is in the diabetic range. This requires immediate medical evaluation.', severity: 'high', relatedValues: `Fasting Glucose: ${glucose} mg/dL` });
    setUrgency('high');
    doctorAdvisory.push('Fasting glucose in diabetic range — this requires evaluation by a qualified healthcare professional for diabetes diagnosis and management.');
    recommendations.push({
      title: 'Blood Sugar Management',
      category: 'diet',
      description: 'Adopt a low-glycemic diet, monitor carbohydrate intake, increase fiber, and engage in regular post-meal walks.',
      advantages: ['Can significantly improve blood sugar control', 'Reduces risk of diabetic complications', 'Improves energy stability'],
      disadvantages: ['Requires careful meal planning', 'May need medication alongside diet', 'Frequent monitoring initially'],
      alternatives: ['Mediterranean diet pattern', 'Continuous glucose monitoring', 'Structured diabetes prevention program'],
      urgency: 'high',
      requiresDoctor: true,
      doctorNote: 'This requires evaluation by a qualified healthcare professional. Diabetes management typically requires medical supervision.'
    });
  } else if (glucose !== null && glucose >= 100) {
    riskFactors.push({ name: 'Pre-Diabetic Fasting Glucose', description: 'Fasting glucose is in the pre-diabetic range (100-125 mg/dL). Lifestyle intervention can prevent progression.', severity: 'moderate', relatedValues: `Fasting Glucose: ${glucose} mg/dL` });
    setUrgency('moderate');
    recommendations.push({
      title: 'Pre-Diabetes Prevention',
      category: 'diet',
      description: 'Structured lifestyle intervention: 5-7% weight loss, 150 min/week moderate exercise, reduced refined carbohydrates, increased fiber intake.',
      advantages: ['Can reduce diabetes risk by 58%', 'Improves insulin sensitivity', 'Benefits overall metabolic health'],
      disadvantages: ['Requires sustained lifestyle changes', 'Regular glucose monitoring recommended'],
      alternatives: ['Low-carbohydrate diet approach', 'Intermittent fasting', 'Diabetes Prevention Program (DPP) structured program'],
      urgency: 'moderate',
      requiresDoctor: true,
      doctorNote: 'Pre-diabetes should be monitored by a healthcare provider with regular HbA1c testing.'
    });
  } else if (glucose !== null && glucose < 100) {
    positiveFindings.push(`Fasting glucose of ${glucose} mg/dL is in the normal range.`);
  }

  if (hba1c !== null && hba1c >= 6.5) {
    riskFactors.push({ name: 'Elevated HbA1c', description: 'HbA1c in diabetic range indicates poor long-term blood sugar control.', severity: 'high', relatedValues: `HbA1c: ${hba1c}%` });
    setUrgency('high');
    doctorAdvisory.push('HbA1c in diabetic range — immediate medical consultation required.');
  } else if (hba1c !== null && hba1c >= 5.7) {
    riskFactors.push({ name: 'Pre-Diabetic HbA1c', description: 'HbA1c suggests pre-diabetes. Combined with lifestyle changes, progression can be prevented.', severity: 'moderate', relatedValues: `HbA1c: ${hba1c}%` });
  } else if (hba1c !== null && hba1c < 5.7) {
    positiveFindings.push(`HbA1c of ${hba1c}% indicates good long-term blood sugar control.`);
  }

  // Thyroid
  const tsh = parseNum(data.tsh);
  if (tsh !== null) {
    if (tsh > 4.5) {
      riskFactors.push({ name: 'Elevated TSH (Possible Hypothyroidism)', description: 'Elevated TSH may indicate underactive thyroid, causing fatigue, weight gain, and other symptoms.', severity: 'moderate', relatedValues: `TSH: ${tsh} mIU/L` });
      setUrgency('moderate');
      doctorAdvisory.push('Elevated TSH requires further thyroid evaluation (Free T4, thyroid antibodies) by a healthcare professional.');
    } else if (tsh < 0.4) {
      riskFactors.push({ name: 'Low TSH (Possible Hyperthyroidism)', description: 'Low TSH may indicate overactive thyroid, causing anxiety, weight loss, and rapid heart rate.', severity: 'moderate', relatedValues: `TSH: ${tsh} mIU/L` });
      setUrgency('moderate');
      doctorAdvisory.push('Low TSH requires further thyroid evaluation by a healthcare professional.');
    } else {
      positiveFindings.push(`TSH of ${tsh} mIU/L is within normal range — thyroid function appears normal.`);
    }
  }

  // Vitamin D
  const vitD = parseNum(data.vitaminD);
  if (vitD !== null) {
    if (vitD < 20) {
      riskFactors.push({ name: 'Vitamin D Deficiency', description: 'Low vitamin D is associated with bone weakness, immune dysfunction, fatigue, and increased disease risk.', severity: 'moderate', relatedValues: `Vitamin D: ${vitD} ng/mL` });
      recommendations.push({
        title: 'Vitamin D Optimization',
        category: 'supplement',
        description: 'Supplement with Vitamin D3 (1000-4000 IU/day depending on deficiency severity), increase sun exposure (15-20 min/day), and include vitamin D-rich foods.',
        advantages: ['Improves bone health', 'Supports immune function', 'May improve mood and energy', 'Cost-effective supplementation'],
        disadvantages: ['Over-supplementation can cause toxicity', 'Sun exposure carries skin cancer risk', 'Takes 2-3 months to normalize levels'],
        alternatives: ['Vitamin D-fortified foods', 'Cod liver oil', 'UV light therapy (medical grade)'],
        urgency: 'moderate',
        requiresDoctor: false,
        doctorNote: 'If levels are severely low (<10 ng/mL), high-dose prescription vitamin D may be needed.'
      });
    } else if (vitD < 30) {
      riskFactors.push({ name: 'Vitamin D Insufficiency', description: 'Vitamin D is below optimal levels. Mild supplementation recommended.', severity: 'low', relatedValues: `Vitamin D: ${vitD} ng/mL` });
    } else {
      positiveFindings.push(`Vitamin D level of ${vitD} ng/mL is sufficient.`);
    }
  }

  // Vitamin B12
  const b12 = parseNum(data.vitaminB12);
  if (b12 !== null) {
    if (b12 < 200) {
      riskFactors.push({ name: 'Low Vitamin B12', description: 'Low B12 can cause anemia, neurological issues, fatigue, and cognitive problems.', severity: 'moderate', relatedValues: `Vitamin B12: ${b12} pg/mL` });
      recommendations.push({
        title: 'Vitamin B12 Supplementation',
        category: 'supplement',
        description: 'Supplement with B12 (methylcobalamin form, 1000-2000 mcg/day) or include B12-rich foods (meat, fish, dairy, fortified foods).',
        advantages: ['Improves energy and cognition', 'Prevents neurological damage', 'Supports red blood cell production'],
        disadvantages: ['Oral absorption can be poor in some individuals', 'May need injections if absorption is impaired'],
        alternatives: ['B12 injections', 'Sublingual B12', 'Fortified nutritional yeast'],
        urgency: 'moderate',
        requiresDoctor: true,
        doctorNote: 'Low B12 requires investigation for cause (diet, malabsorption, pernicious anemia).'
      });
    } else {
      positiveFindings.push(`Vitamin B12 level of ${b12} pg/mL is adequate.`);
    }
  }

  // Hemoglobin
  const hb = parseNum(data.hemoglobin);
  if (hb !== null) {
    const lowHb = data.gender === 'female' ? 12 : 13;
    if (hb < lowHb) {
      riskFactors.push({ name: 'Low Hemoglobin (Possible Anemia)', description: 'Low hemoglobin may indicate anemia, causing fatigue, weakness, and reduced exercise capacity.', severity: 'moderate', relatedValues: `Hemoglobin: ${hb} g/dL` });
      doctorAdvisory.push('Low hemoglobin requires medical workup to determine cause (iron deficiency, B12, chronic disease, etc.).');
    } else {
      positiveFindings.push(`Hemoglobin of ${hb} g/dL is in the normal range.`);
    }
  }

  // Kidney (Creatinine)
  const creat = parseNum(data.creatinine);
  if (creat !== null) {
    const highCreat = data.gender === 'female' ? 1.1 : 1.3;
    if (creat > highCreat) {
      riskFactors.push({ name: 'Elevated Creatinine', description: 'Elevated creatinine may indicate reduced kidney function. Further evaluation needed.', severity: 'high', relatedValues: `Creatinine: ${creat} mg/dL` });
      setUrgency('high');
      doctorAdvisory.push('Elevated creatinine requires immediate medical evaluation for kidney function (eGFR, urine tests).');
    } else {
      positiveFindings.push(`Creatinine of ${creat} mg/dL is within normal limits — kidney function appears normal.`);
    }
  }

  // Liver (ALT/AST)
  const alt = parseNum(data.alt);
  const ast = parseNum(data.ast);
  if (alt !== null && alt > 56) {
    riskFactors.push({ name: 'Elevated ALT', description: 'High ALT may indicate liver inflammation or damage.', severity: 'moderate', relatedValues: `ALT: ${alt} U/L` });
    doctorAdvisory.push('Elevated liver enzymes should be evaluated by a healthcare professional to rule out liver disease.');
  }
  if (ast !== null && ast > 40) {
    riskFactors.push({ name: 'Elevated AST', description: 'High AST may indicate liver or muscle damage.', severity: 'moderate', relatedValues: `AST: ${ast} U/L` });
  }
  if (alt !== null && alt <= 56 && ast !== null && ast <= 40) {
    positiveFindings.push('Liver enzymes (ALT/AST) are within normal range.');
  }

  // Sleep Analysis
  const sleepHours = parseNum(data.sleepDuration);
  if (sleepHours !== null) {
    if (sleepHours < 6) {
      riskFactors.push({ name: 'Insufficient Sleep', description: 'Sleeping less than 6 hours increases risk for obesity, diabetes, cardiovascular disease, and cognitive decline.', severity: 'moderate' });
      recommendations.push({
        title: 'Sleep Optimization Protocol',
        category: 'lifestyle',
        description: 'Target 7-9 hours of sleep. Establish a consistent sleep schedule, create a dark/cool sleep environment, avoid screens 1 hour before bed, and limit caffeine after 2 PM.',
        advantages: ['Improves recovery and immune function', 'Enhances cognitive performance', 'Supports weight management', 'Reduces inflammation'],
        disadvantages: ['May require significant schedule restructuring', 'Results take 2-4 weeks to become noticeable'],
        alternatives: ['Cognitive behavioral therapy for insomnia (CBT-I)', 'Sleep tracking devices for monitoring', 'Magnesium glycinate supplementation (200-400mg before bed)'],
        urgency: 'moderate',
        requiresDoctor: data.sleepQuality === 'poor',
        doctorNote: data.sleepQuality === 'poor' ? 'Persistent poor sleep quality may indicate a sleep disorder requiring professional evaluation.' : undefined
      });
    } else if (sleepHours >= 7 && sleepHours <= 9 && data.sleepQuality !== 'poor') {
      positiveFindings.push(`Sleep duration of ${sleepHours} hours is in the optimal range.`);
    }
  }
  if (data.sleepQuality === 'poor') {
    riskFactors.push({ name: 'Poor Sleep Quality', description: 'Poor sleep quality impairs recovery, immune function, and increases disease risk regardless of duration.', severity: 'moderate' });
    if (sleepHours === null || sleepHours >= 6) {
      recommendations.push({
        title: 'Sleep Quality Improvement',
        category: 'lifestyle',
        description: 'Address sleep hygiene: consistent bedtime routine, cool dark room (65-68°F), limit blue light exposure, avoid heavy meals before bed.',
        advantages: ['Improves daytime energy and focus', 'Enhances hormonal balance', 'Supports muscle recovery'],
        disadvantages: ['May take weeks to see improvement', 'May need to address underlying causes'],
        alternatives: ['Sleep study to rule out sleep apnea', 'Relaxation techniques (yoga nidra, progressive muscle relaxation)', 'Consider melatonin (0.5-3mg) short-term'],
        urgency: 'moderate',
        requiresDoctor: true,
        doctorNote: 'Persistent poor sleep quality should be evaluated for sleep disorders such as sleep apnea.'
      });
    }
  }

  // Stress
  if (data.stressLevel === 'high' || data.stressLevel === 'very_high') {
    riskFactors.push({ name: 'High Stress Levels', description: 'Chronic high stress increases cortisol, contributing to weight gain, immune suppression, cardiovascular risk, and mental health issues.', severity: 'moderate' });
    recommendations.push({
      title: 'Stress Management Strategy',
      category: 'lifestyle',
      description: 'Implement daily stress reduction: 10-20 min meditation/mindfulness, regular exercise, social connections, time in nature, and boundary-setting.',
      advantages: ['Reduces cortisol and inflammation', 'Improves sleep quality', 'Enhances decision-making and focus', 'Supports immune function'],
      disadvantages: ['Requires consistent daily practice', 'May not address root causes', 'Some stressors may be unavoidable'],
      alternatives: ['Professional counseling or therapy', 'Adaptogenic herbs (ashwagandha — consult doctor)', 'Structured breathing exercises (box breathing, 4-7-8 technique)', 'Journaling and gratitude practices'],
      urgency: 'moderate',
      requiresDoctor: data.stressLevel === 'very_high',
      doctorNote: data.stressLevel === 'very_high' ? 'Very high stress levels may benefit from professional mental health support.' : undefined
    });
  } else if (data.stressLevel === 'low') {
    positiveFindings.push('Low stress levels — great for overall health and longevity.');
  }

  // Smoking
  if (data.smokingStatus === 'current') {
    riskFactors.push({ name: 'Active Smoking', description: 'Smoking is the single largest modifiable risk factor for cancer, cardiovascular disease, and respiratory disease. It accelerates aging significantly.', severity: 'high' });
    setUrgency('high');
    recommendations.push({
      title: 'Smoking Cessation',
      category: 'lifestyle',
      description: 'Quit smoking using a structured approach: nicotine replacement therapy, behavioral support, and avoid triggers. Even reducing frequency provides health benefits.',
      advantages: ['Reduces cancer risk by 50% within 10 years', 'Cardiovascular risk drops significantly within 1 year', 'Improves lung function within months', 'Saves money'],
      disadvantages: ['Withdrawal symptoms (2-4 weeks)', 'Weight gain possible (manageable with exercise)', 'High relapse rate without support'],
      alternatives: ['Nicotine patches/gum/lozenges', 'Prescription medications (varenicline, bupropion — consult doctor)', 'Behavioral counseling programs', 'Quitline support services'],
      urgency: 'high',
      requiresDoctor: true,
      doctorNote: 'Discuss smoking cessation aids with your doctor for the most effective quit strategy.'
    });
    doctorAdvisory.push('Active smoking significantly increases all-cause mortality — smoking cessation support is strongly recommended.');
  } else if (data.smokingStatus === 'former') {
    positiveFindings.push('Former smoker — quitting was one of the best health decisions. Risk continues to decline over time.');
  } else if (data.smokingStatus === 'never') {
    positiveFindings.push('Non-smoker — excellent for long-term health and longevity.');
  }

  // Alcohol
  if (data.alcoholUse === 'heavy') {
    riskFactors.push({ name: 'Heavy Alcohol Use', description: 'Heavy drinking increases risk of liver disease, cancer, cardiovascular problems, and mental health disorders.', severity: 'high' });
    setUrgency('high');
    recommendations.push({
      title: 'Alcohol Reduction',
      category: 'lifestyle',
      description: 'Gradually reduce to moderate levels (≤1 drink/day women, ≤2 drinks/day men) or consider abstinence. Seek support if needed.',
      advantages: ['Reduces liver disease risk', 'Improves sleep quality', 'Reduces cancer risk', 'Improves mental clarity'],
      disadvantages: ['Withdrawal can be dangerous — seek medical supervision', 'Social pressure can make reduction difficult'],
      alternatives: ['Alcohol-free social activities', 'Non-alcoholic beverages', 'Support groups (AA, SMART Recovery)', 'Professional counseling'],
      urgency: 'high',
      requiresDoctor: true,
      doctorNote: 'Heavy alcohol use reduction should be medically supervised, as withdrawal can be dangerous.'
    });
    doctorAdvisory.push('Heavy alcohol use requires medical evaluation for liver function and potential supervised reduction.');
  } else if (data.alcoholUse === 'moderate') {
    riskFactors.push({ name: 'Moderate Alcohol Use', description: 'Even moderate alcohol has been linked to increased cancer risk. Consider reducing intake.', severity: 'low' });
  } else if (data.alcoholUse === 'none') {
    positiveFindings.push('No alcohol use — beneficial for liver health and cancer prevention.');
  }

  // Exercise
  if (data.exerciseFrequency === 'none' || data.exerciseFrequency === 'minimal') {
    riskFactors.push({ name: 'Sedentary Lifestyle', description: 'Physical inactivity is a major risk factor for cardiovascular disease, diabetes, obesity, and premature mortality.', severity: 'moderate' });
    recommendations.push({
      title: 'Exercise Program Initiation',
      category: 'exercise',
      description: 'Start with 150 min/week of moderate aerobic activity (brisk walking, cycling) plus 2 days of strength training. Begin gradually and increase over 4-6 weeks.',
      advantages: ['Reduces all-cause mortality by 30-50%', 'Improves cardiovascular fitness', 'Enhances mood and cognitive function', 'Supports weight management'],
      disadvantages: ['Risk of injury if progressed too quickly', 'Time commitment required', 'May need initial guidance from a trainer'],
      alternatives: ['Walking 10,000 steps/day', 'Swimming or water aerobics (joint-friendly)', 'Yoga for flexibility and stress reduction', 'Active commuting (cycling, walking)'],
      urgency: 'moderate',
      requiresDoctor: data.age > 50 || bmi >= 30,
      doctorNote: data.age > 50 || bmi >= 30 ? 'Get medical clearance before starting an exercise program, especially with existing health conditions.' : undefined
    });
  } else if (data.exerciseFrequency === 'regular' || data.exerciseFrequency === 'active') {
    positiveFindings.push('Regular exercise habit — one of the strongest predictors of longevity and healthspan.');
  }

  // Diet Pattern
  if (data.dietPattern === 'processed' || data.dietPattern === 'fast_food') {
    riskFactors.push({ name: 'Poor Diet Quality', description: 'High intake of processed/fast food is linked to obesity, cardiovascular disease, cancer, and reduced lifespan.', severity: 'moderate' });
    recommendations.push({
      title: 'Dietary Quality Improvement',
      category: 'diet',
      description: 'Transition to a whole-foods based diet: emphasize vegetables, fruits, whole grains, lean proteins, nuts, and healthy fats. Reduce processed foods, added sugars, and refined grains.',
      advantages: ['Reduces chronic disease risk', 'Improves energy and mental clarity', 'Supports gut microbiome health', 'Aids weight management naturally'],
      disadvantages: ['Requires meal planning and preparation time', 'May cost more initially', 'Taste preferences take time to adjust'],
      alternatives: ['Mediterranean diet (well-researched for longevity)', 'DASH diet (especially if BP is elevated)', 'Gradual substitution approach (replace one processed meal at a time)'],
      urgency: 'moderate',
      requiresDoctor: false
    });
  } else if (data.dietPattern === 'balanced' || data.dietPattern === 'mediterranean') {
    positiveFindings.push('Healthy diet pattern — a key foundation for longevity and disease prevention.');
  }

  // Goals-based recommendations
  if (data.primaryGoals.includes('longevity')) {
    recommendations.push({
      title: 'Longevity Optimization',
      category: 'preventive',
      description: 'Evidence-based longevity strategies: maintain healthy weight, regular exercise (both cardio + strength), quality sleep, strong social connections, stress management, and regular preventive screenings.',
      advantages: ['Addresses multiple aging pathways', 'Backed by Blue Zone research', 'Sustainable long-term approach', 'Improves both lifespan and healthspan'],
      disadvantages: ['Requires comprehensive lifestyle commitment', 'Some benefits are long-term and not immediately visible'],
      alternatives: ['Time-restricted eating (12-16 hour overnight fast)', 'Regular sauna use (cardiovascular benefits)', 'Cold exposure therapy', 'Ongoing education through longevity-focused resources'],
      urgency: 'low',
      requiresDoctor: false
    });
  }

  if (data.primaryGoals.includes('muscle_gain')) {
    recommendations.push({
      title: 'Muscle Building Program',
      category: 'exercise',
      description: 'Progressive resistance training 3-4x/week targeting all major muscle groups, adequate protein intake (1.6-2.2g/kg/day), caloric surplus of 200-300 kcal, and 7-9 hours of sleep for recovery.',
      advantages: ['Increases metabolic rate', 'Improves bone density', 'Enhances functional capacity', 'Supports healthy aging'],
      disadvantages: ['Requires consistent training schedule', 'Risk of injury without proper form', 'Slower progress with age'],
      alternatives: ['Bodyweight training', 'Resistance bands', 'Calisthenics programs', 'Working with a certified personal trainer'],
      urgency: 'low',
      requiresDoctor: false
    });
  }

  if (data.primaryGoals.includes('fat_loss')) {
    recommendations.push({
      title: 'Fat Loss Strategy',
      category: 'diet',
      description: 'Create a moderate caloric deficit (300-500 kcal/day), prioritize protein (1.6-2.2g/kg/day), combine resistance training with cardio, and track progress weekly.',
      advantages: ['Sustainable rate of fat loss', 'Preserves muscle mass', 'Improves metabolic markers', 'Long-term habit formation'],
      disadvantages: ['Slower than crash diets but much more sustainable', 'Requires calorie awareness', 'Plateaus are common and normal'],
      alternatives: ['Intermittent fasting (16:8)', 'Low-carbohydrate approach', 'High-protein diet with ad libitum eating', 'Working with a registered dietitian'],
      urgency: 'low',
      requiresDoctor: bmi >= 35,
      doctorNote: bmi >= 35 ? 'With significant obesity, medical supervision for weight loss is recommended.' : undefined
    });
  }

  if (data.primaryGoals.includes('disease_prevention')) {
    recommendations.push({
      title: 'Preventive Health Screening Schedule',
      category: 'preventive',
      description: 'Stay current with age-appropriate screenings: annual blood work, blood pressure checks, cancer screenings (colonoscopy, mammogram, skin checks), eye exams, and dental checkups.',
      advantages: ['Early detection dramatically improves outcomes', 'Provides peace of mind', 'Establishes health baselines for comparison'],
      disadvantages: ['Some screenings have false positive rates', 'Can cause anxiety', 'Time and cost involved'],
      alternatives: ['Discuss personalized screening schedule with your doctor based on family history', 'Genetic testing for hereditary disease risk', 'Regular self-monitoring of key health metrics'],
      urgency: 'low',
      requiresDoctor: true,
      doctorNote: 'Work with your healthcare provider to establish a personalized preventive screening schedule.'
    });
  }

  // Family history considerations
  const fhLower = data.familyMedicalHistory.toLowerCase();
  if (fhLower.includes('diabetes') || fhLower.includes('heart') || fhLower.includes('cancer') || fhLower.includes('stroke')) {
    const conditions: string[] = [];
    if (fhLower.includes('diabetes')) conditions.push('diabetes');
    if (fhLower.includes('heart')) conditions.push('heart disease');
    if (fhLower.includes('cancer')) conditions.push('cancer');
    if (fhLower.includes('stroke')) conditions.push('stroke');
    riskFactors.push({
      name: 'Family History Risk',
      description: `Family history of ${conditions.join(', ')} increases your personal risk. Enhanced screening and proactive prevention strategies are recommended.`,
      severity: 'moderate'
    });
    doctorAdvisory.push(`Family history of ${conditions.join(', ')} — discuss enhanced screening protocols with your healthcare provider.`);
  }

  // Symptoms check
  if (data.symptoms.trim().length > 0) {
    const sympLower = data.symptoms.toLowerCase();
    const urgentSymptoms = ['chest pain', 'shortness of breath', 'numbness', 'sudden', 'severe headache', 'blood in', 'fainting', 'unexplained weight loss', 'lump'];
    const hasUrgent = urgentSymptoms.some(s => sympLower.includes(s));
    if (hasUrgent) {
      riskFactors.push({ name: 'Concerning Symptoms Reported', description: 'The symptoms you described may indicate a condition requiring prompt medical evaluation.', severity: 'high' });
      setUrgency('high');
      doctorAdvisory.push('Your reported symptoms require immediate evaluation by a qualified healthcare professional. Do not delay seeking medical attention.');
    } else {
      doctorAdvisory.push('Your reported symptoms should be discussed with your healthcare provider at your next visit for proper evaluation.');
    }
  }

  // Build summary
  const summaryParts: string[] = [];
  summaryParts.push(`Based on your health profile (${data.age}-year-old ${data.gender}, BMI ${bmi.toFixed(1)} — ${bmiCat}), here is your comprehensive health analysis.`);
  if (riskFactors.length === 0) {
    summaryParts.push('No significant risk factors were identified from the data provided. Your health markers appear generally favorable.');
  } else {
    const highRisks = riskFactors.filter(r => r.severity === 'high').length;
    const modRisks = riskFactors.filter(r => r.severity === 'moderate').length;
    summaryParts.push(`We identified ${riskFactors.length} risk factor(s): ${highRisks} high-priority, ${modRisks} moderate, and ${riskFactors.length - highRisks - modRisks} low-priority.`);
  }
  if (positiveFindings.length > 0) {
    summaryParts.push(`There are also ${positiveFindings.length} positive finding(s) in your health profile.`);
  }

  return {
    summary: summaryParts.join(' '),
    bmi: parseFloat(bmi.toFixed(1)),
    bmiCategory: bmiCat,
    riskFactors,
    recommendations,
    overallUrgency: highestUrgency,
    doctorAdvisory,
    positiveFindings
  };
}
