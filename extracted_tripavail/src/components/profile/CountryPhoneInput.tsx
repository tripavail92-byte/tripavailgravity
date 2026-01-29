import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Phone } from 'lucide-react';
import { Input } from '../ui/input';

interface CountryOption {
  code: string;
  country: string;
  dialCode: string;
  flag: string;
}

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const countries: CountryOption[] = [
  { code: 'PK', country: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'US', country: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', country: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'IN', country: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AE', country: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', country: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'CA', country: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', country: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'TR', country: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'MY', country: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
];

export function CountryPhoneInput({ 
  value, 
  onChange, 
  className = '',
  placeholder = "Enter phone number"
}: CountryPhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Extract country code and phone number from the full value
  const getSelectedCountry = () => {
    for (const country of countries) {
      if (value.startsWith(country.dialCode)) {
        return country;
      }
    }
    return countries[0]; // Default to Pakistan
  };

  const selectedCountry = getSelectedCountry();
  const phoneNumber = value.replace(selectedCountry.dialCode, '').trim();

  const handleCountrySelect = (country: CountryOption) => {
    const cleanPhoneNumber = phoneNumber.replace(/\s+/g, ' ').trim();
    onChange(`${country.dialCode} ${cleanPhoneNumber}`);
    setIsOpen(false);
  };

  const handlePhoneNumberChange = (newPhoneNumber: string) => {
    onChange(`${selectedCountry.dialCode} ${newPhoneNumber}`);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2.5 bg-card dark:bg-card border border-border border-r-0 rounded-l-lg hover:bg-accent dark:hover:bg-accent transition-colors min-w-fit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
        >
          <span className="text-lg leading-none" style={{ fontSize: '18px' }}>{selectedCountry.flag}</span>
          <span className="text-sm font-medium text-foreground">{selectedCountry.dialCode}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneNumberChange(e.target.value)}
          placeholder={placeholder}
          className={`rounded-l-none border-l-0 focus:border-primary focus:ring-primary/20 ${className}`}
        />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-transparent z-[60]"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Country Options */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card dark:bg-card border border-border rounded-lg shadow-xl z-[70] max-h-60 overflow-y-auto"
            >
              {countries.map((country) => (
                <motion.button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent dark:hover:bg-accent transition-colors text-left"
                  whileHover={{ backgroundColor: "var(--accent)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg leading-none" style={{ fontSize: '18px' }}>{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-popover-foreground truncate">{country.country}</span>
                      <span className="text-sm text-muted-foreground ml-2">{country.dialCode}</span>
                    </div>
                  </div>
                  {selectedCountry.code === country.code && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}