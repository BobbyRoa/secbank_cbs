import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Loader2, Building2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BranchesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{ id: number; code: string; name: string } | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");

  const utils = trpc.useUtils();
  const { data: branches, isLoading, refetch } = trpc.branch.list.useQuery();

  const createBranch = trpc.branch.create.useMutation({
    onSuccess: () => {
      toast.success("Branch created successfully");
      utils.branch.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsCreateOpen(false);
      setFormCode("");
      setFormName("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateBranch = trpc.branch.update.useMutation({
    onSuccess: () => {
      toast.success("Branch updated successfully");
      utils.branch.list.invalidate();
      setIsEditOpen(false);
      setSelectedBranch(null);
      setFormName("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteBranch = trpc.branch.delete.useMutation({
    onSuccess: () => {
      toast.success("Branch deleted successfully");
      utils.branch.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDeleteOpen(false);
      setSelectedBranch(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const seedBranches = trpc.branch.seed.useMutation({
    onSuccess: () => {
      toast.success("Default branches seeded successfully");
      utils.branch.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const handleCreate = () => {
    if (!formCode.trim() || formCode.length !== 3) {
      toast.error("Branch code must be exactly 3 characters");
      return;
    }
    if (!formName.trim()) {
      toast.error("Please enter a branch name");
      return;
    }
    createBranch.mutate({ code: formCode.trim(), name: formName.trim() });
  };

  const handleEdit = () => {
    if (!selectedBranch || !formName.trim()) {
      toast.error("Please enter a branch name");
      return;
    }
    updateBranch.mutate({ id: selectedBranch.id, name: formName.trim() });
  };

  const handleDelete = () => {
    if (!selectedBranch) return;
    deleteBranch.mutate({ id: selectedBranch.id });
  };

  const openEditDialog = (branch: { id: number; code: string; name: string }) => {
    setSelectedBranch(branch);
    setFormName(branch.name);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (branch: { id: number; code: string; name: string }) => {
    setSelectedBranch(branch);
    setIsDeleteOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Branches</h1>
            <p className="text-muted-foreground">Manage bank branches</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => seedBranches.mutate()}
              disabled={seedBranches.isPending}
            >
              {seedBranches.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Seed Default Branches
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </div>
        </div>

        {/* Branches Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Branch List</CardTitle>
            <CardDescription>
              {branches?.length || 0} branches configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : branches && branches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {branch.code}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(branch.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(branch)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(branch)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No branches found</p>
                <p className="text-sm">Click "Seed Default Branches" to add the 5 default branches</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Branches Info */}
        <Card className="bg-slate-50 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Default Branches</CardTitle>
            <CardDescription>
              The following branches are seeded by default when you click "Seed Default Branches":
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { code: "001", name: "Camaligan" },
                { code: "002", name: "Buhi" },
                { code: "003", name: "Calabanga" },
                { code: "004", name: "Pili" },
                { code: "005", name: "Aseana" },
              ].map((branch) => (
                <div
                  key={branch.code}
                  className="p-3 bg-white rounded-lg border text-center"
                >
                  <div className="text-lg font-bold text-primary">{branch.code}</div>
                  <div className="text-sm text-muted-foreground">{branch.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch with a unique 3-character code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Branch Code</Label>
              <Input
                id="code"
                placeholder="e.g., 006"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                maxLength={3}
              />
              <p className="text-xs text-muted-foreground">
                Must be exactly 3 characters. This will be used as the account number prefix.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name</Label>
              <Input
                id="name"
                placeholder="Enter branch name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createBranch.isPending}>
              {createBranch.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update the branch name. Branch code cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Branch Code</Label>
              <Input value={selectedBranch?.code || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Branch Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter branch name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateBranch.isPending}>
              {updateBranch.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete branch "{selectedBranch?.code} - {selectedBranch?.name}"? 
              This action cannot be undone. Branches with existing accounts should not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBranch.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
