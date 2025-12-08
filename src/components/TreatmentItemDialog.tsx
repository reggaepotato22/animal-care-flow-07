import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TreatmentItem, treatmentCategories, TreatmentCategory, LinkedInventoryItem } from "@/data/treatments";
import { inventoryItems, InventoryItem } from "@/data/inventory";
import { X, Plus } from "lucide-react";

interface TreatmentItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment?: TreatmentItem;
  onSave: (treatment: TreatmentItem) => void;
}

export function TreatmentItemDialog({ open, onOpenChange, treatment, onSave }: TreatmentItemDialogProps) {
  const [formData, setFormData] = useState<Partial<TreatmentItem>>({
    code: "",
    name: "",
    category: "medical-procedures" as TreatmentCategory,
    description: "",
    price: 0,
    cost: 0,
    duration: 0,
    isActive: true,
    requiresAppointment: false,
    taxable: true,
    requiresPrescription: false,
    tags: []
  });

  const [tagsInput, setTagsInput] = useState("");
  const [linkedInventory, setLinkedInventory] = useState<LinkedInventoryItem[]>([]);
  const [newInventoryItem, setNewInventoryItem] = useState<{ inventoryId: string; quantity: number; required: boolean }>({
    inventoryId: "",
    quantity: 1,
    required: true
  });

  useEffect(() => {
    if (treatment) {
      setFormData(treatment);
      setTagsInput(treatment.tags.join(", "));
      setLinkedInventory(treatment.linkedInventory || []);
    } else {
      setFormData({
        code: "",
        name: "",
        category: "medical-procedures" as TreatmentCategory,
        description: "",
        price: 0,
        cost: 0,
        duration: 0,
        isActive: true,
        requiresAppointment: false,
        taxable: true,
        requiresPrescription: false,
        tags: []
      });
      setTagsInput("");
      setLinkedInventory([]);
    }
    setNewInventoryItem({ inventoryId: "", quantity: 1, required: true });
  }, [treatment, open]);

  const handleAddLinkedInventory = () => {
    if (newInventoryItem.inventoryId && newInventoryItem.quantity > 0) {
      setLinkedInventory([...linkedInventory, { ...newInventoryItem }]);
      setNewInventoryItem({ inventoryId: "", quantity: 1, required: true });
    }
  };

  const handleRemoveLinkedInventory = (index: number) => {
    setLinkedInventory(linkedInventory.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const treatmentItem: TreatmentItem = {
      id: treatment?.id || `T-${Date.now()}`,
      code: formData.code || "",
      name: formData.name || "",
      category: formData.category as TreatmentCategory,
      description: formData.description || "",
      price: Number(formData.price) || 0,
      cost: Number(formData.cost) || 0,
      duration: Number(formData.duration) || 0,
      isActive: formData.isActive ?? true,
      requiresAppointment: formData.requiresAppointment ?? false,
      taxable: formData.taxable ?? true,
      requiresPrescription: formData.requiresPrescription ?? false,
      tags: tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
      linkedInventory: linkedInventory.length > 0 ? linkedInventory : undefined
    };

    onSave(treatmentItem);
  };

  const getInventoryItemName = (inventoryId: string) => {
    const item = inventoryItems.find(i => i.id === inventoryId);
    return item ? `${item.name} (${item.sku})` : "Unknown Item";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {treatment ? "Edit Treatment Item" : "Add New Treatment Item"}
          </DialogTitle>
          <DialogDescription>
            {treatment ? "Update the treatment item details." : "Add a new treatment item to the master catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Treatment Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., EXAM-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Treatment Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Comprehensive Examination"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as TreatmentCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(treatmentCategories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the treatment"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., exam, wellness, routine"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  Active Item
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresAppointment"
                  checked={formData.requiresAppointment}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresAppointment: checked as boolean })}
                />
                <Label htmlFor="requiresAppointment" className="font-normal cursor-pointer">
                  Requires Appointment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxable"
                  checked={formData.taxable}
                  onCheckedChange={(checked) => setFormData({ ...formData, taxable: checked as boolean })}
                />
                <Label htmlFor="taxable" className="font-normal cursor-pointer">
                  Taxable
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresPrescription"
                  checked={formData.requiresPrescription}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresPrescription: checked as boolean })}
                />
                <Label htmlFor="requiresPrescription" className="font-normal cursor-pointer">
                  Requires Prescription
                </Label>
              </div>
            </div>

            {/* Linked Inventory */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Linked Inventory Items</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Select inventory items that will be automatically deducted when this treatment is applied.
              </p>

              {/* Existing Linked Inventory Items */}
              {linkedInventory.length > 0 && (
                <div className="space-y-2">
                  {linkedInventory.map((item, index) => {
                    const invItem = inventoryItems.find(i => i.id === item.inventoryId);
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{getInventoryItemName(item.inventoryId)}</div>
                          <div className="text-xs text-muted-foreground">
                            Quantity: {item.quantity} {invItem?.unit || ""} • {item.required ? "Required" : "Optional"}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLinkedInventory(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Linked Inventory Item */}
              <div className="space-y-2 p-3 border rounded-md">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Inventory Item</Label>
                    <Select
                      value={newInventoryItem.inventoryId}
                      onValueChange={(value) => setNewInventoryItem({ ...newInventoryItem, inventoryId: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.filter(item => item.isActive).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity per Treatment</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="1"
                      value={newInventoryItem.quantity}
                      onChange={(e) => setNewInventoryItem({ ...newInventoryItem, quantity: parseFloat(e.target.value) || 1 })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Required</Label>
                    <div className="flex items-center h-9">
                      <Checkbox
                        checked={newInventoryItem.required}
                        onCheckedChange={(checked) => setNewInventoryItem({ ...newInventoryItem, required: checked as boolean })}
                      />
                      <Label className="text-xs ml-2 font-normal">Required</Label>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLinkedInventory}
                  disabled={!newInventoryItem.inventoryId || newInventoryItem.quantity <= 0}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Inventory Item
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {treatment ? "Update Treatment" : "Add Treatment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


