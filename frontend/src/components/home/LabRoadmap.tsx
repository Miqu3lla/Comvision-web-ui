import { LABS } from '../../data/labs'
import { useLabProgress } from '../../hooks/useLabProgress'
import LabRoadmapNode from './LabRoadmapNode'

export default function LabRoadmap() {
  const { status, doneCount } = useLabProgress()
  return (
    <section>
      <p className="tag mb-4">Roadmap · do them in order</p>
      <ol>
        {LABS.map((l) => <LabRoadmapNode key={l.n} lab={l} status={status(l.n)} done={doneCount(l.n)} />)}
      </ol>
    </section>
  )
}
