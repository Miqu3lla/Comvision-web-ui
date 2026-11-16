import { useLabProgress } from '../../hooks/useLabProgress'

/** Free-text notes, saved to localStorage under `noteKey`. */
export default function ObservationBox({ noteKey, title = 'My observation', placeholder = 'What did you see? What changed when you moved the controls?' }:
  { noteKey: string; title?: string; placeholder?: string }) {
  const { note, setNote } = useLabProgress()
  return (
    <div className="mt-4">
      <p className="tag mb-1.5">{title}</p>
      <textarea className="min-h-24 w-full resize-y" value={note(noteKey)} placeholder={placeholder}
        onChange={(e) => setNote(noteKey, e.target.value)} />
    </div>
  )
}
