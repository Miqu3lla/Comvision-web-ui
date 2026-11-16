import HeroBanner from '../components/home/HeroBanner'
import CourseInfoCard from '../components/home/CourseInfoCard'
import ProgressSummary from '../components/home/ProgressSummary'
import LabRoadmap from '../components/home/LabRoadmap'
import SampleGalleryStrip from '../components/home/SampleGalleryStrip'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <HeroBanner />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <LabRoadmap />
        <div className="space-y-4">
          <ProgressSummary />
          <CourseInfoCard />
          <SampleGalleryStrip />
        </div>
      </div>
    </div>
  )
}
