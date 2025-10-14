import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const countryCodes = [
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
];

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
  // Handle input change with proper event handling for React Hook Form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={onCountryCodeChange}>
        <SelectTrigger className="w-[140px]" data-testid={`${testId}-country`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.flag} {item.code}
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
