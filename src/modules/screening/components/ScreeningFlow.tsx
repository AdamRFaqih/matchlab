"use client";

import { useState, useEffect } from "react";
import { CandidateRegistrationForm } from "./CandidateRegistrationForm";
import { ScreeningChatRoom } from "./ScreeningChatRoom";
import type { InterviewSessionData } from "../types";

interface ScreeningFlowProps {
  job: {
    title: string;
    slug: string;
    organization: { name: string };
    maxTurns: number;
    generatedSpec: {
      roleSummary?: string;
      domainWeight?: number;
      implicitWeight?: number;
    };
  };
}

export function ScreeningFlow({ job }: ScreeningFlowProps) {
  const [session, setSession] = useState<InterviewSessionData | null>(null);

  const storageKey = `matchlab_session_${job.slug}`;

  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          setSession(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  const handleRegistered = (newSession: InterviewSessionData) => {
    setSession(newSession);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSession));
    } catch {
      // Ignore localStorage errors
    }
  };

  if (!session) {
    return <CandidateRegistrationForm job={job} onRegistered={handleRegistered} />;
  }

  return <ScreeningChatRoom initialSession={session} />;
}
