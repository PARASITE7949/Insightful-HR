import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/apiClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task } from "@/types";
import { Plus, ListTodo, Clock, CheckCircle2, Circle, Trash2, Edit, Calendar, Loader } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EmployeeTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    priority: "medium" as Task["priority"],
    dueDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [userProjects] = useState<Array<{ id: string; name: string }>>([]);

  if (!user) return null;

  useEffect(() => {
    fetchTasks(true);
    const interval = setInterval(() => fetchTasks(false), 20000);
    return () => clearInterval(interval);
  }, [user.id]);

  const fetchTasks = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const response = await apiClient.getTasks(user.id);
      if (response.success && Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      if (showLoader) toast.error("Failed to fetch tasks");
      console.error(error);
      setTasks([]);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingTask) {
        // Update task
        const response = await apiClient.put(`/users/tasks/${editingTask.id}`, {
          title: formData.title,
          description: formData.description,
          project: formData.project,
          priority: formData.priority,
          dueDate: formData.dueDate,
        });
        if (response.success) {
          toast.success("Task updated successfully");
          fetchTasks();
          resetForm();
        } else {
          toast.error(response.message || "Failed to update task");
        }
      } else {
        // Create new task
        const response = await apiClient.post(`/users/${user.id}/tasks`, {
          title: formData.title,
          description: formData.description,
          project: formData.project || "General",
          priority: formData.priority,
          dueDate: formData.dueDate,
        });
        if (response.success) {
          toast.success("Task created successfully");
          fetchTasks();
          resetForm();
        } else {
          toast.error(response.message || "Failed to create task");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      project: "",
      priority: "medium",
      dueDate: format(new Date(), "yyyy-MM-dd"),
    });
    setEditingTask(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      project: task.project,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    try {
      const response = await apiClient.put(`/users/tasks/${taskId}`, {
        status,
        completedAt: status === "completed" ? new Date().toISOString() : null,
      });
      if (response.success) {
        toast.success(`Task marked as ${status}`);
        fetchTasks();
      } else {
        toast.error(response.message || "Failed to update task");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const response = await apiClient.delete(`/users/tasks/${taskId}`);
      if (response.success) {
        toast.success("Task deleted");
        fetchTasks();
      } else {
        toast.error(response.message || "Failed to delete task");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="p-4 rounded-lg bg-card border space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{task.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">{task.project}</Badge>
        <Badge variant={
          task.priority === "high" ? "destructive" :
            task.priority === "medium" ? "default" : "secondary"
        } className="text-xs">
          {task.priority}
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(task.dueDate), "MMM d")}
        </span>
      </div>

      <div className="flex gap-2">
        {task.status !== "pending" && task.status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange(task.id, "pending")}
          >
            <Circle className="h-3 w-3 mr-1" />
            Pending
          </Button>
        )}
        {task.status !== "in-progress" && task.status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange(task.id, "in-progress")}
          >
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Button>
        )}
        {task.status !== "completed" && (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleStatusChange(task.id, "completed")}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Complete
          </Button>
        )}
        {task.status === "completed" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="font-medium">Completed</span>
            {task.completedAt && (
              <span className="text-xs">
                on {format(new Date(task.completedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage your tasks and project work</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTask(null); resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "Update your task details" : "Add a new task to your list"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select
                      value={formData.project}
                      onValueChange={(value) => setFormData({ ...formData, project: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        {userProjects.map((project) => (
                          <SelectItem key={project.id} value={project.name}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: Task["priority"]) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      `${editingTask ? "Update" : "Create"} Task`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Circle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressTasks.length}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          {isLoading && (
            <Card className="mt-4">
              <CardContent className="py-12 text-center">
                <Loader className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading your tasks...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && (
            <>
              <TabsContent value="all" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tasks.length > 0 ? (
                    tasks.map((task) => <TaskCard key={task.id} task={task} />)
                  ) : (
                    <Card className="col-span-full">
                      <CardContent className="py-12 text-center">
                        <ListTodo className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                </div>
              </TabsContent>

              <TabsContent value="in-progress" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
