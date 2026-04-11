import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BreedComboboxProps {
  breeds: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function BreedCombobox({
  breeds,
  value,
  onChange,
  placeholder = "Search or type a breed…",
  disabled = false,
}: BreedComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleSelect = (selected: string) => {
    onChange(selected);
    setSearch("");
    setOpen(false);
  };

  const handleUseCustom = () => {
    if (search.trim()) {
      onChange(search.trim());
      setSearch("");
      setOpen(false);
    }
  };

  // Check if the current search text matches any breed exactly (case-insensitive)
  const exactMatch = breeds.some(
    (b) => b.toLowerCase() === search.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button
                  type="button"
                  onClick={handleUseCustom}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer"
                >
                  Use custom breed: <span className="font-semibold">"{search.trim()}"</span>
                </button>
              ) : (
                "No breeds found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {breeds.map((breed) => (
                <CommandItem
                  key={breed}
                  value={breed}
                  onSelect={() => handleSelect(breed)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === breed ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {breed}
                </CommandItem>
              ))}
            </CommandGroup>
            {search.trim() && !exactMatch && (
              <CommandGroup heading="Custom">
                <CommandItem
                  value={`custom-${search.trim()}`}
                  onSelect={handleUseCustom}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Use: <span className="font-semibold ml-1">"{search.trim()}"</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
