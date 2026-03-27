import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { AdvisorsLayout } from './layouts/AdvisorsLayout';
import { Home } from './pages/Home';
import { Feed } from './pages/advisors/Feed';
import { AvailableChecks } from './pages/advisors/AvailableChecks';
import { Settings } from './pages/advisors/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/advisors" element={<AdvisorsLayout />}>
          <Route index element={<Navigate to="feed" replace />} />
          <Route path="feed" element={<Feed />} />
          <Route path="available" element={<AvailableChecks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}
