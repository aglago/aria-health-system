
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertTriangle, 
  Activity, 
  Calendar,
  Users,
  Shield,
  Zap,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { format } from 'date-fns';

interface DiseaseTrend {
  _id: string;
  count: number;
  recent_cases: Array<{
    date: string;
    patient_id: string;
    severity: string;
  }>;
}

interface SymptomTrend {
  _id: string;
  count: number;
  recent_reports: Array<{
    date: string;
    patient_id: string;
    severity: string;
  }>;
}

interface OutbreakAlert {
  _id: string;
  current_week: number;
  previous_week: number;
  increase_percentage: number;
}

interface DailyTrend {
  _id: { date: string };
  total_cases: number;
  confirmed_diagnoses: number;
}

interface SurveillanceData {
  confirmed_diagnoses: DiseaseTrend[];
  symptom_trends: SymptomTrend[];
  daily_trends: DailyTrend[];
  outbreak_alerts: OutbreakAlert[];
  severity_distribution: Array<{ _id: string; count: number }>;
  recovery_statistics: {
    total_cases: number;
    follow_up_required: number;
    resolved_cases: number;
  };
  summary: {
    total_confirmed_cases: number;
    most_common_diagnosis: string;
    most_common_symptom: string;
    active_outbreak_alerts: number;
  };
  is_mock_data?: boolean;
}

export default function DiseaseSurveillancePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [timeRange, setTimeRange] = useState('30');
  const [data, setData] = useState<SurveillanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Fetch disease surveillance data
  const fetchSurveillanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/analytics/disease-trends?range=${timeRange}`, {
        credentials: 'include', // Send cookies with request
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch surveillance data:', response.status);
        // If API fails, still set mock data for demo
        setData(null);
      }
    } catch (error) {
      console.error('Error fetching surveillance data:', error);
      // If API fails, still set mock data for demo
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchSurveillanceData();
    }
  }, [user, timeRange, fetchSurveillanceData]);

  // Redirect if not authenticated or not a doctor
  useEffect(() => {
    if (!loading && (!user || user.role !== 'doctor')) {
      router.push('/role-selection');
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading surveillance data...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">No surveillance data available</p>
            <Button onClick={fetchSurveillanceData} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Prepare chart data
  const dailyChartData = data.daily_trends.map(trend => ({
    date: format(new Date(trend._id.date), 'MMM dd'),
    confirmed: trend.confirmed_diagnoses,
    unconfirmed: trend.total_cases - trend.confirmed_diagnoses
  }));

  const symptomChartData = data.symptom_trends.slice(0, 10).map(symptom => ({
    name: symptom._id.length > 18 ? symptom._id.substring(0, 18) + '...' : symptom._id,
    fullName: symptom._id,
    count: symptom.count
  }));

  // Debug logging
  console.log('Symptom trends data:', data.symptom_trends);
  console.log('Processed symptom chart data:', symptomChartData);

  const diagnosisChartData = data.confirmed_diagnoses.slice(0, 8).map(diagnosis => ({
    name: diagnosis._id.length > 20 ? diagnosis._id.substring(0, 20) + '...' : diagnosis._id,
    fullName: diagnosis._id,
    count: diagnosis.count
  }));

  const severityColors = {
    low: '#22c55e',
    medium: '#f59e0b', 
    high: '#ef4444',
    emergency: '#dc2626'
  };

  const severityChartData = data.severity_distribution.map(item => ({
    name: item._id || 'Unknown',
    value: item.count,
    color: severityColors[item._id as keyof typeof severityColors] || '#6b7280'
  }));

  const getAlertLevel = (percentage: number) => {
    if (percentage >= 100) return { level: 'critical', color: 'bg-red-500', text: 'Critical' };
    if (percentage >= 75) return { level: 'high', color: 'bg-orange-500', text: 'High' };
    if (percentage >= 50) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
    return { level: 'low', color: 'bg-blue-500', text: 'Low' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Disease Surveillance Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor disease trends, track outbreaks, and analyze campus health patterns
              </p>
              {data.is_mock_data && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Demo Data
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Showing sample data for demonstration purposes
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 2 weeks</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 2 months</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchSurveillanceData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Confirmed Cases</p>
                    <p className="text-3xl font-bold text-foreground">{data.summary.total_confirmed_cases}</p>
                    <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Outbreak Alerts</p>
                    <p className="text-3xl font-bold text-red-600">{data.summary.active_outbreak_alerts}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active warnings</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Top Diagnosis</p>
                    <p className="text-lg font-bold text-foreground">{data.summary.most_common_diagnosis}</p>
                    <p className="text-xs text-muted-foreground mt-1">Most frequent</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recovery Rate</p>
                    <p className="text-3xl font-bold text-green-600">
                      {data.recovery_statistics.total_cases > 0 
                        ? Math.round((data.recovery_statistics.resolved_cases / data.recovery_statistics.total_cases) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Cases resolved</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outbreak Alerts */}
          {data.outbreak_alerts.length > 0 && (
            <Card className="mb-8 border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <Zap className="w-5 h-5" />
                      Outbreak Alerts
                      <Badge variant="destructive" className="ml-2">
                        {data.outbreak_alerts.length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Symptoms showing significant increases that may indicate potential outbreaks
                    </CardDescription>
                  </div>
                  {data.outbreak_alerts.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllAlerts(!showAllAlerts)}
                      className="flex items-center gap-2"
                    >
                      {showAllAlerts ? (
                        <>
                          Show Less
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Show All ({data.outbreak_alerts.length - 3} more)
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(showAllAlerts ? data.outbreak_alerts : data.outbreak_alerts.slice(0, 3)).map((alert, index) => {
                    const alertInfo = getAlertLevel(alert.increase_percentage);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${alertInfo.color}`}></div>
                          <div>
                            <h4 className="font-semibold text-foreground">{alert._id}</h4>
                            <p className="text-sm text-muted-foreground">
                              {alert.current_week} cases this week (up from {alert.previous_week})
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">
                            +{Math.round(alert.increase_percentage)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{alertInfo.text} Priority</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!showAllAlerts && data.outbreak_alerts.length > 3 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {data.outbreak_alerts.length - 3} more alert{data.outbreak_alerts.length - 3 !== 1 ? 's' : ''} available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Case Trends</CardTitle>
                <CardDescription>Total cases and confirmed diagnoses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Confirmed Diagnoses' || name === 'Pending/Unconfirmed') {
                          return [value, name];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="unconfirmed" stackId="1" stroke="#93c5fd" fill="#93c5fd" name="Pending/Unconfirmed" />
                    <Area type="monotone" dataKey="confirmed" stackId="1" stroke="#ef4444" fill="#fca5a5" name="Confirmed Diagnoses" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Case Severity Distribution</CardTitle>
                <CardDescription>Breakdown of cases by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* More Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>Most Common Symptoms</CardTitle>
                <CardDescription>Frequently reported symptoms across all consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={symptomChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [value, 'Reports']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Diagnoses */}
            <Card>
              <CardHeader>
                <CardTitle>Most Common Diagnoses</CardTitle>
                <CardDescription>Confirmed diagnoses from medical records</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={diagnosisChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [value, 'Cases']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Footer Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  <p>Data includes consultations, appointments, and medical records from the last {timeRange} days</p>
                  <p>Outbreak detection based on 50%+ week-over-week increases with minimum 3 cases</p>
                </div>
                {lastUpdated && (
                  <div className="text-right">
                    <p>Last updated: {format(lastUpdated, 'PPpp')}</p>
                    <Button variant="ghost" size="sm" onClick={fetchSurveillanceData} className="mt-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}