import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/api/client";
const API_BASE_URL = getApiBaseUrl();

type Announcement = {
  title: string;
  description?: string;
  expiresAt?: string;
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/announcements/active`)
      .then((r) => r.json())
      .then((body) => setAnnouncement(body?.data?.announcement ?? null))
      .catch(() => {});
  }, []);

  if (!announcement) return null;

  return (
    <div className="announcement-bar font-semibold text-sm sm:text-base border-b-4 border-primary-foreground/20">
      <div className="container-custom flex flex-col items-center justify-center gap-0.5 leading-tight">
        <p className="text-center font-bold">{announcement.title}</p>
        {announcement.description && (
          <p className="text-center font-semibold opacity-90">
            {announcement.description}
          </p>
        )}
      </div>
    </div>
  );
}
