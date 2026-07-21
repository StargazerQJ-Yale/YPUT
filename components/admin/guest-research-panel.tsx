"use client";

import * as React from "react";
import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  researchGuest,
  updateGuestMatch,
  type ActionResult,
} from "@/lib/actions/guests";
import { GROQ_MODEL_OPTIONS, type GroqModel } from "@/lib/groq-models";
import type { GuestStatus } from "@/lib/generated/prisma/client";

type Lectureship = { id: string; name: string; isCommonlyUsed: boolean };

function ResearchOptions({
  model,
  onModelChange,
  useWebSearch,
  onUseWebSearchChange,
}: {
  model: GroqModel;
  onModelChange: (model: GroqModel) => void;
  useWebSearch: boolean;
  onUseWebSearchChange: (value: boolean) => void;
}) {
  return (
    <div className="w-full space-y-3 rounded-lg border p-3 text-left">
      <div>
        <Label htmlFor="groq-model">Model</Label>
        <Select
          value={model}
          onValueChange={(value) => value && onModelChange(value as GroqModel)}
          items={GROQ_MODEL_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
        >
          <SelectTrigger id="groq-model" className="mt-1.5 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROQ_MODEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="use-web-search">Live web search</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {useWebSearch
              ? "Searches the web (via Tavily) for current info, then Groq summarizes it."
              : "Off — the model answers from its own training data only."}
          </p>
        </div>
        <Switch id="use-web-search" checked={useWebSearch} onCheckedChange={onUseWebSearchChange} />
      </div>
    </div>
  );
}

export function GuestResearchPanel({
  guestId,
  status,
  researchSummary,
  matchReasoning,
  matchedLectureshipId,
  lectureships,
}: {
  guestId: string;
  status: GuestStatus;
  researchSummary: string | null;
  matchReasoning: string | null;
  matchedLectureshipId: string | null;
  lectureships: Lectureship[];
}) {
  const router = useRouter();
  const [researching, startResearching] = useTransition();
  const [model, setModel] = React.useState<GroqModel>("llama-3.3-70b-versatile");
  const [useWebSearch, setUseWebSearch] = React.useState(true);

  function handleResearch() {
    startResearching(async () => {
      const result = await researchGuest(guestId, { model, useWebSearch });
      if (result.success) {
        toast.success("Research complete");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (status === "PENDING") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8 text-center">
        <Sparkles className="size-6 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Not researched yet. AI can look this guest up and suggest a lectureship fund.
        </p>
        <ResearchOptions
          model={model}
          onModelChange={setModel}
          useWebSearch={useWebSearch}
          onUseWebSearchChange={setUseWebSearch}
        />
        <Button onClick={handleResearch} disabled={researching}>
          {researching && <Loader2 className="size-4 animate-spin" />}
          Research with AI
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          AI Research Summary
        </Label>
        <p className="mt-1 whitespace-pre-wrap text-sm">{researchSummary}</p>
      </div>

      {matchReasoning && (
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Match Reasoning
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">{matchReasoning}</p>
        </div>
      )}

      <MatchForm
        guestId={guestId}
        matchedLectureshipId={matchedLectureshipId}
        matchReasoning={matchReasoning}
        lectureships={lectureships}
      />

      <ResearchOptions
        model={model}
        onModelChange={setModel}
        useWebSearch={useWebSearch}
        onUseWebSearchChange={setUseWebSearch}
      />
      <Button variant="outline" size="sm" onClick={handleResearch} disabled={researching}>
        {researching && <Loader2 className="size-4 animate-spin" />}
        Re-research
      </Button>
    </div>
  );
}

function MatchForm({
  guestId,
  matchedLectureshipId,
  matchReasoning,
  lectureships,
}: {
  guestId: string;
  matchedLectureshipId: string | null;
  matchReasoning: string | null;
  lectureships: Lectureship[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateGuestMatch.bind(null, guestId),
    null,
  );
  const [selectedFundId, setSelectedFundId] = React.useState(matchedLectureshipId ?? "");

  useEffect(() => {
    if (state?.success) toast.success("Match confirmed");
    else if (state && !state.success) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-4">
      <div>
        <Label htmlFor="matchedLectureshipId">Matched Lectureship Fund</Label>
        <Select
          name="matchedLectureshipId"
          value={selectedFundId}
          onValueChange={(value) => setSelectedFundId(value ?? "")}
          items={lectureships.map((fund) => ({
            value: fund.id,
            label: fund.isCommonlyUsed ? `★ ${fund.name}` : fund.name,
          }))}
        >
          <SelectTrigger id="matchedLectureshipId" className="mt-1.5 w-full">
            <SelectValue placeholder="Select a fund" />
          </SelectTrigger>
          <SelectContent>
            {lectureships.map((fund) => (
              <SelectItem key={fund.id} value={fund.id}>
                {fund.isCommonlyUsed ? `★ ${fund.name}` : fund.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="matchReasoning">Notes (optional)</Label>
        <Textarea
          id="matchReasoning"
          name="matchReasoning"
          defaultValue={matchReasoning ?? ""}
          className="mt-1.5"
          rows={2}
        />
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Confirm Match
      </Button>
    </form>
  );
}
