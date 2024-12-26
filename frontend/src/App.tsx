import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export const API_BASE = 'https://speed-dating-f38da0073ab0.herokuapp.com'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path = '/'/>
      </Routes>
    </BrowserRouter>
  );
}

export default App
