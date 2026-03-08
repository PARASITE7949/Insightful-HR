import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, updateSettings } from "@/lib/storage";
import { SystemSettings } from "@/types";
import { Save, Building2, Clock, Scale } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (user) {
      setSettings(getSettings(user.companyId));
    }
  }, [user]);

  if (!user || !settings) return <DashboardLayout><div className="p-4">Loading...</div></DashboardLayout>;

  const handleSave = () => {
    updateSettings(user.companyId, settings);
    toast.success("Settings saved successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Company Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Work Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Working Hours Per Day</Label>
                <Input type="number" value={settings.workingHoursPerDay} onChange={(e) => setSettings({ ...settings, workingHoursPerDay: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Late Threshold (minutes)</Label>
                <Input type="number" value={settings.lateThresholdMinutes} onChange={(e) => setSettings({ ...settings, lateThresholdMinutes: parseInt(e.target.value) || 0 })} />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" />Performance Weights</CardTitle>
              <CardDescription>Configure how performance is calculated (must total 100%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Attendance (%)</Label>
                  <Input type="number" value={settings.performanceWeights.attendance} onChange={(e) => setSettings({ ...settings, performanceWeights: { ...settings.performanceWeights, attendance: parseInt(e.target.value) || 0 } })} />
                </div>
                <div className="space-y-2">
                  <Label>Punctuality (%)</Label>
                  <Input type="number" value={settings.performanceWeights.punctuality} onChange={(e) => setSettings({ ...settings, performanceWeights: { ...settings.performanceWeights, punctuality: parseInt(e.target.value) || 0 } })} />
                </div>
                <div className="space-y-2">
                  <Label>Task Completion (%)</Label>
                  <Input type="number" value={settings.performanceWeights.taskCompletion} onChange={(e) => setSettings({ ...settings, performanceWeights: { ...settings.performanceWeights, taskCompletion: parseInt(e.target.value) || 0 } })} />
                </div>
                <div className="space-y-2">
                  <Label>Projects (%)</Label>
                  <Input type="number" value={settings.performanceWeights.projects} onChange={(e) => setSettings({ ...settings, performanceWeights: { ...settings.performanceWeights, projects: parseInt(e.target.value) || 0 } })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />Save Settings</Button>
      </div>
    </DashboardLayout>
  );
}
