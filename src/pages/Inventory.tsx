import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, AlertTriangle, Package, DollarSign, TrendingDown, AlertCircle } from "lucide-react";
import { inventoryItems, inventoryCategories, InventoryItem } from "@/data/inventory";
import { InventoryItemDialog } from "@/components/InventoryItemDialog";
import { format } from "date-fns";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();

  // Filter inventory items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "low-stock" && item.quantity <= item.reorderLevel) ||
        (statusFilter === "expiring" && item.expirationDate && new Date(item.expirationDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, statusFilter]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "drugs": "bg-purple-100 text-purple-800 border-purple-200",
      "vaccines": "bg-blue-100 text-blue-800 border-blue-200",
      "consumables": "bg-green-100 text-green-800 border-green-200",
      "surgical": "bg-red-100 text-red-800 border-red-200",
      "diagnostic": "bg-teal-100 text-teal-800 border-teal-200",
      "equipment": "bg-orange-100 text-orange-800 border-orange-200",
      "food": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "other": "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleAddNew = () => {
    setSelectedItem(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleSave = (item: InventoryItem) => {
    // In a real app, this would save to the backend
    console.log("Saving inventory item:", item);
    setIsDialogOpen(false);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const lowStockCount = inventoryItems.filter(item => item.quantity <= item.reorderLevel).length;
    const expiringCount = inventoryItems.filter(item => 
      item.expirationDate && new Date(item.expirationDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalItems,
      totalValue,
      lowStockCount,
      expiringCount
    };
  }, []);

  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorderLevel;
  const isExpiring = (item: InventoryItem) => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    return expDate < in90Days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Track physical items like consumables, drugs, and materials
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Import/Export
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items need reordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiringCount}</div>
            <p className="text-xs text-muted-foreground">Within 90 days</p>
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
                placeholder="Search by name, SKU, supplier, or description..."
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
                {Object.entries(inventoryCategories).map(([key, label]) => (
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
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">SKU</TableHead>
                  <TableHead className="w-[250px]">Item Name</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[100px] text-center">Quantity</TableHead>
                  <TableHead className="w-[100px]">Unit</TableHead>
                  <TableHead className="w-[120px] text-right">Unit Cost</TableHead>
                  <TableHead className="w-[120px] text-right">Total Value</TableHead>
                  <TableHead className="w-[120px]">Location</TableHead>
                  <TableHead className="w-[120px]">Expiration</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[150px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium text-sm">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(item.category)}>
                          {inventoryCategories[item.category as keyof typeof inventoryCategories]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={isLowStock(item) ? "font-semibold text-orange-600" : ""}>
                            {item.quantity}
                          </span>
                          {isLowStock(item) && (
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                        {item.reorderLevel > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Reorder: {item.reorderLevel}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{item.unitCost.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold">{(item.quantity * item.unitCost).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.location || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.expirationDate ? (
                          <div>
                            <div className={isExpiring(item) ? "text-red-600 font-medium" : ""}>
                              {format(new Date(item.expirationDate), "MMM dd, yyyy")}
                            </div>
                            {item.lotNumber && (
                              <div className="text-xs text-muted-foreground">Lot: {item.lotNumber}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {isLowStock(item) && (
                            <Badge variant="destructive" className="text-xs w-fit">
                              Low Stock
                            </Badge>
                          )}
                          {isExpiring(item) && (
                            <Badge variant="destructive" className="text-xs w-fit">
                              Expiring
                            </Badge>
                          )}
                          {!isLowStock(item) && !isExpiring(item) && (
                            <Badge 
                              variant={item.isActive ? "default" : "secondary"}
                              className="text-xs w-fit"
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No inventory items found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Item Dialog */}
      <InventoryItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={selectedItem}
        onSave={handleSave}
      />
    </div>
  );
}








