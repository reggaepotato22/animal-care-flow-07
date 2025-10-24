import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TreatmentItem, treatmentCategories, TreatmentCategory } from "@/data/treatments";

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

  useEffect(() => {
    if (treatment) {
      setFormData(treatment);
      setTagsInput(treatment.tags.join(", "));
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
    }
  }, [treatment, open]);

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
      tags: tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    onSave(treatmentItem);
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


