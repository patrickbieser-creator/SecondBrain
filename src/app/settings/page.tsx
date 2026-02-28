"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SettingsPage() {
  const [availableMinutes, setAvailableMinutes] = useState("240");
  const [deepWork, setDeepWork] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      // For now store in browser localStorage as settings API is not built
      localStorage.setItem("focusos_available_minutes", availableMinutes);
      localStorage.setItem("focusos_deep_work", String(deepWork));
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("focusos_available_minutes");
    if (saved) setAvailableMinutes(saved);
    const dw = localStorage.getItem("focusos_deep_work");
    if (dw) setDeepWork(dw === "true");
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planning Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Available minutes per day</Label>
            <Input
              type="number"
              value={availableMinutes}
              onChange={(e) => setAvailableMinutes(e.target.value)}
              min={30}
              max={600}
              step={30}
            />
            <p className="text-xs text-muted-foreground">
              Used when generating the daily plan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="deep-work-default"
              checked={deepWork}
              onCheckedChange={setDeepWork}
            />
            <div>
              <Label htmlFor="deep-work-default">Default deep work mode</Label>
              <p className="text-xs text-muted-foreground">
                Increases switch penalty between domains
              </p>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Auth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Running in TEST_AUTH mode — no login required.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            User ID: {process.env.NEXT_PUBLIC_TEST_USER_ID ?? "test-user-id-0000"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
