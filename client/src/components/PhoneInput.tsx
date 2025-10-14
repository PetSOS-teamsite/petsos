import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Country } from "@shared/schema";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
  testId?: string;
}

export function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder = "Phone number",
  testId,
}: PhoneInputProps) {
  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  // Filter to only active countries and sort by name
  const activeCountries = countries
    .filter((c) => c.active)
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  // Handle input change with proper event handling for React Hook Form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={onCountryCodeChange} disabled={isLoading}>
        <SelectTrigger className="w-[140px]" data-testid={`${testId}-country`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {activeCountries.map((country) => (
            <SelectItem key={country.code} value={country.phonePrefix}>
              {country.flag} {country.phonePrefix}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={value || ""}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1"
        data-testid={testId}
        autoComplete="tel"
      />
    </div>
  );
}
