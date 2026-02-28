"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface WhyPopoverProps {
  explanation: string;
}

export function WhyPopover({ explanation }: WhyPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="sr-only">Why this score?</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">
        <p className="font-semibold mb-1">Score breakdown</p>
        <p className="text-muted-foreground">{explanation}</p>
      </PopoverContent>
    </Popover>
  );
}
