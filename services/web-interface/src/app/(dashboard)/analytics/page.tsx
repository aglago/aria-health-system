'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Activity, 
  Calendar,
  Heart,
  Brain,
  Shield
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface HealthMetric {
  date: string;
  consultations: number;
  emergencies: number;
  followUps: number;
  satisfaction: number;
}

interface SymptomData {
  symptom: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

interface TrendData {
  month: string;
  cases: number;
  resolved: number;
}

export default function Analytics() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if not authenticated
  if (!user) {
    router.push('/role-selection');
    return null;
  }

  // Mock health metrics data
  const healthMetrics: HealthMetric[] = [
    { date: '2024-01-01', consultations: 15, emergencies: 2, followUps: 8, satisfaction: 4.2 },
    { date: '2024-01-02', consultations: 18, emergencies: 1, followUps: 12, satisfaction: 4.5 },
    { date: '2024-01-03', consultations: 12, emergencies: 3, followUps: 6, satisfaction: 4.1 },
    { date: '2024-01-04', consultations: 22, emergencies: 1, followUps: 15, satisfaction: 4.7 },
    { date: '2024-01-05', consultations: 19, emergencies: 2, followUps: 10, satisfaction: 4.3 },
    { date: '2024-01-06', consultations: 25, emergencies: 0, followUps: 18, satisfaction: 4.8 },
    { date: '2024-01-07', consultations: 16, emergencies: 1, followUps: 9, satisfaction: 4.4 }
  ];

  // Mock symptom distribution data
  const symptomData: SymptomData[] = [
    { symptom: 'Headaches', count: 45, severity: 'medium' },
    { symptom: 'Fatigue', count: 38, severity: 'low' },
    { symptom: 'Anxiety', count: 32, severity: 'medium' },
    { symptom: 'Allergies', count: 28, severity: 'high' },
    { symptom: 'Digestive Issues', count: 22, severity: 'low' },
    { symptom: 'Respiratory', count: 18, severity: 'high' },
    { symptom: 'Skin Conditions', count: 15, severity: 'low' },
    { symptom: 'Injury', count: 12, severity: 'medium' }
  ];

  // Mock trend data
  const trendData: TrendData[] = [
    { month: 'Jul', cases: 120, resolved: 115 },
    { month: 'Aug', cases: 135, resolved: 130 },
    { month: 'Sep', cases: 150, resolved: 142 },
    { month: 'Oct', cases: 165, resolved: 158 },
    { month: 'Nov', cases: 145, resolved: 140 },
    { month: 'Dec', cases: 180, resolved: 172 },
    { month: 'Jan', cases: 195, resolved: 185 }
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const totalConsultations = healthMetrics.reduce((sum, metric) => sum + metric.consultations, 0);
  const totalEmergencies = healthMetrics.reduce((sum, metric) => sum + metric.emergencies, 0);
  const avgSatisfaction = healthMetrics.reduce((sum, metric) => sum + metric.satisfaction, 0) / healthMetrics.length;
  const totalSymptoms = symptomData.reduce((sum, symptom) => sum + symptom.count, 0);

  // Role-based metrics rendering
  const renderStudentMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Your Consultations</p>
              <p className="text-3xl font-bold text-foreground">7</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+2 this month</span>
              </div>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Health Score</p>
              <p className="text-3xl font-bold text-foreground">92%</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+5% this month</span>
              </div>
            </div>
            <Heart className="h-8 w-8 text-pink-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Appointments</p>
              <p className="text-3xl font-bold text-foreground">3</p>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600">1 upcoming</span>
              </div>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Wellness Streak</p>
              <p className="text-3xl font-bold text-foreground">14</p>
              <div className="flex items-center mt-1">
                <Shield className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">days healthy</span>
              </div>
            </div>
            <Shield className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDoctorMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Consultations</p>
              <p className="text-3xl font-bold text-foreground">{totalConsultations}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+12% from last week</span>
              </div>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Emergency Cases</p>
              <p className="text-3xl font-bold text-foreground">{totalEmergencies}</p>
              <div className="flex items-center mt-1">
                <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">-5% from last week</span>
              </div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient Satisfaction</p>
              <p className="text-3xl font-bold text-foreground">{avgSatisfaction.toFixed(1)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+0.3 from last week</span>
              </div>
            </div>
            <Heart className="h-8 w-8 text-pink-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
              <p className="text-3xl font-bold text-foreground">23</p>
              <div className="flex items-center mt-1">
                <Users className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600">5 high priority</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {user.role === 'student' ? 'My Health Analytics' : 'Campus Health Analytics'}
            </h1>
            <p className="text-muted-foreground">
              {user.role === 'student' 
                ? 'Track your personal health trends and wellness metrics'
                : 'Overview of campus health trends and patient statistics'
              }
            </p>
          </div>

          {/* Role-based Key Metrics */}
          {user.role === 'student' ? renderStudentMetrics() : renderDoctorMetrics()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Health Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {user.role === 'student' ? 'Your Health Activity' : 'Campus Health Activity'}
                </CardTitle>
                <CardDescription>
                  {user.role === 'student' 
                    ? 'Your personal health consultations and activities'
                    : 'Daily consultations, emergencies, and follow-ups'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {user.role === 'student' ? (
                    <AreaChart data={[
                      { month: 'Jul', consultations: 2, wellness: 85 },
                      { month: 'Aug', consultations: 1, wellness: 88 },
                      { month: 'Sep', consultations: 3, wellness: 82 },
                      { month: 'Oct', consultations: 2, wellness: 90 },
                      { month: 'Nov', consultations: 1, wellness: 92 },
                      { month: 'Dec', consultations: 0, wellness: 95 },
                      { month: 'Jan', consultations: 2, wellness: 92 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="wellness" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Wellness Score" />
                      <Area type="monotone" dataKey="consultations" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Consultations" />
                    </AreaChart>
                  ) : (
                    <LineChart data={healthMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="consultations" stroke="#3b82f6" strokeWidth={2} name="Consultations" />
                      <Line type="monotone" dataKey="emergencies" stroke="#ef4444" strokeWidth={2} name="Emergencies" />
                      <Line type="monotone" dataKey="followUps" stroke="#10b981" strokeWidth={2} name="Follow-ups" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {user.role === 'student' ? 'Health Trends' : 'Monthly Case Resolution'}
                </CardTitle>
                <CardDescription>
                  {user.role === 'student' 
                    ? 'Your health improvements over time'
                    : 'Cases received vs cases resolved over time'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {user.role === 'student' ? (
                    <LineChart data={[
                      { month: 'Jul', healthScore: 85, symptoms: 3 },
                      { month: 'Aug', healthScore: 88, symptoms: 2 },
                      { month: 'Sep', healthScore: 82, symptoms: 4 },
                      { month: 'Oct', healthScore: 90, symptoms: 1 },
                      { month: 'Nov', healthScore: 92, symptoms: 1 },
                      { month: 'Dec', healthScore: 95, symptoms: 0 },
                      { month: 'Jan', healthScore: 92, symptoms: 2 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="healthScore" stroke="#10b981" strokeWidth={2} name="Health Score" />
                      <Line type="monotone" dataKey="symptoms" stroke="#f59e0b" strokeWidth={2} name="Symptoms Reported" />
                    </LineChart>
                  ) : (
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="cases" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Total Cases" />
                      <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Resolved Cases" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {user.role === 'doctor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Most Common Symptoms - Doctor Only */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Most Common Symptoms
                  </CardTitle>
                  <CardDescription>
                    Top reported symptoms across all patients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={symptomData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="symptom" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Severity Distribution - Doctor Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Case Severity Distribution
                  </CardTitle>
                  <CardDescription>
                    Patient cases by severity level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    {['high', 'medium', 'low'].map((severity) => {
                      const count = symptomData.filter(s => s.severity === severity).reduce((sum, s) => sum + s.count, 0);
                      const percentage = ((count / totalSymptoms) * 100).toFixed(1);
                      return (
                        <div key={severity} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(severity)}>
                              {severity}
                            </Badge>
                            <span className="text-sm">{count} cases</span>
                          </div>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'High', value: symptomData.filter(s => s.severity === 'high').reduce((sum, s) => sum + s.count, 0) },
                          { name: 'Medium', value: symptomData.filter(s => s.severity === 'medium').reduce((sum, s) => sum + s.count, 0) },
                          { name: 'Low', value: symptomData.filter(s => s.severity === 'low').reduce((sum, s) => sum + s.count, 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {['#ef4444', '#f59e0b', '#10b981'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {user.role === 'student' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Health Summary - Student Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Your Health Summary
                  </CardTitle>
                  <CardDescription>
                    Your recent health consultations and improvements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Overall Health Score</span>
                      <span className="text-lg font-bold text-green-600">92%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Consultations This Month</span>
                      <span className="text-lg font-bold text-blue-600">2</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Last Consultation</span>
                      <span className="text-sm text-purple-600">3 days ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Health Trend</span>
                      <span className="text-sm text-orange-600 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Improving
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wellness Goals - Student Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Wellness Goals
                  </CardTitle>
                  <CardDescription>
                    Track your health and wellness objectives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Stay Hydrated</span>
                        <span>80%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full w-4/5"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Regular Exercise</span>
                        <span>65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full w-2/3"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Healthy Sleep</span>
                        <span>90%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full w-11/12"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Stress Management</span>
                        <span>75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}