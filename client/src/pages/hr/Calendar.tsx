import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import apiClient from "@/lib/apiClient";
import { CalendarDays, Plus, Edit, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Holiday {
  _id: string;
  date: string;
  name: string;
  type: "holiday" | "festival" | "government" | "company_event" | "other";
  description?: string;
  isRecurring?: boolean;
  originalId?: string;
  isRecurringInstance?: boolean;
}

const typeColors: Record<string, string> = {
  holiday: "bg-blue-100 text-blue-800 border-blue-300",
  festival: "bg-purple-100 text-purple-800 border-purple-300",
  government: "bg-red-100 text-red-800 border-red-300",
  company_event: "bg-green-100 text-green-800 border-green-300",
  other: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function HRCalendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    name: "",
    type: "holiday" as "holiday" | "festival" | "government" | "company_event" | "other",
    description: "",
    isRecurring: false,
    recurringMonth: new Date().getMonth() + 1,
    recurringDay: new Date().getDate(),
  });

  useEffect(() => {
    fetchHolidays();
  }, [user, currentMonth, currentYear]);

  const fetchHolidays = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await apiClient.getHolidays(currentMonth, currentYear);
      if (response.success && Array.isArray(response.data)) {
        setHolidays(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch holidays", error);
      toast.error("Failed to load holidays");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (holiday?: Holiday) => {
    if (holiday) {
      setSelectedHoliday(holiday);
      setFormData({
        date: holiday.date,
        name: holiday.name,
        type: holiday.type,
        description: holiday.description || "",
        isRecurring: holiday.isRecurring || false,
        recurringMonth: new Date(holiday.date).getMonth() + 1,
        recurringDay: new Date(holiday.date).getDate(),
      });
    } else {
      setSelectedHoliday(null);
      setFormData({
        date: format(selectedDate, "yyyy-MM-dd"),
        name: "",
        type: "holiday",
        description: "",
        isRecurring: false,
        recurringMonth: selectedDate.getMonth() + 1,
        recurringDay: selectedDate.getDate(),
      });
    }
    setIsDialogOpen(true);
  };

  const extractBaseId = (id: string): string => {
    // If the ID contains a date suffix (YYYY-MM-DD), remove it
    // Example: eccd2b75-81aa-4dfb-879e-6c51db97e624-2026-02-19 -> eccd2b75-81aa-4dfb-879e-6c51db97e624
    const datePattern = /-(\d{4}-\d{2}-\d{2})$/;
    return id.replace(datePattern, '');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (selectedHoliday) {
        // Use originalId for recurring instances, or extract base ID from compound format
        const holidayIdToUpdate = selectedHoliday.originalId || extractBaseId(selectedHoliday._id);
        
        await apiClient.updateHoliday(holidayIdToUpdate, formData);
        toast.success("Holiday updated successfully");
      } else {
        await apiClient.createHoliday(formData);
        toast.success("Holiday created successfully");
      }
      setIsDialogOpen(false);
      fetchHolidays();
    } catch (error: any) {
      toast.error(error.message || "Failed to save holiday");
    }
  };

  const handleDelete = async (holidayId: string, holiday?: Holiday) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      // Use originalId for recurring instances, or extract base ID from compound format
      let idToDelete = holidayId;
      if (holiday?.originalId) {
        idToDelete = holiday.originalId;
      } else if (holiday?._id) {
        idToDelete = extractBaseId(holiday._id);
      }
      
      await apiClient.deleteHoliday(idToDelete);
      toast.success("Holiday deleted successfully");
      fetchHolidays();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete holiday");
    }
  };

  const getHolidaysForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.filter((h) => h.date === dateStr);
  };

  const isDateHoliday = (date: Date) => {
    return getHolidaysForDate(date).length > 0;
  };

  const getDateModifiers = () => {
    const modifiers: Record<string, (date: Date) => boolean> = {};
    holidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.date);
      const dateKey = format(holidayDate, "yyyy-MM-dd");
      modifiers[dateKey] = () => true;
    });
    return modifiers;
  };

  if (!user) return null;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedDateHolidays = getHolidaysForDate(selectedDate);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Company Calendar</h1>
            <p className="text-muted-foreground">Manage holidays, festivals, and company events</p>
          </div>
          <div className="flex gap-2">
            <Select
              value={currentMonth.toString()}
              onValueChange={(v) => setCurrentMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currentYear.toString()}
              onValueChange={(v) => setCurrentYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026, 2027].map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {monthNames[currentMonth - 1]} {currentYear}
              </CardTitle>
              <CardDescription>Click on a date to view events</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={new Date(currentYear, currentMonth - 1, 1)}
                modifiers={getDateModifiers()}
                modifiersClassNames={{
                  selected: "bg-primary text-primary-foreground",
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events on {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDateHolidays.length > 0 ? (
                selectedDateHolidays.map((holiday, idx) => (
                  <div
                    key={`${holiday._id}-${holiday.date}-${idx}`}
                    className={cn(
                      "p-3 rounded-lg border",
                      typeColors[holiday.type] || typeColors.other
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{holiday.name}</h4>
                        <Badge variant="outline" className="mt-1">
                          {holiday.type}
                        </Badge>
                        {holiday.description && (
                          <p className="text-sm mt-2 opacity-90">{holiday.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(holiday)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(holiday._id, holiday)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events scheduled</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => handleOpenDialog()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Events for {monthNames[currentMonth - 1]} {currentYear}</CardTitle>
            <CardDescription>Complete list of holidays, festivals, and events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : holidays.length > 0 ? (
              <div className="space-y-2">
                {holidays.map((holiday, idx) => (
                  <div
                    key={`${holiday._id}-${holiday.date}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-3 w-3 rounded-full", {
                        "bg-blue-500": holiday.type === "holiday",
                        "bg-purple-500": holiday.type === "festival",
                        "bg-red-500": holiday.type === "government",
                        "bg-green-500": holiday.type === "company_event",
                        "bg-gray-500": holiday.type === "other",
                      })} />
                      <div>
                        <p className="font-medium">{holiday.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(holiday.date), "MMMM d, yyyy")} • {holiday.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDate(new Date(holiday.date));
                          handleOpenDialog(holiday);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(holiday._id, holiday)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No events scheduled for this month</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Holiday Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedHoliday ? "Edit Event" : "Add New Event"}
              </DialogTitle>
              <DialogDescription>
                Add holidays, festivals, government holidays, or company events to the calendar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., New Year, Diwali, Company Annual Day"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Event Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="government">Government Holiday</SelectItem>
                      <SelectItem value="company_event">Company Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        {formData.date ? format(new Date(formData.date), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(formData.date)}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({
                              ...formData,
                              date: format(date, "yyyy-MM-dd"),
                              recurringMonth: date.getMonth() + 1,
                              recurringDay: date.getDate(),
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description or notes about this event"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked })
                  }
                />
                <Label htmlFor="recurring">Recurring annually</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {selectedHoliday ? "Update" : "Create"} Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
