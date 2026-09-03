import { supabase } from '../lib/supabaseClient';
import type { 
  Appointment, Medication, HealthReport, TimelineEvent 
} from '../types/careos';

export const patientService = {
  // -- Appointments --
  async getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });
      
    if (error) throw new Error(error.message);
    
    return (data || []).map(row => ({
      id: row.id,
      patientId: row.patient_id,
      providerId: 'unknown', // not tracking provider_id yet
      providerName: row.provider_name,
      specialty: row.specialty || '',
      hospital: row.hospital || '',
      date: row.date,
      time: row.time,
      status: row.status as any,
      type: row.type as any,
      chiefComplaint: row.chief_complaint,
      createdAt: row.created_at,
    }));
  },

  // -- Medications --
  async getMedications(): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('start_date', { ascending: false });
      
    if (error) throw new Error(error.message);
    
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency as any,
      route: row.route || '',
      startDate: row.start_date,
      endDate: row.end_date,
      prescribedBy: row.prescribed_by || '',
      prescriberId: 'unknown',
      isActive: row.is_active,
      instructions: row.instructions,
      reminderEnabled: false,
    }));
  },

  // -- Health Reports --
  async getReports(): Promise<HealthReport[]> {
    const { data, error } = await supabase
      .from('health_reports')
      .select('*')
      .order('report_date', { ascending: false });
      
    if (error) throw new Error(error.message);
    
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      category: row.category as any,
      reportDate: row.report_date,
      fileType: row.file_type as any,
      fileSize: row.file_size || 0,
      fileUrl: row.file_url,
      summary: row.summary,
      isAIExplained: row.is_a_i_explained || false,
      uploadedAt: row.uploaded_at,
    }));
  },

  // -- Timeline Events --
  async getTimelineEvents(): Promise<TimelineEvent[]> {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw new Error(error.message);
    
    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      type: row.type as any,
      title: row.title,
      description: row.description,
      provider: row.provider,
      hospital: row.hospital,
      isImportant: row.is_important || false,
    }));
  },

  // === MUTATIONS ===

  async createAppointment(appt: any): Promise<void> {
    const { error } = await supabase.from('appointments').insert([{
      provider_name: appt.providerName,
      specialty: appt.specialty,
      hospital: appt.hospital,
      date: appt.date,
      time: appt.time,
      status: appt.status || 'upcoming',
      type: appt.type || 'in_person',
      chief_complaint: appt.chiefComplaint
    }]);
    if (error) throw new Error(error.message);
  },

  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createMedication(med: any): Promise<void> {
    const { error } = await supabase.from('medications').insert([{
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
      start_date: med.startDate,
      end_date: med.endDate,
      prescribed_by: med.prescribedBy,
      is_active: med.isActive !== undefined ? med.isActive : true,
      instructions: med.instructions
    }]);
    if (error) throw new Error(error.message);
  },

  async updateMedicationStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('medications').update({ is_active: isActive }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createTimelineEvent(event: any): Promise<void> {
    const { error } = await supabase.from('timeline_events').insert([{
      date: event.date,
      type: event.type,
      title: event.title,
      description: event.description,
      provider: event.provider,
      hospital: event.hospital,
      is_important: event.isImportant
    }]);
    if (error) throw new Error(error.message);
  },

  async uploadReport(file: File, metadata: any): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userData.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('medical_reports')
      .upload(filePath, file);

    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from('medical_reports')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('health_reports').insert([{
      name: metadata.name,
      category: metadata.category,
      report_date: metadata.reportDate,
      lab_name: metadata.labName,
      file_type: file.type.includes('pdf') ? 'pdf' : 'image',
      file_size: file.size,
      file_url: publicUrlData.publicUrl,
      summary: "AI summary pending...",
      is_a_i_explained: false
    }]);

    if (dbError) throw new Error(dbError.message);
  },

  async getCareTeam(): Promise<any[]> {
    const { data, error } = await supabase.from('care_team').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getFamilyMembers(): Promise<any[]> {
    const { data, error } = await supabase.from('family_members').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getConsents(): Promise<any[]> {
    const { data, error } = await supabase.from('consents').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async createCareTeamMember(member: any): Promise<void> {
    const { error } = await supabase.from('care_team').insert([member]);
    if (error) throw new Error(error.message);
  },

  async deleteCareTeamMember(id: string): Promise<void> {
    const { error } = await supabase.from('care_team').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createFamilyMember(member: any): Promise<void> {
    const { error } = await supabase.from('family_members').insert([member]);
    if (error) throw new Error(error.message);
  },

  async deleteFamilyMember(id: string): Promise<void> {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createConsent(consent: any): Promise<void> {
    const { error } = await supabase.from('consents').insert([{
      ...consent,
      status: consent.status || 'active',
      data_types: consent.data_types || []
    }]);
    if (error) throw new Error(error.message);
  },

  async revokeConsent(id: string): Promise<void> {
    const { error } = await supabase.from('consents').update({ status: 'revoked' }).eq('id', id);
    if (error) throw new Error(error.message);
  }
};
