import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
// Self-hosted (Latin subset only): no render-blocking request to Google Fonts, no 85 KB font CSS.
import "@fontsource/zen-kaku-gothic-new/latin-400.css"
import "@fontsource/zen-kaku-gothic-new/latin-500.css"
import "@fontsource/zen-kaku-gothic-new/latin-700.css"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)