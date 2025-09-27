'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Stethoscope, 
  FileText, 
  Heart, 
  Pill, 
  Calendar, 
  AlertTriangle,
  Save,
  CheckCircle,
  X,
  Plus,
  Minus
} from 'lucide-react';

interface MedicalRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientInfo?: {
    name: string;
    student_id: string;
    visit_date: string;
  };
  consultationData?: {
    symptoms: string[];
    primary_concern: string;
    diagnosis_summary: string;
  };
  onSubmit: (recordData: any) => Promise<void>;
}

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity_prescribed?: number;
}

interface TestOrder {
  test_name: string;
  test_type: 'lab' | 'imaging' | 'specialist_referral' | 'other';
  urgency: 'routine' | 'urgent' | 'stat';
  instructions?: string;
}

export default function MedicalRecordForm({
  isOpen,
  onClose,
  appointmentId,
  patientInfo,
  consultationData,
  onSubmit
}: MedicalRecordFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    // Record Information
    record_type: 'consultation',
    chief_complaint: '',
    history_of_present_illness: '',
    
    // Clinical Assessment
    final_diagnosis: '',
    differential_diagnosis: [] as string[],
    assessment_notes: '',
    
    // Physical Examination
    vital_signs: {
      blood_pressure: '',
      heart_rate: '',
      respiratory_rate: '',
      temperature: '',
      weight: '',
      height: '',
      oxygen_saturation: ''
    },
    physical_examination_findings: '',
    
    // Treatment Plan
    treatment_plan: '',
    procedures_performed: [] as string[],
    
    // Follow-up
    follow_up_instructions: '',
    follow_up_required: false,
    follow_up_date: '',
    follow_up_with: '',
    
    // Patient Education
    patient_education_provided: '',
    patient_understanding: 'good',
    
    // Risk Assessment
    risk_factors: [] as string[],
    warning_signs_discussed: [] as string[],
    
    // Medical History Context
    relevant_medical_history: [] as string[],
    current_medications_reviewed: [] as string[],
    allergies_confirmed: [] as string[],
    
    // Administrative
    severity_level: 'low',
    status: 'draft'
  });

  const [medications, setMedications] = useState<Medication[]>([]);
  const [testsOrdered, setTestsOrdered] = useState<TestOrder[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with consultation data
  useEffect(() => {
    if (consultationData) {
      setFormData(prev => ({
        ...prev,
        chief_complaint: consultationData.primary_concern || '',
        final_diagnosis: consultationData.diagnosis_summary || '',
        history_of_present_illness: `Patient reported: ${consultationData.symptoms?.join(', ') || 'No symptoms listed'}`
      }));
    }
  }, [consultationData]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayAdd = (field: string, value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), value.trim()]
    }));
  };

  const handleArrayRemove = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    setMedications(prev => [...prev, {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity_prescribed: undefined
    }]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    setMedications(prev => prev.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  const removeMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const addTestOrder = () => {
    setTestsOrdered(prev => [...prev, {
      test_name: '',
      test_type: 'lab',
      urgency: 'routine',
      instructions: ''
    }]);
  };

  const updateTestOrder = (index: number, field: keyof TestOrder, value: string) => {
    setTestsOrdered(prev => prev.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    ));
  };

  const removeTestOrder = (index: number) => {
    setTestsOrdered(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (status: 'draft' | 'completed') => {
    setIsSaving(true);
    try {
      const recordData = {
        ...formData,
        status,
        medications_prescribed: medications.filter(med => med.medication_name.trim()),
        tests_ordered: testsOrdered.filter(test => test.test_name.trim())
      };
      
      await onSubmit(recordData);
    } catch (error) {
      console.error('Error saving medical record:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const ArrayInputField = ({ 
    label, 
    field, 
    placeholder 
  }: { 
    label: string; 
    field: string; 
    placeholder: string; 
  }) => {
    const [inputValue, setInputValue] = useState('');
    const items = formData[field as keyof typeof formData] as string[];

    return (
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <div className="space-y-2 mt-1">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleArrayAdd(field, inputValue);
                  setInputValue('');
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                handleArrayAdd(field, inputValue);
                setInputValue('');
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {items.map((item, index) => (
              <Badge
                key={index}
                variant="outline"
                className="flex items-center gap-1"
              >
                {item}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleArrayRemove(field, index)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Medical Record
          </DialogTitle>
          <DialogDescription>
            Complete the medical record for {patientInfo?.name} ({patientInfo?.student_id}) - Visit: {patientInfo?.visit_date}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="assessment" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="examination">Examination</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="followup">Follow-up</TabsTrigger>
          </TabsList>

          {/* Assessment Tab */}
          <TabsContent value="assessment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Clinical Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="record_type">Record Type</Label>
                  <select
                    id="record_type"
                    value={formData.record_type}
                    onChange={(e) => handleInputChange('record_type', e.target.value)}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="surgery">Surgery</option>
                    <option value="lab_results">Lab Results</option>
                    <option value="imaging">Imaging</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="chief_complaint">Chief Complaint *</Label>
                  <textarea
                    id="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
                    placeholder="Primary reason for visit..."
                    rows={2}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="history_of_present_illness">History of Present Illness *</Label>
                  <textarea
                    id="history_of_present_illness"
                    value={formData.history_of_present_illness}
                    onChange={(e) => handleInputChange('history_of_present_illness', e.target.value)}
                    placeholder="Detailed description of current condition..."
                    rows={4}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="final_diagnosis">Final Diagnosis *</Label>
                  <Input
                    id="final_diagnosis"
                    value={formData.final_diagnosis}
                    onChange={(e) => handleInputChange('final_diagnosis', e.target.value)}
                    placeholder="Primary diagnosis..."
                    required
                  />
                </div>

                <ArrayInputField
                  label="Differential Diagnosis"
                  field="differential_diagnosis"
                  placeholder="Add alternative diagnosis..."
                />

                <div>
                  <Label htmlFor="assessment_notes">Assessment Notes *</Label>
                  <textarea
                    id="assessment_notes"
                    value={formData.assessment_notes}
                    onChange={(e) => handleInputChange('assessment_notes', e.target.value)}
                    placeholder="Clinical reasoning and assessment..."
                    rows={4}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="severity_level">Severity Level</Label>
                    <select
                      id="severity_level"
                      value={formData.severity_level}
                      onChange={(e) => handleInputChange('severity_level', e.target.value)}
                      className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="patient_understanding">Patient Understanding</Label>
                    <select
                      id="patient_understanding"
                      value={formData.patient_understanding}
                      onChange={(e) => handleInputChange('patient_understanding', e.target.value)}
                      className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    >
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="language_barrier">Language Barrier</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examination Tab */}
          <TabsContent value="examination" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Physical Examination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Vital Signs</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="blood_pressure">Blood Pressure</Label>
                      <Input
                        id="blood_pressure"
                        value={formData.vital_signs.blood_pressure}
                        onChange={(e) => handleInputChange('vital_signs.blood_pressure', e.target.value)}
                        placeholder="120/80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                      <Input
                        id="heart_rate"
                        type="number"
                        value={formData.vital_signs.heart_rate}
                        onChange={(e) => handleInputChange('vital_signs.heart_rate', e.target.value)}
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <Label htmlFor="respiratory_rate">Respiratory Rate</Label>
                      <Input
                        id="respiratory_rate"
                        type="number"
                        value={formData.vital_signs.respiratory_rate}
                        onChange={(e) => handleInputChange('vital_signs.respiratory_rate', e.target.value)}
                        placeholder="16"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={formData.vital_signs.temperature}
                        onChange={(e) => handleInputChange('vital_signs.temperature', e.target.value)}
                        placeholder="36.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.vital_signs.weight}
                        onChange={(e) => handleInputChange('vital_signs.weight', e.target.value)}
                        placeholder="70"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.vital_signs.height}
                        onChange={(e) => handleInputChange('vital_signs.height', e.target.value)}
                        placeholder="175"
                      />
                    </div>
                    <div>
                      <Label htmlFor="oxygen_saturation">O2 Saturation (%)</Label>
                      <Input
                        id="oxygen_saturation"
                        type="number"
                        value={formData.vital_signs.oxygen_saturation}
                        onChange={(e) => handleInputChange('vital_signs.oxygen_saturation', e.target.value)}
                        placeholder="98"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="physical_examination_findings">Physical Examination Findings *</Label>
                  <textarea
                    id="physical_examination_findings"
                    value={formData.physical_examination_findings}
                    onChange={(e) => handleInputChange('physical_examination_findings', e.target.value)}
                    placeholder="General physical examination findings..."
                    rows={6}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <ArrayInputField
                  label="Procedures Performed"
                  field="procedures_performed"
                  placeholder="Add procedure..."
                />

                <ArrayInputField
                  label="Risk Factors"
                  field="risk_factors"
                  placeholder="Add risk factor..."
                />

                <ArrayInputField
                  label="Warning Signs Discussed"
                  field="warning_signs_discussed"
                  placeholder="Add warning sign..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatment Tab */}
          <TabsContent value="treatment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="treatment_plan">Treatment Plan *</Label>
                  <textarea
                    id="treatment_plan"
                    value={formData.treatment_plan}
                    onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
                    placeholder="Comprehensive treatment approach..."
                    rows={4}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="patient_education_provided">Patient Education Provided *</Label>
                  <textarea
                    id="patient_education_provided"
                    value={formData.patient_education_provided}
                    onChange={(e) => handleInputChange('patient_education_provided', e.target.value)}
                    placeholder="What was explained to the patient..."
                    rows={3}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <ArrayInputField
                  label="Relevant Medical History"
                  field="relevant_medical_history"
                  placeholder="Add medical history..."
                />

                <ArrayInputField
                  label="Current Medications Reviewed"
                  field="current_medications_reviewed"
                  placeholder="Add medication..."
                />

                <ArrayInputField
                  label="Allergies Confirmed"
                  field="allergies_confirmed"
                  placeholder="Add allergy..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Medications Prescribed
                </CardTitle>
                <CardDescription>
                  Add medications prescribed during this visit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {medications.map((medication, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Medication {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMedication(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Medication Name *</Label>
                        <Input
                          value={medication.medication_name}
                          onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                          placeholder="e.g., Ibuprofen"
                          required
                        />
                      </div>
                      <div>
                        <Label>Dosage *</Label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="e.g., 400mg"
                          required
                        />
                      </div>
                      <div>
                        <Label>Frequency *</Label>
                        <Input
                          value={medication.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="e.g., Twice daily"
                          required
                        />
                      </div>
                      <div>
                        <Label>Duration *</Label>
                        <Input
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                          required
                        />
                      </div>
                      <div>
                        <Label>Instructions *</Label>
                        <Input
                          value={medication.instructions}
                          onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                          placeholder="e.g., Take with food"
                          required
                        />
                      </div>
                      <div>
                        <Label>Quantity Prescribed</Label>
                        <Input
                          type="number"
                          value={medication.quantity_prescribed || ''}
                          onChange={(e) => updateMedication(index, 'quantity_prescribed', parseInt(e.target.value))}
                          placeholder="e.g., 14"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addMedication} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tests and Investigations</CardTitle>
                <CardDescription>
                  Order tests and investigations for the patient
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testsOrdered.map((test, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Test {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTestOrder(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Test Name *</Label>
                        <Input
                          value={test.test_name}
                          onChange={(e) => updateTestOrder(index, 'test_name', e.target.value)}
                          placeholder="e.g., Complete Blood Count"
                          required
                        />
                      </div>
                      <div>
                        <Label>Test Type *</Label>
                        <select
                          value={test.test_type}
                          onChange={(e) => updateTestOrder(index, 'test_type', e.target.value as any)}
                          className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                          required
                        >
                          <option value="lab">Laboratory</option>
                          <option value="imaging">Imaging</option>
                          <option value="specialist_referral">Specialist Referral</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label>Urgency *</Label>
                        <select
                          value={test.urgency}
                          onChange={(e) => updateTestOrder(index, 'urgency', e.target.value as any)}
                          className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                          required
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                          <option value="stat">STAT</option>
                        </select>
                      </div>
                      <div>
                        <Label>Instructions</Label>
                        <Input
                          value={test.instructions}
                          onChange={(e) => updateTestOrder(index, 'instructions', e.target.value)}
                          placeholder="Special instructions..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addTestOrder} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test Order
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Follow-up Tab */}
          <TabsContent value="followup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Follow-up Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="follow_up_instructions">Follow-up Instructions *</Label>
                  <textarea
                    id="follow_up_instructions"
                    value={formData.follow_up_instructions}
                    onChange={(e) => handleInputChange('follow_up_instructions', e.target.value)}
                    placeholder="Instructions for follow-up care..."
                    rows={4}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="follow_up_required"
                    checked={formData.follow_up_required}
                    onChange={(e) => handleInputChange('follow_up_required', e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="follow_up_required">Follow-up appointment required</Label>
                </div>

                {formData.follow_up_required && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="follow_up_date">Follow-up Date</Label>
                      <Input
                        type="date"
                        id="follow_up_date"
                        value={formData.follow_up_date}
                        onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="follow_up_with">Follow-up With</Label>
                      <Input
                        id="follow_up_with"
                        value={formData.follow_up_with}
                        onChange={(e) => handleInputChange('follow_up_with', e.target.value)}
                        placeholder="e.g., Same doctor, Specialist"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button 
            onClick={() => handleSubmit('completed')}
            disabled={isSaving}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Complete Record'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}