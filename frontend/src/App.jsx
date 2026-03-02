import RoutesRoot from "./routes/index.jsx";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <RoutesRoot />
    </ThemeProvider>
  );
}
