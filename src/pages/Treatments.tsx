import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Copy, Power, DollarSign, Clock, FileText } from "lucide-react";
import { treatmentItems, treatmentCategories, TreatmentItem } from "@/data/treatments";
import { inventoryItems } from "@/data/inventory";
import { Package } from "lucide-react";
import { TreatmentItemDialog } from "@/components/TreatmentItemDialog";

export default function Treatments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentItem | undefined>();

  // Filter treatments
  const filteredTreatments = treatmentItems.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && item.isActive) ||
      (statusFilter === "inactive" && !item.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "medical-procedures": "bg-blue-100 text-blue-800 border-blue-200",
      "medications": "bg-purple-100 text-purple-800 border-purple-200",
      "lab-tests": "bg-green-100 text-green-800 border-green-200",
      "preventives": "bg-teal-100 text-teal-800 border-teal-200",
      "fees-charges": "bg-orange-100 text-orange-800 border-orange-200",
      "boarding-grooming": "bg-pink-100 text-pink-800 border-pink-200",
      "packages-bundles": "bg-indigo-100 text-indigo-800 border-indigo-200"
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleAddNew = () => {
    setSelectedTreatment(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (treatment: TreatmentItem) => {
    setSelectedTreatment(treatment);
    setIsDialogOpen(true);
  };

  const handleSave = (treatment: TreatmentItem) => {
    // In a real app, this would save to the backend
    console.log("Saving treatment:", treatment);
    setIsDialogOpen(false);
  };

  // Calculate stats
  const stats = {
    total: treatmentItems.length,
    active: treatmentItems.filter(t => t.isActive).length,
    categories: Object.keys(treatmentCategories).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treatment List</h1>
          <p className="text-muted-foreground mt-1">
            Master catalog of all billable and clinical services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Import/Export
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Treatment Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(treatmentCategories).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Treatment List Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead className="w-[180px]">Category</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead className="w-[80px] text-right">Price</TableHead>
                  <TableHead className="w-[80px] text-right">Cost</TableHead>
                  <TableHead className="w-[80px] text-center">Duration</TableHead>
                  <TableHead className="w-[200px]">Linked Inventory</TableHead>
                  <TableHead className="w-[80px] text-center">Status</TableHead>
                  <TableHead className="w-[150px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.length > 0 ? (
                  filteredTreatments.map((treatment) => (
                    <TableRow key={treatment.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium text-sm">
                        {treatment.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {treatment.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(treatment.category)}>
                          {treatmentCategories[treatment.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {treatment.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{treatment.price.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{treatment.cost.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {treatment.duration > 0 ? (
                          <div className="flex items-center justify-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{treatment.duration}m</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {treatment.linkedInventory && treatment.linkedInventory.length > 0 ? (
                          <div className="space-y-1">
                            {treatment.linkedInventory.map((linkedItem, idx) => {
                              const invItem = inventoryItems.find(i => i.id === linkedItem.inventoryId);
                              if (!invItem) return null;
                              return (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{invItem.name}</span>
                                  <span className="text-muted-foreground">× {linkedItem.quantity}</span>
                                  {linkedItem.required && (
                                    <Badge variant="outline" className="text-xs h-4">Required</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={treatment.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {treatment.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(treatment)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Duplicate functionality
                              console.log("Duplicate:", treatment);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Toggle active status
                              console.log("Toggle status:", treatment);
                            }}
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No treatments found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Item Dialog */}
      <TreatmentItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        treatment={selectedTreatment}
        onSave={handleSave}
      />
    </div>
  );
}


