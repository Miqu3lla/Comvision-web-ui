import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { LabMeta } from '../../data/labs'
import { useLabProgress } from '../../hooks/useLabProgress'
import LabHeader from './LabHeader'
import StepTracker from './StepTracker'
import ExperimentStep from './ExperimentStep'
import ImageInput from './ImageInput'
import ConclusionBox from './ConclusionBox'
import LabNavFooter from './LabNavFooter'

interface Props {
  lab: LabMeta
  /** Map step id -> renderer. `file` is the lab's shared image (null if the lab has none). */
  render: Record<string, (file: File) => ReactNode>
  /** Labs with their own data source (5) or inputs (6) skip the shared image picker. */
  sharedImage?: boolean
  /** Per-step "run" button labels. */
  runLabels?: Record<string, string>
  /** Steps that work without the shared image (e.g. webcam, commands). */
  noImageSteps?: string[]
}

/** Shared skeleton for all 7 lab pages: header, image, step tracker, gated steps, conclusion. */
export default function LabLayout({ lab, render, sharedImage = true, runLabels, noImageSteps = [] }: Props) {
  const { isDone, doneCount } = useLabProgress()
  const [file, setFile] = useState<File | null>(null)
  const firstOpen = lab.steps.find((s) => !isDone(lab.n, s.id))?.id ?? lab.steps[lab.steps.length - 1].id
  const [current, setCurrent] = useState(firstOpen)

  // "Continue" links use ?step=<id> (the URL hash is owned by HashRouter)
  const [params] = useSearchParams()
  useEffect(() => { const s = params.get('step'); if (s) document.getElementById(s)?.scrollIntoView() }, [params])
  // Advance the highlighted step when the current one is completed
  useEffect(() => { setCurrent(firstOpen) }, [firstOpen])

  const unlockedUpTo = lab.steps.findIndex((s) => !isDone(lab.n, s.id))
  const limit = unlockedUpTo === -1 ? lab.steps.length : unlockedUpTo
  const needFile = sharedImage && !file

  return (
    <div className="space-y-5">
      {lab.n > 1 && doneCount(lab.n - 1) < 1 && (
        <p className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-muted">
          Recommended: finish <Link to={`/lab/${lab.n - 1}`} className="text-accent underline">Lab {lab.n - 1}</Link> first. You can still continue here.
        </p>
      )}
      <LabHeader lab={lab} />
      {sharedImage && <ImageInput file={file} onChange={setFile} label="Lab image" />}
      <StepTracker steps={lab.steps} current={current} isDone={(id) => isDone(lab.n, id)}
        onPick={(id) => { setCurrent(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }} />
      <div className="space-y-4">
        {lab.steps.map((st, i) => (
          <ExperimentStep key={st.id} lab={lab.n} id={st.id} index={i + 1} title={st.title} instruction={st.instruction}
            locked={i > limit} current={st.id === current} runLabel={runLabels?.[st.id]}>
            {needFile && !noImageSteps.includes(st.id) ? <p className="tag">Choose a sample, upload an image or use the webcam above first.</p>
              : render[st.id]?.(file as File)}
          </ExperimentStep>
        ))}
      </div>
      <ConclusionBox lab={lab.n} />
      <LabNavFooter lab={lab.n} />
    </div>
  )
}
