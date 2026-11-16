import ObservationBox from './ObservationBox'

export default function ConclusionBox({ lab }: { lab: number }) {
  return (
    <section className="card border-l-4 !border-l-hot p-5">
      <h2 className="mb-1 font-semibold">Conclusion</h2>
      <p className="text-sm text-muted">Summarize what you learned in this lab, as it would appear in your lab report.</p>
      <ObservationBox noteKey={`${lab}:conclusion`} title="Conclusion" placeholder="In this lab I learned that…" />
    </section>
  )
}
