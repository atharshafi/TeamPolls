import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CreatePoll from './pages/CreatePoll'
import VotePoll from './pages/VotePoll'
import Results from './pages/Results'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreatePoll />} />
        <Route path="/poll/:id/vote" element={<VotePoll />} />
        <Route path="/poll/:id/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}