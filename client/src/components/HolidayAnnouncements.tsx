import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/apiClient";
import { Calendar, Bell, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Holiday {
  _id: string;
  date: string;
  name: string;
  type: "holiday" | "festival" | "government" | "company_event" | "other";
  description?: string;
  isRecurring?: boolean;
}

export function HolidayAnnouncements() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const response = await apiClient.getHolidays(month, year);

        if (response.success && Array.isArray(response.data)) {
          // Filter to show only upcoming holidays (today onwards)
          const todayStr = format(now, "yyyy-MM-dd");
          const upcomingHolidays = response.data
            .filter((h: Holiday) => h.date >= todayStr)
            .sort((a: Holiday, b: Holiday) => a.date.localeCompare(b.date))
            .slice(0, 5); // Show top 5 upcoming holidays

          setHolidays(upcomingHolidays);
        } else {
          setHolidays([]);
        }
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
        setError("Failed to load holiday announcements");
        setHolidays([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "holiday":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "festival":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "government":
        return "bg-red-100 text-red-800 border-red-300";
      case "company_event":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "holiday":
        return "🎉";
      case "festival":
        return "🎊";
      case "government":
        return "📋";
      case "company_event":
        return "🎯";
      default:
        return "📅";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <CardTitle>Holiday Announcements</CardTitle>
          </div>
          <CardDescription>Upcoming holidays and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600 animate-pulse" />
          <CardTitle>Holiday Announcements</CardTitle>
        </div>
        <CardDescription>
          {holidays.length > 0
            ? `${holidays.length} upcoming holiday${holidays.length !== 1 ? "s" : ""} this month`
            : "No holidays scheduled this month"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md border border-red-200 text-red-700 text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {holidays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No holidays announced for this month</p>
          </div>
        ) : (
          <div className="space-y-3">
            {holidays.map((holiday, idx) => (
              <div
                key={`${holiday._id}-${holiday.date}-${idx}`}
                className="p-3 rounded-lg border-l-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                style={{
                  borderLeftColor: getTypeColor(holiday.type).split(" ")[0].includes("blue")
                    ? "#3b82f6"
                    : getTypeColor(holiday.type).split(" ")[0].includes("purple")
                      ? "#a855f7"
                      : getTypeColor(holiday.type).split(" ")[0].includes("red")
                        ? "#ef4444"
                        : "#22c55e",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(holiday.type)}</span>
                      <h4 className="font-semibold text-sm">{holiday.name}</h4>
                    </div>
                    {holiday.description && (
                      <p className="text-xs text-muted-foreground mb-2">{holiday.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(parseISO(holiday.date), "MMM d, yyyy")}</span>
                      {holiday.isRecurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
                    </div>
                  </div>
                  <Badge className={getTypeColor(holiday.type)} variant="outline">
                    {holiday.type.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
