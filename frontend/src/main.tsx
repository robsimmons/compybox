import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: "teal", // Change this to any color palette you prefer
    },
  },
});

export const system = createSystem(defaultConfig, config);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
