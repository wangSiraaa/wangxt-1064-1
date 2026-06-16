import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import RoleSelect from '@/pages/RoleSelect'
import CoachSchedule from '@/pages/CoachSchedule'
import CourseBooking from '@/pages/CourseBooking'
import WarningManagement from '@/pages/WarningManagement'
import MyBookings from '@/pages/MyBookings'
import LessonManagement from '@/pages/LessonManagement'
import SupportDesk from '@/pages/SupportDesk'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RoleSelect />} />
          <Route path="/coach" element={<CoachSchedule />} />
          <Route path="/booking" element={<CourseBooking />} />
          <Route path="/warnings" element={<WarningManagement />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/lessons" element={<LessonManagement />} />
          <Route path="/support" element={<SupportDesk />} />
        </Route>
      </Routes>
    </Router>
  )
}
