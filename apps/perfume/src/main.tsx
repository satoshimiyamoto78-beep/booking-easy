import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { StoreProvider } from "./lib/store";
import { ConfirmHost } from "./components/ui";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <App />
      <ConfirmHost />
    </StoreProvider>
  </StrictMode>,
);
