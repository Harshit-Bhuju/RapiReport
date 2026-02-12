import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./index.css";
import "./lib/i18n";

const GOOGLE_CLIENT_ID = "432616575806-ar3p3peq619v4fbcsdb8l8jifpk115or.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>
);

