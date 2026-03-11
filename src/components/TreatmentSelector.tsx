import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, DollarSign, Clock, AlertTriangle, Package } from "lucide-react";
import { treatmentItems, treatmentCategories, TreatmentItem } from "@/data/treatments";
import { ScrollArea } from "@/components/ui/scroll-area";
import { canApplyTreatment, deductInventoryForTreatment } from "@/utils/inventory";
import { inventoryItems } from "@/data/inventory";
import { useToast } from "@/hooks/use-toast";

export interface EncounterItem {
  id: string;
  type: 'treatment' | 'lab' | 'admission' | 'vaccination';
  treatmentItemId?: string;
  treatmentCode?: string;
  title: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  discount: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: string;
  performedBy?: string;
  linkedToSection?: 'subjective' | 'objective' | 'assessment' | 'plan';
  notes?: string;
}

interface TreatmentSelectorProps {
  onTreatmentAdded: (treatment: EncounterItem) => void;
  linkedSection?: 'subjective' | 'objective' | 'assessment' | 'plan';
  performedBy?: string;
}

export function TreatmentSelector({ onTreatmentAdded, linkedSection, performedBy }: TreatmentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  // Filter treatments from master catalog
  const filteredTreatments = treatmentItems.filter(item => 
    item.isActive &&
    (selectedCategory === "all" || item.category === selectedCategory) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTreatment = (treatment: TreatmentItem) => {
    // Check if treatment can be applied (inventory availability)
    const availabilityCheck = canApplyTreatment(treatment, 1);
    
    if (!availabilityCheck.canApply) {
      toast({
        title: "Cannot apply treatment",
        description: availabilityCheck.errors.join(", "),
        variant: "destructive"
      });
      return;
    }

    // Deduct inventory
    const deductionResults = deductInventoryForTreatment(treatment, 1);
    
    // Check for any failures in required items
    const failedRequired = deductionResults.filter(
      r => !r.success && treatment.linkedInventory?.find(li => li.inventoryId === r.inventoryId && li.required)
    );

    if (failedRequired.length > 0) {
      toast({
        title: "Inventory deduction failed",
        description: failedRequired.map(r => r.error).join(", "),
        variant: "destructive"
      });
      return;
    }

    // Show success message if inventory was deducted
    if (deductionResults.length > 0) {
      const deductedItems = deductionResults.filter(r => r.success && r.deductedQuantity > 0);
      if (deductedItems.length > 0) {
        toast({
          title: "Inventory updated",
          description: `Deducted ${deductedItems.length} inventory item(s)`,
        });
      }
    }

    const encounterItem: EncounterItem = {
      id: `ENC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'treatment',
      treatmentItemId: treatment.id,
      treatmentCode: treatment.code,
      title: treatment.name,
      category: treatment.category,
      price: treatment.price,
      cost: treatment.cost,
      quantity: 1,
      discount: 0,
      total: treatment.price,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      performedBy: performedBy,
      linkedToSection: linkedSection
    };
    
    onTreatmentAdded(encounterItem);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "medical-procedures": "bg-blue-100 text-blue-800",
      "medications": "bg-purple-100 text-purple-800",
      "lab-tests": "bg-green-100 text-green-800",
      "preventives": "bg-teal-100 text-teal-800",
      "fees-charges": "bg-orange-100 text-orange-800",
      "boarding-grooming": "bg-pink-100 text-pink-800",
      "packages-bundles": "bg-indigo-100 text-indigo-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Treatment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search treatments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(treatmentCategories).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Treatment List */}
        <ScrollArea className="h-[400px] w-full rounded-md border p-2">
          <div className="space-y-2">
            {filteredTreatments.length > 0 ? (
              filteredTreatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="flex flex-col p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleAddTreatment(treatment)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{treatment.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{treatment.code}</div>
                    </div>
                    <div className="flex items-center space-x-1 font-semibold text-sm">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>{treatment.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`${getCategoryColor(treatment.category)} text-xs`}>
                      {treatmentCategories[treatment.category]}
                    </Badge>
                    {treatment.duration > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{treatment.duration}m</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Show linked inventory */}
                  {treatment.linkedInventory && treatment.linkedInventory.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {treatment.linkedInventory.map((linkedItem, idx) => {
                        const invItem = inventoryItems.find(i => i.id === linkedItem.inventoryId);
                        if (!invItem) return null;
                        const hasStock = invItem.quantity >= linkedItem.quantity;
                        return (
                          <div key={idx} className="flex items-center gap-1 text-xs">
                            <Package className={`h-3 w-3 ${hasStock ? 'text-muted-foreground' : 'text-orange-500'}`} />
                            <span className={hasStock ? 'text-muted-foreground' : 'text-orange-600 font-medium'}>
                              {invItem.name} × {linkedItem.quantity}
                            </span>
                            {!hasStock && (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {treatment.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {treatment.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No treatments found
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


