import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
// Self-hosted fonts: no render-blocking request to Google Fonts.
// Body — Zen Kaku Gothic New (Latin subset only).
import "@fontsource/zen-kaku-gothic-new/latin-400.css"
import "@fontsource/zen-kaku-gothic-new/latin-500.css"
import "@fontsource/zen-kaku-gothic-new/latin-700.css"
// Headlines — Archivo variable with its width axis, so headings can go extra-wide.
import "@fontsource-variable/archivo/wdth.css"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)
