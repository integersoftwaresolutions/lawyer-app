import RoutesRoot from "./routes/index.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import Gateway from "./components/Gateway";

export default function App() {
  return (
    <ThemeProvider>
      <Gateway>
        <RoutesRoot />
      </Gateway>
    </ThemeProvider>
  );
}
