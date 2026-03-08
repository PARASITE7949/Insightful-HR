import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Send, Bell } from "lucide-react";
import { toast } from "sonner";

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function ManageNotifications() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("announcement");
    const [sendTo, setSendTo] = useState("all");

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await apiClient.getUsers();
            if (response.success && Array.isArray(response.data)) {
                setEmployees(response.data.filter((u: any) => u.id !== user?.id));
            }
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error("Please enter a title and message for the notification");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                title: title.trim(),
                message: message.trim(),
                type,
                targetUserIds: sendTo === "all" ? [] : [sendTo],
            };

            const response = await apiClient.sendNotification(payload);

            if (response.success) {
                toast.success(response.message || "Notification sent successfully!");
                setTitle("");
                setMessage("");
                setType("announcement");
                setSendTo("all");
            } else {
                toast.error(response.message || "Failed to send notification");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user || !["admin_staff", "hr_manager"].includes(user.role)) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                    <p>You do not have permission to manage notifications.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Bell className="h-8 w-8 text-primary" />
                        Manage Notifications
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Send announcements and alerts to employees across the company.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Send New Broadcast</CardTitle>
                        <CardDescription>
                            Create a new notification that will immediately appear in the user's dashboard and unread counts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendNotification} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Notification Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Important Company Update"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Notification Type</Label>
                                    <Select value={type} onValueChange={setType} disabled={isLoading}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="announcement">📢 Announcement</SelectItem>
                                            <SelectItem value="alert">⚠️ Urgent Alert</SelectItem>
                                            <SelectItem value="holiday">🎉 Holiday/Event</SelectItem>
                                            <SelectItem value="system">⚙️ System Update</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sendTo">Recipient</Label>
                                    <Select value={sendTo} onValueChange={setSendTo} disabled={isLoading}>
                                        <SelectTrigger id="sendTo">
                                            <SelectValue placeholder="Select recipients" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Everyone in Company</SelectItem>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.role.replace("_", " ")})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message Content</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Type the full notification message here..."
                                    className="min-h-[120px]"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    "Sending..."
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Notification
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
