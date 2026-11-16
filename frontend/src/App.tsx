import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import Lab01ImageManipulation from './pages/Lab01ImageManipulation'
import Lab02EdgeDetection from './pages/Lab02EdgeDetection'
import Lab03Histogram from './pages/Lab03Histogram'
import Lab04SurfFeatures from './pages/Lab04SurfFeatures'
import Lab05PcaEigenfaces from './pages/Lab05PcaEigenfaces'
import Lab06YoloDetection from './pages/Lab06YoloDetection'
import Lab07Segmentation from './pages/Lab07Segmentation'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="lab/1" element={<Lab01ImageManipulation />} />
          <Route path="lab/2" element={<Lab02EdgeDetection />} />
          <Route path="lab/3" element={<Lab03Histogram />} />
          <Route path="lab/4" element={<Lab04SurfFeatures />} />
          <Route path="lab/5" element={<Lab05PcaEigenfaces />} />
          <Route path="lab/6" element={<Lab06YoloDetection />} />
          <Route path="lab/7" element={<Lab07Segmentation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
