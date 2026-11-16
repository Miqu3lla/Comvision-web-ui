import { Link } from 'react-router-dom'
import { LABS } from '../../data/labs'

export default function LabNavFooter({ lab }: { lab: number }) {
  const prev = LABS.find((l) => l.n === lab - 1), next = LABS.find((l) => l.n === lab + 1)
  return (
    <div className="flex justify-between gap-3 pt-2">
      {prev ? <Link className="btn" to={`/lab/${prev.n}`}>← Lab {prev.n}: {prev.title}</Link> : <span />}
      {next ? <Link className="btn btn-primary" to={`/lab/${next.n}`}>Lab {next.n}: {next.title} →</Link>
        : <Link className="btn btn-primary" to="/">Back to roadmap</Link>}
    </div>
  )
}
