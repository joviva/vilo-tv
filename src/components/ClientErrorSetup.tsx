"use client";

import { useEffect } from "react";
import { setupGlobalErrorHandlers } from "@/lib/errors";

export function ClientErrorSetup() {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return null; // This component doesn't render anything
}

export default ClientErrorSetup;