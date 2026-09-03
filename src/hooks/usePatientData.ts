import { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import { useAuth } from '../context/AuthContext';
import type { Appointment, Medication, HealthReport, TimelineEvent } from '../types/careos';

export function usePatientData() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [careTeam, setCareTeam] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) {
      setAppointments([]);
      setMedications([]);
      setReports([]);
      setTimelineEvents([]);
      setCareTeam([]);
      setFamilyMembers([]);
      setConsents([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const [apptsData, medsData, reportsData, timelineData, careTeamData, familyData, consentsData] = await Promise.all([
        patientService.getAppointments(),
        patientService.getMedications(),
        patientService.getReports(),
        patientService.getTimelineEvents(),
        patientService.getCareTeam(),
        patientService.getFamilyMembers(),
        patientService.getConsents()
      ]);
      
      setAppointments(apptsData);
      setMedications(medsData);
      setReports(reportsData);
      setTimelineEvents(timelineData);
      setCareTeam(careTeamData);
      setFamilyMembers(familyData);
      setConsents(consentsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const refresh = async () => {
    await fetchData();
  };

  return {
    appointments,
    medications,
    reports,
    timelineEvents,
    careTeam,
    familyMembers,
    consents,
    isLoading,
    error,
    refresh,
    
    // Derived helpers
    activeMedications: medications.filter(m => m.isActive),
    upcomingAppointments: appointments.filter(a => a.status === 'upcoming')
  };
}
