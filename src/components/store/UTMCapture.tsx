"use client";

import { useEffect } from "react";
import { captureUTMFromLocation } from "@/lib/utm";

export function UTMCapture() {
  useEffect(() => {
    captureUTMFromLocation();
  }, []);

  return null;
}
