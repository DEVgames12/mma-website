import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CoursesPage from './pages/CoursesPage';
import Classes710Page from './pages/Classes710Page';
import Classes1112Page from './pages/Classes1112Page';
import FacilitiesPage from './pages/FacilitiesPage';
import TimetablePage from './pages/TimetablePage';
import StudyEnvironmentPage from './pages/StudyEnvironmentPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import PortalPage from './pages/PortalPage';
import ResourcesPage from './pages/ResourcesPage';
import AcademicListPage from './pages/AcademicListPage';
import FeesPage from './pages/FeesPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/classes-7-10" element={<Classes710Page />} />
        <Route path="courses/classes-11-12" element={<Classes1112Page />} />
        <Route path="facilities" element={<FacilitiesPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="study-environment" element={<StudyEnvironmentPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="admin/dashboard" element={<PortalPage />} />
        <Route path="teacher/dashboard" element={<PortalPage />} />
        <Route path="student/dashboard" element={<PortalPage />} />
        <Route path="student/resources" element={<ResourcesPage mode="student" />} />
        <Route path="student/tests" element={<AcademicListPage kind="tests" role="student" />} />
        <Route path="student/timetable" element={<AcademicListPage kind="timetable" role="student" />} />
        <Route path="student/fees" element={<FeesPage mode="student" />} />
        <Route path="teacher/resources" element={<ResourcesPage mode="teacher" />} />
        <Route path="teacher/tests" element={<AcademicListPage kind="tests" role="teacher" />} />
        <Route path="teacher/timetable" element={<AcademicListPage kind="timetable" role="teacher" />} />
        <Route path="admin/tests" element={<AcademicListPage kind="tests" role="admin" />} />
        <Route path="admin/fees" element={<FeesPage mode="admin" />} />
        <Route path="admin/payments" element={<FeesPage mode="admin" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
