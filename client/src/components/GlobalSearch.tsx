import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, Users, Target, Building2, UserCircle, Briefcase, Receipt, Package } from "lucide-react";

type SearchResult = {
  id: string;
  type: "customer" | "lead" | "account" | "contact" | "deal" | "invoice" | "item";
  title: string;
  subtitle?: string;
  url: string;
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: results = [] } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", query],
    enabled: query.length > 1,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "customer":
        return <Users className="w-4 h-4" />;
      case "lead":
        return <Target className="w-4 h-4" />;
      case "account":
        return <Building2 className="w-4 h-4" />;
      case "contact":
        return <UserCircle className="w-4 h-4" />;
      case "deal":
        return <Briefcase className="w-4 h-4" />;
      case "invoice":
        return <Receipt className="w-4 h-4" />;
      case "item":
        return <Package className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const handleSelect = (url: string) => {
    setOpen(false);
    setLocation(url);
    setQuery("");
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    customer: "Customers",
    lead: "Leads",
    account: "Accounts",
    contact: "Contacts",
    deal: "Deals",
    invoice: "Invoices",
    item: "Products/Services",
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
        data-testid="button-global-search"
      >
        <Search className="w-4 h-4 mr-2" />
        <span>Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search customers, leads, deals, invoices..."
          value={query}
          onValueChange={setQuery}
          data-testid="input-global-search"
        />
        <CommandList>
          {query.length > 1 && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup key={type} heading={typeLabels[type] || type}>
              {items.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result.url)}
                  className="flex items-center gap-3"
                  data-testid={`search-result-${result.type}-${result.id}`}
                >
                  {getIcon(result.type)}
                  <div className="flex flex-col">
                    <span className="font-medium">{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
