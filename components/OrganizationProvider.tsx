"use client";

import { createContext, useContext } from "react";
import type { Organization } from "@/lib/organization-utils";

const OrganizationContext = createContext<Organization | null>(null);

export function OrganizationProvider({
  organization,
  children,
}: Readonly<{ organization: Organization; children: React.ReactNode }>) {
  return (
    <OrganizationContext.Provider value={organization}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): Organization {
  const org = useContext(OrganizationContext);
  if (!org) {
    throw new Error(
      "useOrganization doit être utilisé sous <OrganizationProvider>."
    );
  }
  return org;
}
