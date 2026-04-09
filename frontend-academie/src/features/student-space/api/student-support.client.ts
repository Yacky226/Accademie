import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";

export interface StudentSupportTicketRecord {
  id: string;
  subject: string;
  category: string;
  status: string;
  description: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

type BackendSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  description: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
};

function mapSupportTicket(value: BackendSupportTicket): StudentSupportTicketRecord {
  return {
    id: value.id,
    subject: value.subject,
    category: value.category,
    status: value.status,
    description: value.description,
    resolution: value.resolution ?? null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export async function fetchMySupportTickets() {
  const response = await requestAuthenticatedApiJson<BackendSupportTicket[]>(
    "/api/support/tickets/me",
    { method: "GET" },
    "Impossible de charger vos tickets support.",
  );

  return response.map(mapSupportTicket);
}

export async function createSupportTicket(input: {
  subject: string;
  category: string;
  description: string;
}) {
  const response = await requestAuthenticatedApiJson<BackendSupportTicket>(
    "/api/support/tickets/me",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Impossible d envoyer votre demande au support.",
  );

  return mapSupportTicket(response);
}
