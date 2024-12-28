import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Start } from "./pages/start";
import { UserScreen } from "./pages/UserScreen";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Start />} />
                <Route path="/join/:roomId" element={<UserScreen/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
