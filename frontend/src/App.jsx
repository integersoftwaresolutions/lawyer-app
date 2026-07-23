import RoutesRoot from "./routes/index.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { LogoutConfirmProvider } from "./context/LogoutConfirmContext.jsx";
import NotificationSocketProvider from "./context/NotificationSocketProvider.jsx";
import Gateway from "./components/Gateway";

export default function App() {
  return (
    <ThemeProvider>
      <LogoutConfirmProvider>
        <NotificationSocketProvider>
          <Gateway>
            <RoutesRoot />
          </Gateway>
        </NotificationSocketProvider>
      </LogoutConfirmProvider>
    </ThemeProvider>
  );
}
