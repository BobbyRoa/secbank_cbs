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
import { Plus, Pencil, Trash2, Loader2, Search, Users, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CustomersPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
  const [formName, setFormName] = useState("");

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.customer.list.useQuery();

  const createCustomer = trpc.customer.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created successfully");
      utils.customer.list.invalidate();
      setIsCreateOpen(false);
      setFormName("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateCustomer = trpc.customer.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated successfully");
      utils.customer.list.invalidate();
      setIsEditOpen(false);
      setSelectedCustomer(null);
      setFormName("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteCustomer = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted successfully");
      utils.customer.list.invalidate();
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      toast.error("Please enter a customer name");
      return;
    }
    createCustomer.mutate({ name: formName.trim() });
  };

  const handleEdit = () => {
    if (!selectedCustomer || !formName.trim()) {
      toast.error("Please enter a customer name");
      return;
    }
    updateCustomer.mutate({ id: selectedCustomer.id, name: formName.trim() });
  };

  const handleDelete = () => {
    if (!selectedCustomer) return;
    deleteCustomer.mutate({ id: selectedCustomer.id });
  };

  const openEditDialog = (customer: { id: number; name: string }) => {
    setSelectedCustomer(customer);
    setFormName(customer.name);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (customer: { id: number; name: string }) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Customers</h1>
            <p className="text-muted-foreground">Manage customer profiles</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
              {filteredCustomers?.length || 0} customers found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredCustomers && filteredCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Accounts</TableHead>
                    <TableHead>Total Balance</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-mono text-sm">
                        {customer.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {customer.accountCount}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(customer.totalBalance)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(customer)}
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
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customers found</p>
                <p className="text-sm">Click "Add Customer" to create one</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the customer's name to create a new profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                placeholder="Enter customer name"
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
            <Button onClick={handleCreate} disabled={createCustomer.isPending}>
              {createCustomer.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer's information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Customer Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter customer name"
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
            <Button onClick={handleEdit} disabled={updateCustomer.isPending}>
              {updateCustomer.isPending && (
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
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCustomer?.name}"? This
              action cannot be undone. Customers with existing accounts cannot
              be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCustomer.isPending && (
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
