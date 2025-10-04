import { useState } from "react";
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
import { DOG_BREEDS, CAT_BREEDS } from "@shared/breeds";

interface BreedComboboxProps {
  species: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}

export function BreedCombobox({
  species,
  value,
  onChange,
  placeholder = "Select or type breed...",
  disabled = false,
  testId = "combobox-breed"
}: BreedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const breeds = species === "dog" ? DOG_BREEDS : species === "cat" ? CAT_BREEDS : [];

  // Filter breeds based on search
  const filteredBreeds = breeds.filter(breed =>
    breed.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleInputChange = (search: string) => {
    setSearchValue(search);
    // Allow custom input: if user types something not in the list, use it as the value
    if (search && !breeds.some(b => b.toLowerCase() === search.toLowerCase())) {
      onChange(search);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-testid={testId}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search or type breed..." 
            value={searchValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {searchValue ? (
                <div className="py-2 text-center text-sm">
                  Press Enter to use "{searchValue}"
                </div>
              ) : (
                "No breed found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredBreeds.map((breed) => (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
