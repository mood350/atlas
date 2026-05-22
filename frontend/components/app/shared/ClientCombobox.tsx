"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useClientSearch } from "@/hooks/use-clients";
import { cn } from "@/lib/utils";

interface ClientComboboxProps {
  value: number | null;
  onChange: (id: number, name: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

/**
 * Searchable client picker for forms. Debounces keystrokes via React
 * Query's stale-time and shows results in a popover.
 */
export function ClientCombobox({
  value,
  onChange,
  placeholder = "Sélectionner un client",
  hasError = false,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [valueLabel, setValueLabel] = useState<string>("");

  const { data, isLoading } = useClientSearch(query);

  useEffect(() => {
    // Keep the trigger label in sync with the selected client.
    if (!value) setValueLabel("");
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border bg-surface px-3 text-[14px]",
          "transition-colors hover:bg-background-muted",
          hasError
            ? "border-destructive ring-3 ring-destructive/20"
            : "border-input",
          !valueLabel && "text-foreground-muted",
        )}
      >
        <span className="truncate text-left">{valueLabel || placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-foreground-subtle" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Rechercher un client..."
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-[13px] text-foreground-muted">
                <Search className="mr-2 h-3.5 w-3.5 animate-pulse" />
                Recherche...
              </div>
            ) : null}

            {!isLoading && (data?.length ?? 0) === 0 && query.length >= 2 ? (
              <CommandEmpty>Aucun client trouvé.</CommandEmpty>
            ) : null}

            {!isLoading && query.length < 2 ? (
              <div className="px-3 py-4 text-[13px] text-foreground-muted">
                Tapez au moins 2 caractères pour rechercher.
              </div>
            ) : null}

            {data && data.length > 0 ? (
              <CommandGroup>
                {data.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`${client.id}`}
                    onSelect={() => {
                      onChange(client.id, client.name);
                      setValueLabel(client.name);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{client.name}</div>
                      {client.city ? (
                        <div className="truncate text-[11px] text-foreground-subtle">
                          {client.city}
                          {client.country ? `, ${client.country}` : ""}
                        </div>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
