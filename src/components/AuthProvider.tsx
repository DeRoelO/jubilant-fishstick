"use client";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/lib/msal/authConfig";
import { ReactNode } from "react";

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize the MSAL instance before passing it to the provider
msalInstance.initialize().then(() => {
    // Initialization complete
});

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <MsalProvider instance={msalInstance}>
            {children}
        </MsalProvider>
    );
}
