import { Link } from 'react-router-dom'
import { useLabProgress } from '../../hooks/useLabProgress'

/** Jumps to the first unfinished step (hidden until something has been done). */
export default function ContinueButton() {
  const { next, totalDone } = useLabProgress()
  if (!next || totalDone === 0) return null
  return <Link to={`/lab/${next.lab}#${next.step}`} className="btn">Continue · Lab {next.lab} →</Link>
}
