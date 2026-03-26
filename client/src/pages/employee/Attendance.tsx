import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import apiClient from "@/lib/apiClient";
import { AttendanceRecord } from "@/types";
import { Clock, LogIn, LogOut, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EmployeeAttendance() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAttendance = async (showLoader = false) => {
      if (showLoader) setIsLoading(true);
      try {
        const res = await apiClient.getAttendance(user.id);
        if (res.success && Array.isArray(res.data)) setAttendanceRecords(res.data);
      } catch (e) {
        console.error(e);
        if (showLoader) toast.error("Failed to load attendance");
      } finally {
        if (showLoader) setIsLoading(false);
      }
    };
    fetchAttendance(true);
    const interval = setInterval(() => fetchAttendance(false), 20000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendanceRecords.find(r => r.date === today);

  const handleCheckIn = async () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const checkIn = `${hh}:${mm}`;
    try {
      setIsSaving(true);
      const res = await apiClient.createAttendance(user.id, { date: today, checkIn, checkOut: null, status: "present", workingHours: 0 });
      if (res.success) {
        const r = await apiClient.getAttendance(user.id);
        if (r.success && Array.isArray(r.data)) setAttendanceRecords(r.data);
        toast.success(`Checked in at ${checkIn}`);
      } else {
        toast.error(res.message || "Failed to check in");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Check-in failed");
    } finally { setIsSaving(false); }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return toast.error("No check-in found");
    try {
      setIsSaving(true);
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, "0");
      const mm = now.getMinutes().toString().padStart(2, "0");
      const checkOut = `${hh}:${mm}`;
      const [inH, inM] = (todayRecord.checkIn || "00:00").split(":").map(Number);
      let diffMins = (now.getHours() * 60 + now.getMinutes()) - (inH * 60 + inM);
      if (diffMins < 0) diffMins += 24 * 60; // Handle overnight shifts
      const hours = Math.round(diffMins / 60 * 100) / 100;
      const res = await apiClient.updateAttendance(todayRecord._id || todayRecord.id, { checkOut, workingHours: hours });
      if (res.success) {
        const r = await apiClient.getAttendance(user.id);
        if (r.success && Array.isArray(r.data)) setAttendanceRecords(r.data);
        toast.success(`Checked out at ${checkOut}`);
      } else {
        toast.error(res.message || "Failed to check out");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Check-out failed");
    } finally { setIsSaving(false); }
  };

  const getStatusColor = (s: string) => s === "present" ? "bg-success" : s === "late" ? "bg-warning" : "bg-muted";

  const monthRecords = attendanceRecords.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });

  const presentDays = monthRecords.filter(r => r.status === "present").length;
  const lateDays = monthRecords.filter(r => r.status === "late").length;
  const absentDays = monthRecords.filter(r => r.status === "absent").length;
  const totalHours = monthRecords.reduce((s, r) => s + (r.workingHours || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track your daily attendance and working hours</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Today's Attendance</CardTitle>
            <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading attendance...</div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  {todayRecord ? (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Check In</p>
                        <p className="text-lg font-bold">{todayRecord.checkIn || "-"}</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Check Out</p>
                        <p className="text-lg font-bold">{todayRecord.checkOut || "-"}</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Hours</p>
                        <p className="text-lg font-bold">{(todayRecord.workingHours || 0).toFixed(1)}</p>
                      </div>
                      <Badge className={getStatusColor(todayRecord.status)}>{todayRecord.status}</Badge>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No attendance marked yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCheckIn} disabled={!!todayRecord?.checkIn || isSaving} className="gap-2">
                    <LogIn className="h-4 w-4" />Check In
                  </Button>
                  <Button onClick={handleCheckOut} variant="outline" disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut || isSaving} className="gap-2">
                    <LogOut className="h-4 w-4" />Check Out
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-success">{presentDays}</p><p className="text-sm text-muted-foreground">Present Days</p></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-warning">{lateDays}</p><p className="text-sm text-muted-foreground">Late Days</p></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-destructive">{absentDays}</p><p className="text-sm text-muted-foreground">Absent Days</p></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold">{totalHours.toFixed(1)}</p><p className="text-sm text-muted-foreground">Total Hours</p></div></CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
